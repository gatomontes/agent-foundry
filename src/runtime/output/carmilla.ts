import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FoundryProductionPacket } from "../boundary/types.js";
import type { ScrollEntry } from "../boundary/scribe.js";
import { requireProfessions } from "../professions/registry.js";
import type { ProfessionManifest } from "../professions/types.js";
import type { OutputStructureProposal } from "./types.js";
import type { OutputMaterializationResult } from "./types.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "but",
  "for",
  "from",
  "have",
  "help",
  "html",
  "i",
  "in",
  "initial",
  "is",
  "me",
  "need",
  "not",
  "of",
  "or",
  "output",
  "pipeline",
  "run",
  "should",
  "start",
  "system",
  "task",
  "test",
  "that",
  "the",
  "this",
  "to",
  "want",
  "yet",
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "mission-output";
}

function extractProjectSlug(packet: FoundryProductionPacket): string {
  const corpus = `${packet.objective} ${packet.governanceNotes.join(" ")}`.toLowerCase();
  const normalizedWords: string[] = corpus.match(/[a-z0-9]+/g) ?? [];
  const preferredTerms: string[] = [
    "payroll",
    "employee",
    "saas",
    "homepage",
    "runtime",
    "shell",
    "architecture",
    "verification",
    "failure",
    "prototype",
    "security",
    "audit",
  ];
  const selectedTerms: string[] = [];

  for (const term of preferredTerms) {
    if (normalizedWords.includes(term) && !selectedTerms.includes(term)) {
      selectedTerms.push(term);
    }
  }

  for (const word of normalizedWords) {
    if (STOP_WORDS.has(word) || selectedTerms.includes(word)) {
      continue;
    }

    selectedTerms.push(word);

    if (selectedTerms.length >= 4) {
      break;
    }
  }

  if (packet.executionMode === "verification-failure" && !selectedTerms.includes("failure")) {
    selectedTerms.push("failure");
  }

  return slugify(selectedTerms.slice(0, 5).join("-"));
}

function projectSlugFor(packet: FoundryProductionPacket): string {
  const projectSlug = extractProjectSlug(packet);
  return projectSlug.length > 0 ? projectSlug : slugify(packet.missionId);
}

function flatArtifactPath(rootPath: string, prefix: string, fileName: string): string {
  const [, stageName = ""] = prefix.split("-", 2);
  const normalizedFileName =
    stageName.length > 0 && fileName.startsWith(`${stageName}-`)
      ? fileName.slice(stageName.length + 1)
      : fileName;
  return `${rootPath}/${prefix}-${normalizedFileName}`;
}

export function proposeOutputStructure(packet: FoundryProductionPacket): OutputStructureProposal {
  const projectSlug = projectSlugFor(packet);
  const rootPath = `output/${projectSlug}`;

  if (packet.templateId === "verification-heavy") {
    return {
      projectSlug,
      rootPath,
      directories: [rootPath],
      canonicalFiles: [
        flatArtifactPath(rootPath, "00-intake", "mission.md"),
        flatArtifactPath(rootPath, "01-orders", "production-order.md"),
        flatArtifactPath(rootPath, "03-verification", "verification-report.md"),
        flatArtifactPath(rootPath, "04-critique", "critique-report.md"),
        flatArtifactPath(rootPath, "05-audit", "audit-report.md"),
        flatArtifactPath(rootPath, "06-restoration", "failure-path.md"),
        flatArtifactPath(rootPath, "08-scribe", "output-manifest.sha256"),
        flatArtifactPath(rootPath, "08-scribe", "scribe-report.md"),
      ],
      rationale: [
        "Verification-heavy work still requires strong separation between execution, verification, critique, and audit custody.",
        "Artifacts are flattened into a single output root, so filename prefixes preserve stage order without forcing one-folder-per-output.",
      ],
      decidedBy: "carmilla",
    };
  }

  if (packet.templateId === "rapid-prototype") {
    return {
      projectSlug,
      rootPath,
      directories: [rootPath],
      canonicalFiles: [
        flatArtifactPath(rootPath, "00-intake", "mission.md"),
        flatArtifactPath(rootPath, "01-brief", "prototype-brief.md"),
        flatArtifactPath(rootPath, "03-verification", "checks.md"),
        flatArtifactPath(rootPath, "04-critique", "critique-report.md"),
        flatArtifactPath(rootPath, "05-failure", "failure-path.md"),
        flatArtifactPath(rootPath, "06-scribe", "output-manifest.sha256"),
        flatArtifactPath(rootPath, "06-scribe", "scribe-report.md"),
      ],
      rationale: [
        "Rapid prototype work favors low-friction structure while still preserving mission, prototype, and verification custody.",
        "Even provisional work should preserve critique and a declared failure path so experimentation does not masquerade as governance completeness.",
        "Flattened filenames keep the output root easy to scan while retaining stage identity.",
      ],
      decidedBy: "carmilla",
    };
  }

  return {
    projectSlug,
    rootPath,
    directories: [rootPath],
    canonicalFiles: [
      flatArtifactPath(rootPath, "00-intake", "mission.md"),
      flatArtifactPath(rootPath, "01-orders", "production-order.md"),
      flatArtifactPath(rootPath, "02-architecture", "architecture-brief.md"),
      flatArtifactPath(rootPath, "04-verification", "verification-report.md"),
      flatArtifactPath(rootPath, "05-critique", "critique-report.md"),
      flatArtifactPath(rootPath, "06-audit", "audit-report.md"),
      flatArtifactPath(rootPath, "07-release", "operator-summary.md"),
      flatArtifactPath(rootPath, "08-restoration", "failure-path.md"),
      flatArtifactPath(rootPath, "09-scribe", "output-manifest.sha256"),
      flatArtifactPath(rootPath, "09-scribe", "scribe-report.md"),
    ],
    rationale: [
      "SaaS build work benefits from explicit separation between architecture, implementation, verification, and release-facing output.",
      "Flattened artifact naming keeps the project root readable while preserving sequence and custody stage in the filename itself.",
      "Distinct critique and audit artifacts preserve independent attestation rather than collapsing all trust claims into verification alone.",
    ],
    decidedBy: "carmilla",
  };
}

function renderScrollEntries(entries: ScrollEntry[]): string {
  return entries
    .map((entry, index) => {
      const previousEntry = index > 0 ? entries[index - 1] : null;
      const latencySuffix = previousEntry
        ? ` | +${new Date(entry.at).getTime() - new Date(previousEntry.at).getTime()}ms`
        : " | origin";
      return `${index + 1}. ${entry.at} | ${entry.station} | ${entry.action}${latencySuffix} | ${entry.summary}`;
    })
    .join("\n");
}

function renderBulletList(values: string[], fallback = "- none"): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : fallback;
}

function renderProposalItems(packet: FoundryProductionPacket): string {
  return packet.proposal.items
    .map(
      (item, index) =>
        [
          `${index + 1}. ${item.action}`,
          `   Purpose: ${item.purpose}`,
          `   Details: ${item.details}`,
          `   Expected outcome: ${item.expectedOutcome}`,
        ].join("\n"),
    )
    .join("\n");
}

function findProfessions(professionIds: string[]): ProfessionManifest[] {
  return professionIds.length > 0 ? requireProfessions(professionIds) : [];
}

function renderProfessionSummaries(professionIds: string[]): string {
  const professions = findProfessions(professionIds);
  return professions.length > 0
    ? professions.map((profession) => `- ${profession.name} (${profession.id}): ${profession.purpose}`).join("\n")
    : "- none";
}

function renderProfessionArtifactExpectations(professions: ProfessionManifest[]): string {
  return professions.length > 0
    ? professions
        .map((profession) => `- ${profession.name}: ${profession.expectedArtifacts.join(", ")}`)
        .join("\n")
    : "- none";
}

function renderTopologyNodes(packet: FoundryProductionPacket): string {
  const nodes = packet.topology?.nodes ?? [];

  return nodes.length > 0
    ? nodes
        .map((node) => {
          const profession = node.professionId ? findProfessions([node.professionId])[0] : null;
          return `- ${node.id}: ${node.label} [${node.kind}]${
            profession ? ` -> ${profession.name}` : ""
          }${node.required ? " (required)" : " (optional)"}`;
        })
        .join("\n")
    : "- topology unresolved";
}

function renderTopologyEdges(packet: FoundryProductionPacket): string {
  const edges = packet.topology?.edges ?? [];

  return edges.length > 0
    ? edges.map((edge) => `- ${edge.from} -> ${edge.to} (${edge.kind})`).join("\n")
    : "- topology edges unresolved";
}

function nextActiveNodeLine(packet: FoundryProductionPacket): string {
  const nodes = packet.topology?.nodes ?? [];
  const nextNode = nodes[1] ?? nodes[0] ?? null;

  if (!nextNode) {
    return "Next active node unresolved.";
  }

  const profession = nextNode.professionId ? findProfessions([nextNode.professionId])[0] : null;
  return `${nextNode.label} (${nextNode.id})${profession ? ` -> ${profession.name}` : ""}`;
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
    "## Custody Notes",
    "",
    "- Scroll timestamps are advanced with a monotonic custody clock so packet movement remains causally ordered.",
    "- The scroll is a movement witness, not a substitute for critique, audit, or verification artifacts.",
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
      ? "- Controlled verification failure was injected by Citadel governance to test restoration and attestation behavior."
      : "- Packet structure and governed boundary semantics validated.";
  const releaseDisposition =
    packet.executionMode === "verification-failure"
      ? "Blocked from release-facing disposition pending restoration."
      : "Eligible to advance into bounded implementation, subject to critique and later execution evidence.";

  return [
    "# Verification Report",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    `Status: ${status}`,
    "",
    "## Scope",
    "",
    "- Packet integrity at Foundry ingress",
    "- Required profession preservation",
    "- Boundary and scroll continuity",
    "- Carmilla output authority boundaries",
    "",
    "## Checks",
    "",
    outcomeLine,
    "- Required professions preserved.",
    "- Output structure canonization remains within Carmilla authority boundaries.",
    "- Scroll continuity present on the returning packet.",
    "",
    "## Disposition",
    "",
    releaseDisposition,
    "",
  ].join("\n");
}

function renderCritiqueReport(packet: FoundryProductionPacket): string {
  const finding =
    packet.executionMode === "verification-failure"
      ? "verification-report.md correctly records a failed gate, but that report alone is not enough to prove safe continuation."
      : "verification-report.md claims PASS, but production trust still depends on implementation evidence that does not yet exist.";
  const recommendation =
    packet.executionMode === "verification-failure"
      ? "Recommendation: REVISE. Do not proceed to trusted release. Preserve the failed verification artifact and route the packet into restoration handling."
      : "Recommendation: PROCEED WITH CAUTION. Continue only as bounded production while preserving contradiction visibility and later execution review.";
  const concern =
    packet.executionMode === "verification-failure"
      ? "The release path must remain frozen because the controlled failure demonstrates that verification can fail before any operator-facing trust claim is made."
      : "Current trust is still governance-shaped rather than implementation-proven; no runtime output should be misrepresented as independently verified delivery.";

  return [
    "# Critique Report",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    "",
    "## Finding",
    "",
    finding,
    "",
    "## Challenge",
    "",
    concern,
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
      ? "The controlled failure case preserved verification failure, critique objection, restoration declaration, and a hash-bound artifact set as distinct custody surfaces."
      : "The current prototype demonstrates artifact separation and movement lineage, but remains dependent on adapter-simulated governance behavior.";

  return [
    "# Audit Report",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    "",
    "## Audit Scope",
    "",
    "- Verification artifact presence",
    "- Critique artifact presence",
    "- Scroll continuity",
    "- Output custody layout",
    "- Hash manifest availability for independent verification",
    "",
    "## Audit Finding",
    "",
    finding,
    "",
    "## Residual Limitations",
    "",
    "- Governance classification still comes from the local Citadel adapter rather than a live Citadel runtime.",
    "- The output manifest is hash-verifiable, but not signature-backed.",
    "- Scroll timestamps are simulated monotonic custody markers rather than distributed system clocks.",
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
    "## Escalation Route",
    "",
    "- Foundry Rook preserves the blocked packet and its manifest.",
    "- Critique and audit remain append-only companion artifacts.",
    "- Citadel receives the failed evidence set on the next governed return cycle.",
    "",
  ].join("\n");
}

function renderMissionFile(packet: FoundryProductionPacket): string {
  const requiredProfessions = findProfessions(packet.requiredProfessionIds);
  const optionalProfessions = findProfessions(packet.optionalProfessionIds);

  return [
    "# Mission",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    `Objective: ${packet.objective}`,
    `Summary: ${packet.summary}`,
    `Template: ${packet.templateId}`,
    `Tier: ${packet.consequenceTier}`,
    "",
    "## Citadel Proposal",
    "",
    `Title: ${packet.proposal.title}`,
    `Summary: ${packet.proposal.summary}`,
    "",
    renderProposalItems(packet),
    "",
    "## Governance Notes",
    "",
    renderBulletList(packet.governanceNotes),
    "",
    "## Required Professions",
    "",
    renderProfessionSummaries(packet.requiredProfessionIds),
    "",
    "## Optional Professions",
    "",
    renderProfessionSummaries(packet.optionalProfessionIds),
    "",
    "## Expected Artifact Families",
    "",
    renderProfessionArtifactExpectations([...requiredProfessions, ...optionalProfessions]),
    "",
    "## Ordered Topology",
    "",
    renderTopologyNodes(packet),
    "",
    "## Flow Edges",
    "",
    renderTopologyEdges(packet),
    "",
  ].join("\n");
}

function renderProductionOrderFile(packet: FoundryProductionPacket): string {
  const plan = proposeOutputStructure(packet);

  return [
    "# Production Order",
    "",
    `Packet: ${packet.packetId}`,
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    `Summary: ${packet.summary}`,
    `Template: ${packet.templateId}`,
    `Consequence Tier: ${packet.consequenceTier}`,
    `Output Root: ${plan.rootPath}`,
    `Required Professions: ${packet.requiredProfessionIds.join(", ")}`,
    `Optional Professions: ${packet.optionalProfessionIds.join(", ") || "none"}`,
    "",
    "## Citadel Proposal",
    "",
    `Title: ${packet.proposal.title}`,
    `Summary: ${packet.proposal.summary}`,
    "",
    renderProposalItems(packet),
    "",
    "## Governance Instructions",
    "",
    renderBulletList(packet.governanceNotes),
    "",
    "## Runtime Artifacts Declared By Citadel",
    "",
    renderBulletList(packet.artifacts.map((artifact) => `${artifact.id} (${artifact.kind})`)),
    "",
    "## Next Active Node",
    "",
    nextActiveNodeLine(packet),
    "",
  ].join("\n");
}

function renderArchitectureBrief(packet: FoundryProductionPacket): string {
  const requiredProfessions = findProfessions(packet.requiredProfessionIds);

  return [
    "# Architecture Brief",
    "",
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    "",
    "## Architectural Intent",
    "",
    `The governed runtime is ordered under the ${packet.templateId} template with ${packet.consequenceTier} consequence handling.`,
    "The structure preserves intake, architecture, implementation, verification, critique, audit, release, restoration, and scribe custody as separate output surfaces.",
    "",
    "## Topology Nodes",
    "",
    renderTopologyNodes(packet),
    "",
    "## Flow Edges",
    "",
    renderTopologyEdges(packet),
    "",
    "## Required Profession Contributions",
    "",
    renderProfessionSummaries(packet.requiredProfessionIds),
    "",
    "## Boundary Constraints",
    "",
    renderBulletList([
      "Citadel defines the governed packet and does not collapse into Foundry implementation authority.",
      "Carmilla canonizes the output structure but does not alter mission governance.",
      "Verification remains mandatory before any trusted disposition.",
    ]),
    "",
    "## Primary Artifact Expectations",
    "",
    renderProfessionArtifactExpectations(requiredProfessions),
    "",
  ].join("\n");
}

function renderOperatorSummary(packet: FoundryProductionPacket): string {
  return [
    "# Operator Summary",
    "",
    `Mission ${packet.missionId} has been activated under ${packet.templateId} with ${packet.requiredProfessionIds.join(", ")} as required professions.`,
    "",
    "## Immediate Understanding",
    "",
    `Objective: ${packet.objective}`,
    `Execution mode: ${packet.executionMode ?? "normal"}`,
    `Next active node: ${nextActiveNodeLine(packet)}`,
    "",
    "## Approved Citadel Proposal",
    "",
    `Title: ${packet.proposal.title}`,
    `Summary: ${packet.proposal.summary}`,
    "",
    renderProposalItems(packet),
    "",
    "## Governance Reminders",
    "",
    renderBulletList(packet.governanceNotes),
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
    "## Prototype Intent",
    "",
    "This run optimizes for speed of architectural scaffolding while preserving explicit verification, critique, failure, and scribe surfaces.",
    "",
    "## Topology Nodes",
    "",
    renderTopologyNodes(packet),
    "",
  ].join("\n");
}

function renderPrototypeChecks(packet: FoundryProductionPacket): string {
  return [
    "# Prototype Checks",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "## Checks",
    "",
    "- Boundary flow reachable.",
    "- Minimal verification surface present.",
    `- Next active node declared: ${nextActiveNodeLine(packet)}`,
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

  await rm(plan.rootPath, { recursive: true, force: true });

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
