import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FoundryProductionPacket } from "../boundary/types.js";
import type { ScrollEntry } from "../boundary/scribe.js";
import type { OutputStructureProposal } from "./types.js";
import type { OutputMaterializationResult } from "./types.js";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "mission-output";
}

function projectSlugFor(packet: FoundryProductionPacket): string {
  const objectiveSlug = slugify(packet.objective);
  return objectiveSlug.length > 0 ? objectiveSlug : packet.missionId;
}

export function proposeOutputStructure(packet: FoundryProductionPacket): OutputStructureProposal {
  const projectSlug = projectSlugFor(packet);
  const rootPath = `output/${projectSlug}`;

  if (packet.templateId === "verification-heavy") {
    return {
      projectSlug,
      rootPath,
      directories: [
        `${rootPath}/00-intake`,
        `${rootPath}/01-orders`,
        `${rootPath}/02-execution`,
        `${rootPath}/03-verification`,
        `${rootPath}/04-critique`,
        `${rootPath}/05-audit`,
        `${rootPath}/06-restoration`,
        `${rootPath}/07-archive`,
        `${rootPath}/08-scribe`,
      ],
      canonicalFiles: [
        `${rootPath}/00-intake/mission.md`,
        `${rootPath}/01-orders/production-order.md`,
        `${rootPath}/03-verification/verification-report.md`,
        `${rootPath}/04-critique/critique-report.md`,
        `${rootPath}/05-audit/audit-report.md`,
        `${rootPath}/06-restoration/failure-path.md`,
        `${rootPath}/08-scribe/output-manifest.sha256`,
        `${rootPath}/08-scribe/scribe-report.md`,
      ],
      rationale: [
        "Verification-heavy work requires strong separation between execution, verification, critique, and audit custody.",
        "Restoration and archive surfaces are pre-allocated because high-consequence work assumes interruption and review density.",
      ],
      decidedBy: "carmilla",
    };
  }

  if (packet.templateId === "rapid-prototype") {
    return {
      projectSlug,
      rootPath,
      directories: [
        `${rootPath}/00-intake`,
        `${rootPath}/01-brief`,
        `${rootPath}/02-prototype`,
        `${rootPath}/03-verification`,
        `${rootPath}/04-critique`,
        `${rootPath}/05-failure`,
        `${rootPath}/06-scribe`,
      ],
      canonicalFiles: [
        `${rootPath}/00-intake/mission.md`,
        `${rootPath}/01-brief/prototype-brief.md`,
        `${rootPath}/03-verification/checks.md`,
        `${rootPath}/04-critique/critique-report.md`,
        `${rootPath}/05-failure/failure-path.md`,
        `${rootPath}/06-scribe/output-manifest.sha256`,
        `${rootPath}/06-scribe/scribe-report.md`,
      ],
      rationale: [
        "Rapid prototype work favors low-friction structure while still preserving mission, prototype, and verification custody.",
        "Even provisional work should preserve critique and a declared failure path so experimentation does not masquerade as governance completeness.",
      ],
      decidedBy: "carmilla",
    };
  }

  return {
    projectSlug,
    rootPath,
    directories: [
      `${rootPath}/00-intake`,
      `${rootPath}/01-orders`,
      `${rootPath}/02-architecture`,
      `${rootPath}/03-implementation`,
      `${rootPath}/04-verification`,
      `${rootPath}/05-critique`,
      `${rootPath}/06-audit`,
      `${rootPath}/07-release`,
      `${rootPath}/08-restoration`,
      `${rootPath}/09-scribe`,
    ],
    canonicalFiles: [
      `${rootPath}/00-intake/mission.md`,
      `${rootPath}/01-orders/production-order.md`,
      `${rootPath}/02-architecture/architecture-brief.md`,
      `${rootPath}/04-verification/verification-report.md`,
      `${rootPath}/05-critique/critique-report.md`,
      `${rootPath}/06-audit/audit-report.md`,
      `${rootPath}/07-release/operator-summary.md`,
      `${rootPath}/08-restoration/failure-path.md`,
      `${rootPath}/09-scribe/output-manifest.sha256`,
      `${rootPath}/09-scribe/scribe-report.md`,
    ],
    rationale: [
      "SaaS build work benefits from explicit separation between architecture, implementation, verification, and release-facing output.",
      "Archive continuity is preserved from the start so output does not collapse into an undifferentiated artifact pile.",
      "Distinct critique and audit artifacts preserve independent attestation rather than collapsing all trust claims into verification alone.",
    ],
    decidedBy: "carmilla",
  };
}

function renderScrollEntries(entries: ScrollEntry[]): string {
  return entries
    .map((entry, index) => `${index + 1}. ${entry.at} | ${entry.station} | ${entry.action} | ${entry.summary}`)
    .join("\n");
}

export function renderScribeReport(packet: FoundryProductionPacket): string {
  const plan = proposeOutputStructure(packet);

  return [
    "# Scribe Report",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    `Objective: ${packet.objective}`,
    `Template: ${packet.templateId}`,
    `Consequence Tier: ${packet.consequenceTier}`,
    `Carmilla Output Root: ${plan.rootPath}`,
    "",
    "## Scroll Entries",
    "",
    renderScrollEntries(packet.scroll.entries),
    "",
  ].join("\n");
}

function renderVerificationReport(packet: FoundryProductionPacket): string {
  const status = packet.executionMode === "verification-failure" ? "FAIL" : "PASS";
  const outcomeLine =
    packet.executionMode === "verification-failure"
      ? "- Simulated verification failure triggered by governed failure-case packet."
      : "- Packet structure validated.";

  return [
    "# Verification Report",
    "",
    `Mission: ${packet.missionId}`,
    `Status: ${status}`,
    "",
    "## Checks",
    "",
    outcomeLine,
    "- Required professions preserved.",
    "- Output structure canonization remains within Carmilla authority boundaries.",
    "- Scroll continuity present on the returning packet.",
    "",
  ].join("\n");
}

function renderCritiqueReport(packet: FoundryProductionPacket): string {
  const finding =
    packet.executionMode === "verification-failure"
      ? "Verification failed as expected in the controlled failure case; release-facing trust must not be granted."
      : "Verification claims PASS, but production trust remains contingent on independent critique and later implementation evidence.";
  const recommendation =
    packet.executionMode === "verification-failure"
      ? "Do not proceed to trusted release. Preserve evidence and route the packet into restoration handling."
      : "Proceed with bounded production while preserving review and contradiction visibility.";

  return [
    "# Critique Report",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "## Finding",
    "",
    finding,
    "",
    "## Recommendation",
    "",
    recommendation,
    "",
    "Signed: Blackquill (prototype critique component)",
    "",
  ].join("\n");
}

function renderAuditReport(packet: FoundryProductionPacket): string {
  const finding =
    packet.executionMode === "verification-failure"
      ? "The controlled failure case preserved verification failure, critique objection, and restoration declaration as distinct artifacts."
      : "The current prototype demonstrates artifact separation and movement lineage, but remains dependent on adapter-simulated governance behavior.";

  return [
    "# Audit Report",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "## Audit Scope",
    "",
    "- Verification artifact presence",
    "- Critique artifact presence",
    "- Scroll continuity",
    "- Output custody layout",
    "",
    "## Audit Finding",
    "",
    finding,
    "",
    "Signed: Auditor (prototype audit component)",
    "",
  ].join("\n");
}

function renderFailurePath(packet: FoundryProductionPacket): string {
  const declaredMode =
    packet.executionMode === "verification-failure"
      ? `Controlled failure active: ${packet.failureReason ?? "No reason supplied."}`
      : "No active failure injection. This path remains the declared restoration route if verification fails later.";

  return [
    "# Failure Path",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "## Declared Failure Mode",
    "",
    declaredMode,
    "",
    "## Restoration Semantics",
    "",
    "1. Freeze release-facing output.",
    "2. Preserve the failed verification artifact.",
    "3. Append critique and audit notes.",
    "4. Route the packet into restoration / escalation handling.",
    "",
  ].join("\n");
}

function renderMissionFile(packet: FoundryProductionPacket): string {
  return [
    "# Mission",
    "",
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    `Template: ${packet.templateId}`,
    `Tier: ${packet.consequenceTier}`,
    "",
  ].join("\n");
}

function renderProductionOrderFile(packet: FoundryProductionPacket): string {
  return [
    "# Production Order",
    "",
    `Packet: ${packet.packetId}`,
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    `Summary: ${packet.summary}`,
    "",
  ].join("\n");
}

function renderArchitectureBrief(packet: FoundryProductionPacket): string {
  return [
    "# Architecture Brief",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "The current structure preserves intake, architecture, implementation, verification, critique, audit, release, restoration, and scribe custody as separate output surfaces.",
    "",
  ].join("\n");
}

function renderOperatorSummary(packet: FoundryProductionPacket): string {
  return [
    "# Operator Summary",
    "",
    `Mission ${packet.missionId} has been activated under ${packet.templateId} with ${packet.requiredProfessionIds.join(", ")} as required professions.`,
    "",
  ].join("\n");
}

function renderPrototypeBrief(packet: FoundryProductionPacket): string {
  return [
    "# Prototype Brief",
    "",
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    "",
  ].join("\n");
}

function renderPrototypeChecks(packet: FoundryProductionPacket): string {
  return [
    "# Prototype Checks",
    "",
    `Mission: ${packet.missionId}`,
    "- Boundary flow reachable.",
    "- Minimal verification surface present.",
    "",
  ].join("\n");
}

function contentForFile(filePath: string, packet: FoundryProductionPacket): string {
  if (filePath.endsWith("mission.md")) return renderMissionFile(packet);
  if (filePath.endsWith("production-order.md")) return renderProductionOrderFile(packet);
  if (filePath.endsWith("verification-report.md")) return renderVerificationReport(packet);
  if (filePath.endsWith("checks.md")) return renderPrototypeChecks(packet);
  if (filePath.endsWith("critique-report.md")) return renderCritiqueReport(packet);
  if (filePath.endsWith("audit-report.md")) return renderAuditReport(packet);
  if (filePath.endsWith("failure-path.md")) return renderFailurePath(packet);
  if (filePath.endsWith("scribe-report.md")) return renderScribeReport(packet);
  if (filePath.endsWith("architecture-brief.md")) return renderArchitectureBrief(packet);
  if (filePath.endsWith("operator-summary.md")) return renderOperatorSummary(packet);
  if (filePath.endsWith("prototype-brief.md")) return renderPrototypeBrief(packet);

  return `# ${path.basename(filePath)}\n\nGenerated under Carmilla output canonization for mission ${packet.missionId}.\n`;
}

function buildHashManifest(fileContents: Map<string, string>): string {
  const lines: string[] = [];

  for (const [filePath, contents] of [...fileContents.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const hash = createHash("sha256").update(contents, "utf8").digest("hex");
    lines.push(`${hash}  ${filePath}`);
  }

  return `${lines.join("\n")}\n`;
}

export async function materializeOutputStructure(
  packet: FoundryProductionPacket,
): Promise<OutputMaterializationResult> {
  const plan = proposeOutputStructure(packet);
  const directoriesCreated: string[] = [];
  const filesCreated: string[] = [];

  for (const directory of plan.directories) {
    await mkdir(directory, { recursive: true });
    directoriesCreated.push(directory);
  }

  const scribeReportPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("scribe-report.md")) ??
    path.join(plan.rootPath, "scribe-report.md");
  const critiqueReportPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("critique-report.md")) ?? null;
  const auditReportPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("audit-report.md")) ?? null;
  const failurePathReportPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("failure-path.md")) ??
    path.join(plan.rootPath, "failure-path.md");
  const hashManifestPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("output-manifest.sha256")) ??
    path.join(plan.rootPath, "output-manifest.sha256");
  const fileContents = new Map<string, string>();

  for (const filePath of plan.canonicalFiles) {
    if (filePath === hashManifestPath) {
      continue;
    }

    const contents = contentForFile(filePath, packet);
    fileContents.set(filePath, contents);
    await writeFile(filePath, contents, "utf8");
    filesCreated.push(filePath);
  }

  const hashManifest = buildHashManifest(fileContents);
  await writeFile(hashManifestPath, hashManifest, "utf8");
  filesCreated.push(hashManifestPath);

  return {
    rootPath: plan.rootPath,
    directoriesCreated,
    filesCreated,
    scribeReportPath,
    critiqueReportPath,
    auditReportPath,
    failurePathReportPath,
    hashManifestPath,
  };
}
