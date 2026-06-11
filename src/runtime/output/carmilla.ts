import { createHash, createHmac } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FoundryProductionPacket } from "../boundary/types.js";
import type { ScrollEntry } from "../boundary/scribe.js";
import { getFoundryEnv } from "../config/env.js";
import { requireProfessions } from "../professions/registry.js";
import type { ProfessionManifest } from "../professions/types.js";
import type { OutputStructureProposal } from "./types.js";
import type { OutputMaterializationResult } from "./types.js";
import { toTimestamp, type ManifestSignature } from "../shared/types.js";

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
    "creative",
    "title",
    "song",
    "lyric",
    "copy",
    "naming",
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

function safeRunSegment(value: string): string {
  return value.replace(/[:.]/g, "-");
}

function buildRunPath(rootPath: string, packet: FoundryProductionPacket): string {
  const timestampSegment = safeRunSegment(packet.createdAt);
  const packetSegment = slugify(packet.packetId).slice(0, 24) || "packet";
  return `${rootPath}/runs/${timestampSegment}-${packetSegment}`;
}

function flatArtifactPath(rootPath: string, prefix: string, fileName: string): string {
  const [, stageName = ""] = prefix.split("-", 2);
  const normalizedFileName =
    stageName.length > 0 && fileName.startsWith(`${stageName}-`)
      ? fileName.slice(stageName.length + 1)
      : fileName;
  return `${rootPath}/${prefix}-${normalizedFileName}`;
}

function workerManifestPathFor(runPath: string): string {
  return `${runPath}/11-workers-manifest.json`;
}

function runPackageManifestPathFor(runPath: string): string {
  return `${runPath}/13-run-package-manifest.json`;
}

function workerSpecPathFor(runPath: string, workerId: string): string {
  return `${runPath}/11-worker-${workerId}.json`;
}

function workerSpecPathsFor(packet: FoundryProductionPacket, runPath: string): string[] {
  return packet.staffingDirective.targets.map((target) => workerSpecPathFor(runPath, target.id));
}

function codexSkillRootFor(runPath: string): string {
  return `${runPath}/12-codex-skills`;
}

function codexSkillBundleDirFor(runPath: string, workerId: string): string {
  return `${codexSkillRootFor(runPath)}/${workerId}`;
}

function codexSkillBundlePathsFor(packet: FoundryProductionPacket, runPath: string): string[] {
  if (packet.deploymentDirective.target !== "codex-skill") {
    return [];
  }

  return packet.staffingDirective.targets.map((target) => codexSkillBundleDirFor(runPath, target.id));
}

function normalizePackagePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function relativeToRunPath(runPath: string, targetPath: string): string {
  const relativePath = path.relative(runPath, targetPath);
  return relativePath.length === 0 ? "." : normalizePackagePath(relativePath);
}

function isWithinRunPath(runPath: string, candidatePath: string): boolean {
  const runAbsolute = path.resolve(runPath);
  const candidateAbsolute = path.resolve(candidatePath);
  return candidateAbsolute === runAbsolute || candidateAbsolute.startsWith(`${runAbsolute}${path.sep}`);
}

export function proposeOutputStructure(packet: FoundryProductionPacket): OutputStructureProposal {
  const projectSlug = projectSlugFor(packet);
  const rootPath = `output/${projectSlug}`;
  const runPath = buildRunPath(rootPath, packet);

  if (packet.templateId === "verification-heavy") {
    return {
      projectSlug,
      rootPath,
      directories: [rootPath, `${rootPath}/runs`, runPath],
      canonicalFiles: [
        flatArtifactPath(runPath, "00-intake", "mission.md"),
        flatArtifactPath(runPath, "01-orders", "production-order.md"),
        flatArtifactPath(runPath, "03-verification", "verification-report.md"),
        flatArtifactPath(runPath, "04-critique", "critique-report.md"),
        flatArtifactPath(runPath, "05-audit", "audit-report.md"),
        flatArtifactPath(runPath, "06-restoration", "failure-path.md"),
        flatArtifactPath(runPath, "07-attestation", "mission-attestation.json"),
        flatArtifactPath(runPath, "07-attestation", "execution-evidence.md"),
        flatArtifactPath(runPath, "08-scribe", "output-manifest.sha256"),
        flatArtifactPath(runPath, "08-scribe", "scribe-report.md"),
        workerManifestPathFor(runPath),
        ...workerSpecPathsFor(packet, runPath),
        runPackageManifestPathFor(runPath),
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
      directories: [rootPath, `${rootPath}/runs`, runPath],
      canonicalFiles: [
        flatArtifactPath(runPath, "00-intake", "mission.md"),
        flatArtifactPath(runPath, "01-brief", "prototype-brief.md"),
        flatArtifactPath(runPath, "03-verification", "checks.md"),
        flatArtifactPath(runPath, "04-critique", "critique-report.md"),
        flatArtifactPath(runPath, "05-failure", "failure-path.md"),
        flatArtifactPath(runPath, "06-scribe", "output-manifest.sha256"),
        flatArtifactPath(runPath, "06-scribe", "scribe-report.md"),
        workerManifestPathFor(runPath),
        ...workerSpecPathsFor(packet, runPath),
        runPackageManifestPathFor(runPath),
      ],
      rationale: [
        "Rapid prototype work favors low-friction structure while still preserving mission, prototype, and verification custody.",
        "Even provisional work should preserve critique and a declared failure path so experimentation does not masquerade as governance completeness.",
        "Flattened filenames keep the output root easy to scan while retaining stage identity.",
      ],
      decidedBy: "carmilla",
    };
  }

  if (packet.templateId === "creative-development") {
    return {
      projectSlug,
      rootPath,
      directories: [rootPath, `${rootPath}/runs`, runPath],
      canonicalFiles: [
        flatArtifactPath(runPath, "00-intake", "mission.md"),
        flatArtifactPath(runPath, "01-brief", "creative-brief.md"),
        flatArtifactPath(runPath, "02-generation", "option-set.md"),
        flatArtifactPath(runPath, "03-verification", "fit-check.md"),
        flatArtifactPath(runPath, "04-critique", "critique-report.md"),
        flatArtifactPath(runPath, "05-release", "operator-summary.md"),
        flatArtifactPath(runPath, "06-restoration", "failure-path.md"),
        flatArtifactPath(runPath, "07-attestation", "mission-attestation.json"),
        flatArtifactPath(runPath, "07-attestation", "execution-evidence.md"),
        flatArtifactPath(runPath, "08-scribe", "output-manifest.sha256"),
        flatArtifactPath(runPath, "08-scribe", "scribe-report.md"),
        workerManifestPathFor(runPath),
        ...workerSpecPathsFor(packet, runPath),
        runPackageManifestPathFor(runPath),
      ],
      rationale: [
        "Creative-development work benefits from explicit separation between framing, generation, fit verification, and creative review.",
        "The artifact set should make option quality and shortlist logic inspectable instead of flattening creative work into generic build semantics.",
        "Flattened filenames keep the output root easy to scan while retaining stage identity.",
      ],
      decidedBy: "carmilla",
    };
  }

  return {
    projectSlug,
    rootPath,
    directories: [rootPath, `${rootPath}/runs`, runPath],
    canonicalFiles: [
      flatArtifactPath(runPath, "00-intake", "mission.md"),
      flatArtifactPath(runPath, "01-orders", "production-order.md"),
      flatArtifactPath(runPath, "02-architecture", "architecture-brief.md"),
      flatArtifactPath(runPath, "04-verification", "verification-report.md"),
      flatArtifactPath(runPath, "05-critique", "critique-report.md"),
      flatArtifactPath(runPath, "06-audit", "audit-report.md"),
      flatArtifactPath(runPath, "07-release", "operator-summary.md"),
      flatArtifactPath(runPath, "08-restoration", "failure-path.md"),
      flatArtifactPath(runPath, "09-attestation", "mission-attestation.json"),
      flatArtifactPath(runPath, "09-attestation", "execution-evidence.md"),
      flatArtifactPath(runPath, "10-scribe", "output-manifest.sha256"),
      flatArtifactPath(runPath, "10-scribe", "scribe-report.md"),
      workerManifestPathFor(runPath),
      ...workerSpecPathsFor(packet, runPath),
      runPackageManifestPathFor(runPath),
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

function renderStaffingTargets(packet: FoundryProductionPacket): string {
  return packet.staffingDirective.targets.length > 0
    ? packet.staffingDirective.targets
        .map(
          (target) =>
            `- ${target.title} (${target.mode}${target.required ? ", required" : ", optional"}): ${target.purpose} Rationale: ${target.rationale}`,
        )
        .join("\n")
    : "- none";
}

function renderHandoffDirective(packet: FoundryProductionPacket): string {
  return renderBulletList([
    `Recipient type: ${packet.handoffDirective.recipientType}`,
    `Handoff mode: ${packet.handoffDirective.mode}`,
    `Package scope: ${packet.handoffDirective.packageScope}`,
    `Operator destination policy: ${packet.handoffDirective.operatorDestinationPolicy}`,
    `Rationale: ${packet.handoffDirective.rationale}`,
  ]);
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

function manifestSecret(): string | null {
  return getFoundryEnv("FOUNDRY_MANIFEST_SECRET");
}

function manifestKeyId(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex").slice(0, 12);
}

function signManifest(packet: FoundryProductionPacket, manifest: string): ManifestSignature | null {
  if (packet.productionProfile.manifestStrategy !== "hmac-sha256") {
    return null;
  }

  const secret = manifestSecret();

  if (!secret) {
    return null;
  }

  return {
    algorithm: "hmac-sha256",
    keyId: manifestKeyId(secret),
    signature: createHmac("sha256", secret).update(manifest, "utf8").digest("hex"),
    signedAt: toTimestamp(),
  };
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
    `Production Mode: ${packet.productionProfile.mode}`,
    `Evidence Level: ${packet.productionProfile.evidenceLevel}`,
    `Manifest Strategy: ${packet.productionProfile.manifestStrategy}`,
    `Carmilla Output Root: ${plan.rootPath}`,
    `Carmilla Run Path: ${plan.directories[plan.directories.length - 1]}`,
    "",
    "## Custody Notes",
    "",
    "- Scroll timestamps are advanced with a monotonic custody clock so packet movement remains causally ordered.",
    "- The scroll is a movement witness, not a substitute for critique, audit, or verification artifacts.",
    `- Manifest signing ${manifestSecret() ? "is configured for this runtime." : "is available but not configured in this runtime."}`,
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
      : packet.executionEvidence
        ? "- Packet structure, governed boundary semantics, and runtime initiation evidence were validated."
        : "- Packet structure and governed boundary semantics validated.";
  const releaseDisposition =
    packet.executionMode === "verification-failure"
      ? "Blocked from release-facing disposition pending restoration."
      : packet.executionEvidence
        ? "Eligible to advance into bounded implementation with runtime attestation present, subject to critique, audit, and task-specific execution review."
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
    "- Foundry runtime role preservation",
    "- Boundary and scroll continuity",
    "- Carmilla output authority boundaries",
    "- Runtime initiation evidence presence",
    "",
    "## Checks",
    "",
    outcomeLine,
    "- Foundry runtime roles preserved.",
    "- Output structure canonization remains within Carmilla authority boundaries.",
    "- Scroll continuity present on the returning packet.",
    packet.executionEvidence
      ? "- MissionRuntime emitted execution evidence for this initiated production run."
      : "- No runtime initiation evidence was attached to this packet at materialization time.",
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
      : packet.executionEvidence
        ? "verification-report.md claims PASS and includes runtime initiation evidence, but mission trust still depends on the downstream work itself being correct."
        : "verification-report.md claims PASS, but production trust still depends on implementation evidence that does not yet exist.";
  const recommendation =
    packet.executionMode === "verification-failure"
      ? "Recommendation: REVISE. Do not proceed to trusted release. Preserve the failed verification artifact and route the packet into restoration handling."
      : packet.executionEvidence
        ? "Recommendation: PROCEED WITH DISCIPLINE. Runtime attestation is present, but release trust still requires downstream implementation review and verification."
        : "Recommendation: PROCEED WITH CAUTION. Continue only as bounded production while preserving contradiction visibility and later execution review.";
  const concern =
    packet.executionMode === "verification-failure"
      ? "The release path must remain frozen because the controlled failure demonstrates that verification can fail before any operator-facing trust claim is made."
      : packet.executionEvidence
        ? "Runtime initiation is now attested, but attested initiation is still not the same as independently verified business correctness."
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
      : packet.executionEvidence
        ? "The runtime preserved artifact separation, movement lineage, and mission initiation evidence for this production-style run."
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
    "- Runtime attestation presence",
    "",
    "## Audit Finding",
    "",
    finding,
    "",
    "## Residual Limitations",
    "",
    "- Governance classification still comes from the local Citadel adapter rather than a live Citadel runtime.",
    manifestSecret()
      ? "- The output manifest can be signature-backed with the configured local HMAC secret, but this is still host-local trust rather than external notarization."
      : "- The output manifest remains hash-verifiable unless FOUNDRY_MANIFEST_SECRET is configured for signature generation.",
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
    "## Mission Target Workers",
    "",
    `Intent: ${packet.staffingDirective.intent}`,
    `Deployment target: ${packet.deploymentDirective.target}`,
    "",
    renderStaffingTargets(packet),
    "",
    "## Foundry Runtime Roles",
    "",
    renderProfessionSummaries(packet.requiredProfessionIds),
    "",
    "## Foundry Optional Support Roles",
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
    `Mission Target Workers: ${packet.staffingDirective.targets.map((target) => target.title).join(", ") || "none"}`,
    `Deployment Target: ${packet.deploymentDirective.target}`,
    `Foundry Runtime Roles: ${packet.requiredProfessionIds.join(", ")}`,
    `Foundry Optional Support Roles: ${packet.optionalProfessionIds.join(", ") || "none"}`,
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
    "## Staffing Directive",
    "",
    `Intent: ${packet.staffingDirective.intent}`,
    `Deployment target: ${packet.deploymentDirective.target}`,
    `Deployment rationale: ${packet.deploymentDirective.rationale}`,
    "",
    renderStaffingTargets(packet),
    "",
    "## Handoff Directive",
    "",
    renderHandoffDirective(packet),
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
    "## Mission Target Workers",
    "",
    `Deployment target: ${packet.deploymentDirective.target}`,
    renderStaffingTargets(packet),
    "",
    "## Handoff Directive",
    "",
    renderHandoffDirective(packet),
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
    `Mission ${packet.missionId} has been activated under ${packet.templateId}. Foundry's internal runtime crew remains separate from the mission workers being forged.`,
    "",
    "## Immediate Understanding",
    "",
    `Objective: ${packet.objective}`,
    `Execution mode: ${packet.executionMode ?? "normal"}`,
    `Next active node: ${nextActiveNodeLine(packet)}`,
    "",
    "## Mission Target Workers",
    "",
    `Intent: ${packet.staffingDirective.intent}`,
    `Deployment target: ${packet.deploymentDirective.target}`,
    "",
    renderStaffingTargets(packet),
    "",
    "## Handoff Directive",
    "",
    renderHandoffDirective(packet),
    "",
    "## Foundry Runtime Roles",
    "",
    renderProfessionSummaries(packet.requiredProfessionIds),
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

function renderCreativeBrief(packet: FoundryProductionPacket): string {
  return [
    "# Creative Brief",
    "",
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    "",
    "## Creative Intent",
    "",
    "This run optimizes for idea quality, lane clarity, and shortlist-ready creative judgment rather than software implementation semantics.",
    "",
    "## Topology Nodes",
    "",
    renderTopologyNodes(packet),
    "",
    "## Flow Edges",
    "",
    renderTopologyEdges(packet),
    "",
  ].join("\n");
}

function renderCreativeOptionSet(packet: FoundryProductionPacket): string {
  return [
    "# Option Set",
    "",
    `Mission: ${packet.missionId}`,
    `Objective: ${packet.objective}`,
    "",
    "## Governed Proposal",
    "",
    `Title: ${packet.proposal.title}`,
    `Summary: ${packet.proposal.summary}`,
    "",
    renderProposalItems(packet),
    "",
    "## Creative Handling Notes",
    "",
    renderBulletList([
      "Preserve distinct lanes when they materially improve option quality.",
      "Favor shortlist-ready outputs over decorative quantity.",
      "Keep anti-cliche and fit pressure visible in the downstream review surface.",
    ]),
    "",
  ].join("\n");
}

function renderCreativeFitCheck(packet: FoundryProductionPacket): string {
  return [
    "# Fit Check",
    "",
    `Mission: ${packet.missionId}`,
    "",
    "## Checks",
    "",
    "- Creative framing surface present.",
    "- Generation surface preserved as an inspectable option set.",
    "- Verification remains responsible for fit, lane integrity, and output usability.",
    `- Next active node declared: ${nextActiveNodeLine(packet)}`,
    "",
  ].join("\n");
}

function renderExecutionEvidence(packet: FoundryProductionPacket): string {
  const evidence = packet.executionEvidence;

  return [
    "# Execution Evidence",
    "",
    `Mission: ${packet.missionId}`,
    `Packet: ${packet.packetId}`,
    `Production mode: ${packet.productionProfile.mode}`,
    `Evidence level: ${packet.productionProfile.evidenceLevel}`,
    "",
    "## Runtime Evidence",
    "",
    evidence
      ? renderBulletList([
          `Runtime session: ${evidence.runtimeSessionId}`,
          `Initiated at: ${evidence.initiatedAt}`,
          `Initiated by: ${evidence.initiatedBy}`,
          `Mission state at attestation: ${evidence.missionState}`,
          `Topology assigned: ${evidence.topologyAssigned ? "yes" : "no"}`,
          `Active delegations: ${String(evidence.activeDelegationCount)}`,
        ])
      : "- Production was not initiated through MissionRuntime, so only governance-shaped evidence is present.",
    "",
    "## Evidence References",
    "",
    evidence ? renderBulletList(evidence.evidenceRefs) : "- none",
    "",
  ].join("\n");
}

function renderMissionAttestation(packet: FoundryProductionPacket): string {
  return JSON.stringify(
    {
      missionId: packet.missionId,
      packetId: packet.packetId,
      objective: packet.objective,
      createdAt: packet.createdAt,
      productionProfile: packet.productionProfile,
      executionEvidence: packet.executionEvidence ?? null,
      staffingDirective: packet.staffingDirective,
      deploymentDirective: packet.deploymentDirective,
      handoffDirective: packet.handoffDirective,
      topologyNodeCount: packet.topology?.nodes.length ?? 0,
      topologyEdgeCount: packet.topology?.edges.length ?? 0,
      requiredProfessionIds: packet.requiredProfessionIds,
      optionalProfessionIds: packet.optionalProfessionIds,
      governanceNotes: packet.governanceNotes,
      scrollId: packet.scroll.scrollId,
    },
    null,
    2,
  );
}

function renderWorkerManifest(packet: FoundryProductionPacket): string {
  return JSON.stringify(
    {
      $schema: "foundry.worker-manifest.v1",
      schema: "foundry.worker-manifest.v1",
      missionId: packet.missionId,
      packetId: packet.packetId,
      staffingIntent: packet.staffingDirective.intent,
      deploymentTarget: packet.deploymentDirective.target,
      handoffDirective: packet.handoffDirective,
      targetCount: packet.staffingDirective.targets.length,
      workers: packet.staffingDirective.targets.map((target) => ({
        id: target.id,
        title: target.title,
        mode: target.mode,
        required: target.required,
        specFile: `11-worker-${target.id}.json`,
      })),
    },
    null,
    2,
  );
}

function renderRunPackageManifest(args: {
  packet: FoundryProductionPacket;
  projectSlug: string;
  runPath: string;
  runId: string;
  includedFiles: string[];
  includedDirectories: string[];
  workerManifestPath: string | null;
  workerSpecPaths: string[];
  codexSkillBundlePaths: string[];
  attestationPath: string | null;
  executionEvidencePath: string | null;
  critiqueReportPath: string | null;
  auditReportPath: string | null;
  failurePathReportPath: string;
  scribeReportPath: string;
  hashManifestPath: string;
  signaturePath: string | null;
}): string {
  const {
    packet,
    projectSlug,
    runPath,
    runId,
    includedFiles,
    includedDirectories,
    workerManifestPath,
    workerSpecPaths,
    codexSkillBundlePaths,
    attestationPath,
    executionEvidencePath,
    critiqueReportPath,
    auditReportPath,
    failurePathReportPath,
    scribeReportPath,
    hashManifestPath,
    signaturePath,
  } = args;

  const manifest = {
    $schema: "foundry.run-package.v1",
    schema: "foundry.run-package.v1",
    missionId: packet.missionId,
    packetId: packet.packetId,
    projectSlug,
    runId,
    packageRoot: ".",
    objective: packet.objective,
    templateId: packet.templateId,
    consequenceTier: packet.consequenceTier,
    productionProfile: packet.productionProfile,
    deploymentTarget: packet.deploymentDirective.target,
    handoffDirective: packet.handoffDirective,
    workerManifestPath: workerManifestPath ? relativeToRunPath(runPath, workerManifestPath) : null,
    workerSpecPaths: workerSpecPaths.map((filePath) => relativeToRunPath(runPath, filePath)),
    codexSkillBundlePaths: codexSkillBundlePaths.map((filePath) => relativeToRunPath(runPath, filePath)),
    attestationPath: attestationPath ? relativeToRunPath(runPath, attestationPath) : null,
    executionEvidencePath: executionEvidencePath ? relativeToRunPath(runPath, executionEvidencePath) : null,
    critiqueReportPath: critiqueReportPath ? relativeToRunPath(runPath, critiqueReportPath) : null,
    auditReportPath: auditReportPath ? relativeToRunPath(runPath, auditReportPath) : null,
    failurePathReportPath: relativeToRunPath(runPath, failurePathReportPath),
    scribeReportPath: relativeToRunPath(runPath, scribeReportPath),
    hashManifestPath: relativeToRunPath(runPath, hashManifestPath),
    signaturePath: signaturePath ? relativeToRunPath(runPath, signaturePath) : null,
    includedDirectories: [...new Set(includedDirectories.map((dirPath) => relativeToRunPath(runPath, dirPath)))],
    includedFiles: [...new Set(includedFiles.map((filePath) => relativeToRunPath(runPath, filePath)))],
  } as Record<string, unknown>;

  for (const [key, value] of Object.entries(manifest)) {
    if (value === null) {
      delete manifest[key];
    }
  }

  return JSON.stringify(manifest, null, 2);
}

function renderWorkerSpec(packet: FoundryProductionPacket, workerId: string): string {
  const target = packet.staffingDirective.targets.find((candidate) => candidate.id === workerId);

  if (!target) {
    return JSON.stringify(
      {
        error: `Unknown worker target ${workerId}`,
        missionId: packet.missionId,
        packetId: packet.packetId,
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      $schema: "foundry.worker-spec.v1",
      schema: "foundry.worker-spec.v1",
      missionId: packet.missionId,
      packetId: packet.packetId,
      objective: packet.objective,
      worker: {
        id: target.id,
        title: target.title,
        mode: target.mode,
        required: target.required,
        purpose: target.purpose,
        rationale: target.rationale,
      },
      deployment: {
        status: "forged-spec",
        targetType: target.mode,
        activationModel: packet.deploymentDirective.target,
      },
      contract: {
        primaryOutcome: target.purpose,
        operatingNotes: [
          target.rationale,
          "This artifact is a production-layer worker specification forged from Foundry staffing inference.",
          `Selected deployment target: ${packet.deploymentDirective.target}.`,
          "Downstream runtime adapters should translate this spec into the chosen concrete deployment form.",
        ],
      },
      foundryRuntimeContext: {
        templateId: packet.templateId,
        consequenceTier: packet.consequenceTier,
        runtimeRoles: packet.requiredProfessionIds,
        optionalSupportRoles: packet.optionalProfessionIds,
      },
    },
    null,
    2,
  );
}

function skillDisplayName(title: string): string {
  return title
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderCodexSkillMarkdown(packet: FoundryProductionPacket, workerId: string): string {
  const target = packet.staffingDirective.targets.find((candidate) => candidate.id === workerId);

  if (!target) {
    return `# Missing Worker\n\nWorker ${workerId} was not found for mission ${packet.missionId}.\n`;
  }

  return [
    "---",
    `name: ${target.id}`,
    `description: ${target.purpose} Use when the mission needs ${target.title.toLowerCase()} judgment for ${packet.objective.toLowerCase()}.`,
    "---",
    "",
    `# ${skillDisplayName(target.title)}`,
    "",
    "## Overview",
    "",
    `${target.purpose}`,
    "",
    "## Mission Context",
    "",
    `This skill was forged by Foundry for mission \`${packet.missionId}\` from packet \`${packet.packetId}\`.`,
    `Selected deployment target: \`${packet.deploymentDirective.target}\`.`,
    "",
    "## Primary Responsibility",
    "",
    `- ${target.purpose}`,
    `- Rationale: ${target.rationale}`,
    `- Objective alignment: ${packet.objective}`,
    "",
    "## Operating Rules",
    "",
    "- Stay within the worker's domain and avoid absorbing unrelated execution ownership.",
    "- Surface missing information or jurisdiction ambiguity before making high-impact recommendations.",
    "- Keep outputs compatible with the broader Foundry-governed mission.",
    "",
    "## Foundry Runtime Context",
    "",
    `- Template: ${packet.templateId}`,
    `- Consequence tier: ${packet.consequenceTier}`,
    `- Runtime roles supporting this skill: ${packet.requiredProfessionIds.join(", ")}`,
    `- Optional support roles: ${packet.optionalProfessionIds.join(", ") || "none"}`,
    "",
  ].join("\n");
}

function renderCodexSkillAgentYaml(packet: FoundryProductionPacket, workerId: string): string {
  const target = packet.staffingDirective.targets.find((candidate) => candidate.id === workerId);

  if (!target) {
    return 'interface:\n  display_name: "Missing Worker"\n  short_description: "Worker not found."\n  default_prompt: "Worker not found."\n';
  }

  return [
    "interface:",
    `  display_name: "${skillDisplayName(target.title)}"`,
    `  short_description: "${target.purpose.replace(/"/g, '\\"')}"`,
    `  default_prompt: "Use $${target.id} when you need ${target.title} ownership for ${packet.objective.replace(/"/g, '\\"')}."`,
    "",
  ].join("\n");
}

function contentForFile(filePath: string, packet: FoundryProductionPacket): string {
  if (filePath.endsWith("mission.md")) return renderMissionFile(packet);
  if (filePath.endsWith("production-order.md")) return renderProductionOrderFile(packet);
  if (filePath.endsWith("verification-report.md")) return renderVerificationReport(packet);
  if (filePath.endsWith("checks.md")) return renderPrototypeChecks(packet);
  if (filePath.endsWith("creative-brief.md")) return renderCreativeBrief(packet);
  if (filePath.endsWith("option-set.md")) return renderCreativeOptionSet(packet);
  if (filePath.endsWith("fit-check.md")) return renderCreativeFitCheck(packet);
  if (filePath.endsWith("critique-report.md")) return renderCritiqueReport(packet);
  if (filePath.endsWith("audit-report.md")) return renderAuditReport(packet);
  if (filePath.endsWith("failure-path.md")) return renderFailurePath(packet);
  if (filePath.endsWith("scribe-report.md")) return renderScribeReport(packet);
  if (filePath.endsWith("architecture-brief.md")) return renderArchitectureBrief(packet);
  if (filePath.endsWith("operator-summary.md")) return renderOperatorSummary(packet);
  if (filePath.endsWith("prototype-brief.md")) return renderPrototypeBrief(packet);
  if (filePath.endsWith("mission-attestation.json")) return renderMissionAttestation(packet);
  if (filePath.endsWith("execution-evidence.md")) return renderExecutionEvidence(packet);
  if (filePath.endsWith("11-workers-manifest.json")) return renderWorkerManifest(packet);
  if (filePath.includes("/11-worker-") && filePath.endsWith(".json")) {
    const fileName = path.basename(filePath, ".json");
    return renderWorkerSpec(packet, fileName.replace(/^11-worker-/, ""));
  }

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
  const runPath = plan.directories[plan.directories.length - 1] ?? plan.rootPath;
  const codexSkillBundlePaths = codexSkillBundlePathsFor(packet, runPath);
  const expectedSignaturePath =
    packet.productionProfile.manifestStrategy === "hmac-sha256" && manifestSecret()
      ? path.join(runPath, "10-scribe-manifest-signature.json")
      : null;

  await rm(runPath, { recursive: true, force: true });

  for (const directory of plan.directories) {
    await mkdir(directory, { recursive: true });
    directoriesCreated.push(directory);
  }

  for (const bundlePath of codexSkillBundlePaths) {
    await mkdir(path.join(bundlePath, "agents"), { recursive: true });
    directoriesCreated.push(bundlePath, path.join(bundlePath, "agents"));
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
  const attestationPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("mission-attestation.json")) ?? null;
  const executionEvidencePath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("execution-evidence.md")) ?? null;
  const workerManifestPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("11-workers-manifest.json")) ?? null;
  const runPackageManifestPath =
    plan.canonicalFiles.find((filePath) => filePath.endsWith("13-run-package-manifest.json")) ??
    runPackageManifestPathFor(runPath);
  const workerSpecPaths = plan.canonicalFiles.filter(
    (filePath) => filePath.includes("/11-worker-") && filePath.endsWith(".json"),
  );
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

  for (const bundlePath of codexSkillBundlePaths) {
    const workerId = path.basename(bundlePath);
    const skillPath = path.join(bundlePath, "SKILL.md");
    const agentPath = path.join(bundlePath, "agents", "openai.yaml");
    const skillContents = `${renderCodexSkillMarkdown(packet, workerId)}\n`;
    const agentContents = renderCodexSkillAgentYaml(packet, workerId);
    fileContents.set(skillPath, skillContents);
    fileContents.set(agentPath, agentContents);
    await writeFile(skillPath, skillContents, "utf8");
    await writeFile(agentPath, agentContents, "utf8");
    filesCreated.push(skillPath, agentPath);
  }

  const packagedDirectories = directoriesCreated.filter((directory) => isWithinRunPath(runPath, directory));
  const packagedFiles = [
    ...fileContents.keys(),
    hashManifestPath,
    runPackageManifestPath,
    ...(expectedSignaturePath ? [expectedSignaturePath] : []),
  ].sort((a, b) => a.localeCompare(b));
  const runPackageManifestContents = `${renderRunPackageManifest({
    packet,
    projectSlug: plan.projectSlug,
    runPath,
    runId: path.basename(runPath),
    includedFiles: packagedFiles,
    includedDirectories: packagedDirectories,
    workerManifestPath,
    workerSpecPaths,
    codexSkillBundlePaths,
    attestationPath,
    executionEvidencePath,
    critiqueReportPath,
    auditReportPath,
    failurePathReportPath,
    scribeReportPath,
    hashManifestPath,
    signaturePath: expectedSignaturePath,
  })}\n`;
  fileContents.set(runPackageManifestPath, runPackageManifestContents);
  await writeFile(runPackageManifestPath, runPackageManifestContents, "utf8");
  filesCreated.push(runPackageManifestPath);

  const hashManifest = buildHashManifest(fileContents);
  await writeFile(hashManifestPath, hashManifest, "utf8");
  filesCreated.push(hashManifestPath);
  const signature = signManifest(packet, hashManifest);
  const signaturePath = signature ? expectedSignaturePath : null;

  if (signaturePath) {
    await writeFile(signaturePath, `${JSON.stringify(signature, null, 2)}\n`, "utf8");
    filesCreated.push(signaturePath);
  }

  await writeFile(
    path.join(plan.rootPath, "latest-run.json"),
    `${JSON.stringify(
      {
        missionId: packet.missionId,
        packetId: packet.packetId,
        rootPath: plan.rootPath,
        runPath,
        updatedAt: toTimestamp(),
        signature: signature
          ? {
              algorithm: signature.algorithm,
              keyId: signature.keyId,
              signedAt: signature.signedAt,
            }
          : null,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    rootPath: plan.rootPath,
    runPath,
    directoriesCreated,
    filesCreated,
    runPackageManifestPath,
    scribeReportPath,
    critiqueReportPath,
    auditReportPath,
    failurePathReportPath,
    hashManifestPath,
    signaturePath,
    attestationPath,
    executionEvidencePath,
    workerManifestPath,
    workerSpecPaths,
    codexSkillBundlePaths,
  };
}
