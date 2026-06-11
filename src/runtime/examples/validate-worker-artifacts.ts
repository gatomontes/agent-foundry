import { readFileSync } from "node:fs";
import path from "node:path";

import { validateCodexSkillBundle } from "../schema/codex-skill-validator.js";
import { validateJsonFile } from "../schema/validator.js";

function readManifest(
  runPath: string,
): { deploymentTarget: string; workers: Array<{ id: string; specFile: string }> } {
  const manifestPath = path.join(runPath, "11-workers-manifest.json");
  return JSON.parse(readFileSync(manifestPath, "utf8")) as {
    deploymentTarget: string;
    workers: Array<{ id: string; specFile: string }>;
  };
}

function main(): void {
  const runPath = process.argv[2];

  if (!runPath) {
    throw new Error("Usage: validate-worker-artifacts <run-path>");
  }

  const manifestPath = path.join(runPath, "11-workers-manifest.json");
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

  const manifestResult = validateJsonFile(manifestPath, "foundry.worker-manifest.v1.schema.json");

  if (!manifestResult.valid) {
    console.error(`Manifest validation failed for ${manifestPath}`);
    for (const issue of manifestResult.issues) {
      console.error(`- ${issue.path}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const manifest = readManifest(runPath);
  let failed = false;

  for (const worker of manifest.workers) {
    const workerPath = path.join(runPath, worker.specFile);
    const workerResult = validateJsonFile(workerPath, "foundry.worker-spec.v1.schema.json");

    if (!workerResult.valid) {
      failed = true;
      console.error(`Worker spec validation failed for ${workerPath}`);
      for (const issue of workerResult.issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
    } else {
      console.log(`Validated ${workerPath}`);
    }
  }

  if (manifest.deploymentTarget === "codex-skill") {
    for (const worker of manifest.workers) {
      const bundlePath = path.join(runPath, "12-codex-skills", worker.id);
      const bundleResult = validateCodexSkillBundle(bundlePath);

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

  if (!failed) {
    console.log(`Validated run package ${runPackageManifestPath}`);
    console.log(`Validated manifest ${manifestPath}`);
  } else {
    process.exitCode = 1;
  }
}

main();
