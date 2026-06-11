import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { CodexSkillBundleValidationResult, ValidationIssue } from "./types.js";

function appendIssue(issues: ValidationIssue[], pathLabel: string, message: string): void {
  issues.push({ path: pathLabel, message });
}

function parseFrontmatter(markdown: string): Record<string, string> | null {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);

  if (!match) {
    return null;
  }

  const frontmatter: Record<string, string> = {};
  const frontmatterBody = match[1] ?? "";

  for (const rawLine of frontmatterBody.split(/\r?\n/)) {
    const separatorIndex = rawLine.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = rawLine.slice(0, separatorIndex).trim();
    const value = rawLine.slice(separatorIndex + 1).trim();
    frontmatter[key] = value;
  }

  return frontmatter;
}

function validateSkillMarkdown(bundlePath: string, skillPath: string, issues: ValidationIssue[]): void {
  if (!existsSync(skillPath)) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, "Missing SKILL.md.");
    return;
  }

  const markdown = readFileSync(skillPath, "utf8");
  const frontmatter = parseFrontmatter(markdown);

  if (!frontmatter) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, "Missing YAML frontmatter block.");
    return;
  }

  const name = frontmatter.name?.trim() ?? "";
  const description = frontmatter.description?.trim() ?? "";

  if (name.length === 0) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, 'Frontmatter field "name" is required.');
  }

  if (description.length === 0) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, 'Frontmatter field "description" is required.');
  }

  if (!/^#\s+.+$/m.test(markdown)) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, "A top-level heading is required.");
  }

  if (!markdown.includes("## Primary Responsibility")) {
    appendIssue(issues, `${bundlePath}/SKILL.md`, 'Expected section "## Primary Responsibility".');
  }
}

function validateAgentYaml(bundlePath: string, agentPath: string, issues: ValidationIssue[]): void {
  if (!existsSync(agentPath)) {
    appendIssue(issues, `${bundlePath}/agents/openai.yaml`, "Missing agents/openai.yaml.");
    return;
  }

  const yaml = readFileSync(agentPath, "utf8");

  if (!/^interface:\s*$/m.test(yaml)) {
    appendIssue(issues, `${bundlePath}/agents/openai.yaml`, 'Top-level "interface:" block is required.');
  }

  for (const field of ["display_name", "short_description", "default_prompt"]) {
    const fieldPattern = new RegExp(`^\\s{2}${field}:\\s+.+$`, "m");
    if (!fieldPattern.test(yaml)) {
      appendIssue(
        issues,
        `${bundlePath}/agents/openai.yaml`,
        `Interface field "${field}" is required.`,
      );
    }
  }
}

export function validateCodexSkillBundle(bundlePath: string): CodexSkillBundleValidationResult {
  const issues: ValidationIssue[] = [];
  const skillPath = path.join(bundlePath, "SKILL.md");
  const agentPath = path.join(bundlePath, "agents", "openai.yaml");

  validateSkillMarkdown(bundlePath, skillPath, issues);
  validateAgentYaml(bundlePath, agentPath, issues);

  return {
    bundlePath,
    valid: issues.length === 0,
    issues,
  };
}
