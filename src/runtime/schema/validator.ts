import { readFileSync } from "node:fs";
import path from "node:path";

import type { JsonSchema, ValidationIssue, ValidationResult } from "./types.js";

function appendIssue(issues: ValidationIssue[], pathLabel: string, message: string): void {
  issues.push({ path: pathLabel, message });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateValue(value: unknown, schema: JsonSchema, pathLabel: string, issues: ValidationIssue[]): void {
  if (schema.type === "object") {
    if (!isObject(value)) {
      appendIssue(issues, pathLabel, "Expected object.");
      return;
    }

    const properties = schema.properties ?? {};
    const required = schema.required ?? [];

    for (const key of required) {
      if (!(key in value)) {
        appendIssue(issues, pathLabel, `Missing required property "${key}".`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          appendIssue(issues, `${pathLabel}.${key}`, "Unexpected property.");
        }
      }
    }

    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in value) {
        validateValue(value[key], childSchema, `${pathLabel}.${key}`, issues);
      }
    }

    return;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      appendIssue(issues, pathLabel, "Expected array.");
      return;
    }

    if (schema.minItems !== undefined && value.length < schema.minItems) {
      appendIssue(issues, pathLabel, `Expected at least ${schema.minItems} items.`);
    }

    if (schema.items) {
      value.forEach((item, index) => validateValue(item, schema.items!, `${pathLabel}[${index}]`, issues));
    }

    return;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      appendIssue(issues, pathLabel, "Expected string.");
      return;
    }

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      appendIssue(issues, pathLabel, `Expected minimum length ${schema.minLength}.`);
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      appendIssue(issues, pathLabel, `Expected value to match ${schema.pattern}.`);
    }
  }

  if (schema.type === "integer") {
    if (!Number.isInteger(value)) {
      appendIssue(issues, pathLabel, "Expected integer.");
      return;
    }

    if (schema.minimum !== undefined && Number(value) < schema.minimum) {
      appendIssue(issues, pathLabel, `Expected minimum value ${schema.minimum}.`);
    }
  }

  if (schema.type === "boolean" && typeof value !== "boolean") {
    appendIssue(issues, pathLabel, "Expected boolean.");
    return;
  }

  if (schema.const !== undefined && value !== schema.const) {
    appendIssue(issues, pathLabel, `Expected constant value "${schema.const}".`);
  }

  if (schema.enum && !schema.enum.includes(String(value))) {
    appendIssue(issues, pathLabel, `Expected one of: ${schema.enum.join(", ")}.`);
  }
}

function schemaPath(fileName: string): string {
  if (fileName.startsWith("citadel.")) {
    return path.join(process.cwd(), "..", "citadel", "schema", fileName);
  }

  return path.join(process.cwd(), "schema", fileName);
}

export function loadSchema(fileName: string): JsonSchema {
  return JSON.parse(readFileSync(schemaPath(fileName), "utf8")) as JsonSchema;
}

export function validateAgainstSchema(
  value: unknown,
  schema: JsonSchema,
  rootLabel = "$",
): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateValue(value, schema, rootLabel, issues);
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateJsonFile(filePath: string, schemaFileName: string): ValidationResult {
  const value = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  const schema = loadSchema(schemaFileName);
  return validateAgainstSchema(value, schema);
}
