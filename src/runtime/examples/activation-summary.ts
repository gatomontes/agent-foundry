import type { ProductionInitiatedOutcome } from "../boundary/foundry-rook.js";
import type { FoundryProductionPacket, NotarialStationFinding } from "../boundary/types.js";
import { proposeOutputStructure } from "../output/carmilla.js";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function formatStaffingTargets(packet: FoundryProductionPacket): string {
  return packet.staffingDirective.targets.length > 0
    ? packet.staffingDirective.targets
        .map((target) => `${target.title} [${target.mode}${target.required ? ", required" : ", optional"}]`)
        .join(", ")
    : "none";
}

function formatHandoff(packet: FoundryProductionPacket): string {
  return `${packet.handoffDirective.recipientType} via ${packet.handoffDirective.mode}`;
}

function formatProposalItems(packet: FoundryProductionPacket): string[] {
  return packet.proposal.items.flatMap((item, index) => [
    `Isolde: Intended change/build ${index + 1} -> ${item.action}`,
    `Isolde: Purpose -> ${item.purpose}`,
    `Isolde: Build details -> ${item.details}`,
    `Isolde: Expected outcome -> ${item.expectedOutcome}`,
  ]);
}

function formatTrail(packet: FoundryProductionPacket): string {
  return packet.scroll.entries.map((entry) => `${entry.station}:${entry.action}`).join(" -> ");
}

function findCanonicalFile(packet: FoundryProductionPacket, suffix: string): string {
  const outputPlan = proposeOutputStructure(packet);
  return outputPlan.canonicalFiles.find((filePath) => filePath.endsWith(suffix)) ?? "unresolved";
}

function formatFinding(finding: NotarialStationFinding): string[] {
  return [
    `Isolde: ${finding.station} finding -> ${finding.findingSummary}`,
    `Isolde: ${finding.station} proposed actions -> ${formatList(finding.proposedActions)}`,
    `Isolde: ${finding.station} blocked actions -> ${formatList(finding.blockedActions)}`,
    `Isolde: ${finding.station} unresolved questions -> ${formatList(finding.unresolvedQuestions)}`,
  ];
}

function formatNotarial(packet: FoundryProductionPacket): string[] {
  const record = packet.notarialRecord;

  if (!record) {
    return ["Isolde: Notarial summary -> missing"];
  }

  return [
    `Isolde: Notary -> ${record.preparedBy}`,
    `Isolde: Disposition context -> ${record.preReturnSummary.dispositionContext}`,
    `Isolde: Required actions -> ${formatList(record.preReturnSummary.requiredActions)}`,
    `Isolde: Recommended actions -> ${formatList(record.preReturnSummary.recommendedActions)}`,
    `Isolde: Blocked actions -> ${formatList(record.preReturnSummary.blockedActions)}`,
    `Isolde: Human decisions required -> ${formatList(record.preReturnSummary.humanDecisionsRequired)}`,
    `Isolde: Follow-up routes -> ${formatList(record.preReturnSummary.followUpRoutes)}`,
    `Isolde: Archival reference -> ${record.preReturnSummary.archivalReference}`,
    ...record.stationFindings.flatMap(formatFinding),
  ];
}

export function buildProductionOrderSummary(packet: FoundryProductionPacket): string[] {
  const outputPlan = proposeOutputStructure(packet);
  const orderedNodeIds =
    packet.topology?.nodes.length
      ? packet.topology.nodes.map((node) => node.id)
      : [];
  const nextNodeId = orderedNodeIds[1] ?? orderedNodeIds[0] ?? null;
  const nextNode = packet.topology?.nodes.find((node) => node.id === nextNodeId) ?? null;

  return [
    "Isolde: Citadel has returned a governed production-ready packet.",
    `Isolde: Objective -> ${packet.objective}`,
    `Isolde: Summary -> ${packet.summary}`,
    `Isolde: Citadel proposal -> ${packet.proposal.title}`,
    `Isolde: Proposal summary -> ${packet.proposal.summary}`,
    ...formatProposalItems(packet),
    `Isolde: Packet -> ${packet.packetId} | Template -> ${packet.templateId} | Tier -> ${packet.consequenceTier}`,
    `Isolde: Execution mode -> ${packet.executionMode ?? "normal"}`,
    `Isolde: Staffing intent -> ${packet.staffingDirective.intent}`,
    `Isolde: Mission target workers -> ${formatStaffingTargets(packet)}`,
    `Isolde: Deployment target -> ${packet.deploymentDirective.target}`,
    `Isolde: Handoff -> ${formatHandoff(packet)}`,
    `Isolde: Foundry runtime roles -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Foundry optional support roles -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    ...formatNotarial(packet),
    `Isolde: The output root is -> ${outputPlan.rootPath}`,
    `Isolde: Carmilla output directories -> ${formatList(outputPlan.directories)}`,
    `Isolde: Carmilla critique report -> ${findCanonicalFile(packet, "critique-report.md")}`,
    `Isolde: Carmilla audit report -> ${findCanonicalFile(packet, "audit-report.md")}`,
    `Isolde: Carmilla failure path -> ${findCanonicalFile(packet, "failure-path.md")}`,
    `Isolde: Carmilla hash manifest -> ${findCanonicalFile(packet, "output-manifest.sha256")}`,
    `Isolde: Carmilla scribe report -> ${
      outputPlan.canonicalFiles.find((filePath) => filePath.endsWith("scribe-report.md")) ?? "unresolved"
    }`,
    `Isolde: Scroll trail -> ${formatTrail(packet)}`,
    `Isolde: Next active node -> ${
      nextNode
        ? `${nextNode.id} (${nextNode.label}${nextNode.professionId ? ` / ${nextNode.professionId}` : ""})`
        : "unresolved"
    }`,
  ];
}

export function buildActivationSummary(outcome: ProductionInitiatedOutcome): string[] {
  const { packet, missionRuntime } = outcome;
  const outputPlan = proposeOutputStructure(packet);
  const topology = missionRuntime.topology;
  const orderedNodeIds = missionRuntime.orderedTopology();
  const nextNodeId = orderedNodeIds[1] ?? orderedNodeIds[0] ?? null;
  const nextNode = topology?.nodes.find((node) => node.id === nextNodeId) ?? null;

  return [
    `Isolde: Mission activated as ${missionRuntime.mission.missionId}.`,
    `Isolde: Objective -> ${packet.objective}`,
    `Isolde: Packet -> ${packet.packetId} | Template -> ${packet.templateId} | Tier -> ${packet.consequenceTier}`,
    `Isolde: Execution mode -> ${packet.executionMode ?? "normal"}`,
    `Isolde: Staffing intent -> ${packet.staffingDirective.intent}`,
    `Isolde: Mission target workers -> ${formatStaffingTargets(packet)}`,
    `Isolde: Deployment target -> ${packet.deploymentDirective.target}`,
    `Isolde: Handoff -> ${formatHandoff(packet)}`,
    `Isolde: Foundry runtime roles -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Foundry optional support roles -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    ...formatNotarial(packet),
    `Isolde: The output root is -> ${outputPlan.rootPath}`,
    `Isolde: Carmilla canonical files -> ${formatList(outputPlan.canonicalFiles)}`,
    `Isolde: Carmilla critique report -> ${findCanonicalFile(packet, "critique-report.md")}`,
    `Isolde: Carmilla audit report -> ${findCanonicalFile(packet, "audit-report.md")}`,
    `Isolde: Carmilla failure path -> ${findCanonicalFile(packet, "failure-path.md")}`,
    `Isolde: Carmilla hash manifest -> ${findCanonicalFile(packet, "output-manifest.sha256")}`,
    `Isolde: Carmilla scribe report -> ${
      outputPlan.canonicalFiles.find((filePath) => filePath.endsWith("scribe-report.md")) ?? "unresolved"
    }`,
    `Isolde: Scroll trail -> ${formatTrail(packet)}`,
    `Isolde: Next active node -> ${
      nextNode
        ? `${nextNode.id} (${nextNode.label}${nextNode.professionId ? ` / ${nextNode.professionId}` : ""})`
        : "unresolved"
    }`,
    `Isolde: Ordered topology -> ${orderedNodeIds.join(" -> ")}`,
  ];
}
