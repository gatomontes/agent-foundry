import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILE_NAMES = [".foundry.env", ".env.local"];

let cachedEnv: Map<string, string> | null = null;

function parseLine(line: string): [string, string] | null {
  const trimmed = line.trim();

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return key.length > 0 ? [key, value] : null;
}

function loadRepoEnv(): Map<string, string> {
  const values = new Map<string, string>();
  const cwd = process.cwd();

  for (const fileName of ENV_FILE_NAMES) {
    const filePath = path.join(cwd, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const contents = readFileSync(filePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const parsed = parseLine(line);

      if (!parsed) {
        continue;
      }

      const [key, value] = parsed;
      values.set(key, value);
    }
  }

  return values;
}

export function getFoundryEnv(key: string): string | null {
  const directValue = process.env[key]?.trim() ?? "";

  if (directValue.length > 0) {
    return directValue;
  }

  if (!cachedEnv) {
    cachedEnv = loadRepoEnv();
  }

  const fileValue = cachedEnv.get(key)?.trim() ?? "";
  return fileValue.length > 0 ? fileValue : null;
}

export function resetFoundryEnvCache(): void {
  cachedEnv = null;
}
