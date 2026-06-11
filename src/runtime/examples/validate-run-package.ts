import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { validateCodexSkillBundle } from "../schema/codex-skill-validator.js";
import { validateJsonFile } from "../schema/validator.js";

interface RunPackageManifest {
  deploymentTarget: string;
  includedFiles: string[];
  includedDirectories: string[];
  workerSpecPaths: string[];
  codexSkillBundlePaths: string[];
  workerManifestPath?: string;
  packageRoot: ".";
  hashManifestPath: string;
  signaturePath?: string;
}

function readRunPackageManifest(runPath: string): RunPackageManifest {
  const manifestPath = path.join(runPath, "13-run-package-manifest.json");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as RunPackageManifest;
}

function resolvePackagePath(runPath: string, packagePath: string): string {
  return path.resolve(runPath, packagePath);
}

function main(): void {
  const runPath = process.argv[2];

  if (!runPath) {
    throw new Error("Usage: validate-run-package <run-path>");
  }

  const runPackageManifestPath = path.join(runPath, "13-run-package-manifest.json");
  const runPackageResult = validateJsonFile(runPackageManifestPath, "foundry.run-package.v1.schema.json");

  if (!runPackageResult.valid) {
    console.error(`Run package validation failed for ${runPackageManifestPath}`);
    for (const issue of runPackageResult.issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const runPackage = readRunPackageManifest(runPath);
  let failed = false;

  for (const directoryPath of runPackage.includedDirectories) {
    if (!existsSync(resolvePackagePath(runPath, directoryPath))) {
      failed = true;
      console.error(`Missing packaged directory ${directoryPath}`);
    }
  }

  for (const filePath of runPackage.includedFiles) {
    if (!existsSync(resolvePackagePath(runPath, filePath))) {
      failed = true;
      console.error(`Missing packaged file ${filePath}`);
    }
  }

  if (runPackage.workerManifestPath) {
    const workerManifestResult = validateJsonFile(
      resolvePackagePath(runPath, runPackage.workerManifestPath),
      "foundry.worker-manifest.v1.schema.json",
    );

    if (!workerManifestResult.valid) {
      failed = true;
      console.error(`Worker manifest validation failed for ${runPackage.workerManifestPath}`);
      for (const issue of workerManifestResult.issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
    } else {
      console.log(`Validated worker manifest ${runPackage.workerManifestPath}`);
    }
  }

  for (const workerSpecPath of runPackage.workerSpecPaths) {
    const workerSpecResult = validateJsonFile(
      resolvePackagePath(runPath, workerSpecPath),
      "foundry.worker-spec.v1.schema.json",
    );

    if (!workerSpecResult.valid) {
      failed = true;
      console.error(`Worker spec validation failed for ${workerSpecPath}`);
      for (const issue of workerSpecResult.issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
    } else {
      console.log(`Validated worker spec ${workerSpecPath}`);
    }
  }

  if (runPackage.deploymentTarget === "codex-skill") {
    for (const bundlePath of runPackage.codexSkillBundlePaths) {
      const bundleResult = validateCodexSkillBundle(resolvePackagePath(runPath, bundlePath));

      if (!bundleResult.valid) {
        failed = true;
        console.error(`Codex skill bundle validation failed for ${bundlePath}`);
        for (const issue of bundleResult.issues) {
          console.error(`- ${issue.path}: ${issue.message}`);
        }
      } else {
        console.log(`Validated codex skill bundle ${bundlePath}`);
      }
    }
  }

  if (!existsSync(resolvePackagePath(runPath, runPackage.hashManifestPath))) {
    failed = true;
    console.error(`Missing hash manifest ${runPackage.hashManifestPath}`);
  }

  if (runPackage.signaturePath && !existsSync(resolvePackagePath(runPath, runPackage.signaturePath))) {
    failed = true;
    console.error(`Missing manifest signature ${runPackage.signaturePath}`);
  }

  if (!failed) {
    console.log(`Validated run package ${runPackageManifestPath}`);
  } else {
    process.exitCode = 1;
  }
}

main();
