import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import { validateCodexSkillBundle } from "../schema/codex-skill-validator.js";

function discoverBundlePaths(runPath: string): string[] {
  const rootPath = path.join(runPath, "12-codex-skills");

  return readdirSync(rootPath)
    .map((entry) => path.join(rootPath, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory());
}

function main(): void {
  const runPath = process.argv[2];

  if (!runPath) {
    throw new Error("Usage: validate-codex-skill-bundles <run-path>");
  }

  const bundlePaths = discoverBundlePaths(runPath);

  if (bundlePaths.length === 0) {
    throw new Error(`No codex skill bundles found under ${path.join(runPath, "12-codex-skills")}`);
  }

  let failed = false;

  for (const bundlePath of bundlePaths) {
    const result = validateCodexSkillBundle(bundlePath);

    if (!result.valid) {
      failed = true;
      console.error(`Codex skill bundle validation failed for ${bundlePath}`);
      for (const issue of result.issues) {
        console.error(`- ${issue.path}: ${issue.message}`);
      }
      continue;
    }

    console.log(`Validated codex skill bundle ${bundlePath}`);
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main();
