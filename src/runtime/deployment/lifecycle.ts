import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { validateJsonFile } from "../schema/validator.js";

interface RunPackageManifest {
  deploymentTarget: string;
  includedDirectories: string[];
  includedFiles: string[];
  workerManifestPath?: string;
  workerSpecPaths: string[];
  codexSkillBundlePaths: string[];
  hashManifestPath: string;
  signaturePath?: string;
}

export interface DeliverRunPackageResult {
  targetDir: string;
  deliveredPackagePath: string;
}

function readRunPackageManifest(runPath: string): RunPackageManifest {
  return JSON.parse(
    readFileSync(path.join(runPath, "13-run-package-manifest.json"), "utf8"),
  ) as RunPackageManifest;
}

function resolvePackagePath(runPath: string, packagePath: string): string {
  return path.resolve(runPath, packagePath);
}

function validateRunPackage(runPath: string): void {
  const runPackageManifestPath = path.join(runPath, "13-run-package-manifest.json");
  const runPackageResult = validateJsonFile(runPackageManifestPath, "foundry.run-package.v1.schema.json");

  if (!runPackageResult.valid) {
    throw new Error(
      `Refusing to export invalid run package ${runPackageManifestPath}: ${runPackageResult.issues
        .map((issue) => `${issue.path} ${issue.message}`)
        .join(" | ")}`,
    );
  }

  const runPackage = readRunPackageManifest(runPath);

  for (const directoryPath of runPackage.includedDirectories) {
    if (!existsSync(resolvePackagePath(runPath, directoryPath))) {
      throw new Error(`Refusing to deliver package with missing directory ${directoryPath}.`);
    }
  }

  for (const filePath of runPackage.includedFiles) {
    if (!existsSync(resolvePackagePath(runPath, filePath))) {
      throw new Error(`Refusing to deliver package with missing file ${filePath}.`);
    }
  }

  if (runPackage.workerManifestPath) {
    const workerManifestPath = resolvePackagePath(runPath, runPackage.workerManifestPath);
    const workerManifestResult = validateJsonFile(
      workerManifestPath,
      "foundry.worker-manifest.v1.schema.json",
    );

    if (!workerManifestResult.valid) {
      throw new Error(
        `Refusing to deliver package with invalid worker manifest ${workerManifestPath}: ${workerManifestResult.issues
          .map((issue) => `${issue.path} ${issue.message}`)
          .join(" | ")}`,
      );
    }
  }

  for (const workerSpecPath of runPackage.workerSpecPaths) {
    const resolvedWorkerSpecPath = resolvePackagePath(runPath, workerSpecPath);
    const workerSpecResult = validateJsonFile(resolvedWorkerSpecPath, "foundry.worker-spec.v1.schema.json");

    if (!workerSpecResult.valid) {
      throw new Error(
        `Refusing to deliver package with invalid worker spec ${resolvedWorkerSpecPath}: ${workerSpecResult.issues
          .map((issue) => `${issue.path} ${issue.message}`)
          .join(" | ")}`,
      );
    }
  }

  if (!existsSync(resolvePackagePath(runPath, runPackage.hashManifestPath))) {
    throw new Error(`Refusing to deliver package with missing hash manifest ${runPackage.hashManifestPath}.`);
  }

  if (runPackage.signaturePath && !existsSync(resolvePackagePath(runPath, runPackage.signaturePath))) {
    throw new Error(`Refusing to deliver package with missing manifest signature ${runPackage.signaturePath}.`);
  }
}

export function deliverRunPackage(
  runPath: string,
  targetDir: string,
  force = false,
): DeliverRunPackageResult {
  validateRunPackage(runPath);
  mkdirSync(targetDir, { recursive: true });
  const deliveredPackagePath = path.join(targetDir, path.basename(runPath));

  if (existsSync(deliveredPackagePath)) {
    if (!force) {
      throw new Error(
        `Destination ${deliveredPackagePath} already exists. Re-run with force enabled to replace it.`,
      );
    }

    rmSync(deliveredPackagePath, { recursive: true, force: true });
  }

  cpSync(runPath, deliveredPackagePath, { recursive: true });

  return {
    targetDir,
    deliveredPackagePath,
  };
}
