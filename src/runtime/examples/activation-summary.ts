import type { ProductionInitiatedOutcome } from "../boundary/foundry-rook.js";
import type { FoundryProductionPacket } from "../boundary/types.js";
import { proposeOutputStructure } from "../output/carmilla.js";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function formatTrail(packet: FoundryProductionPacket): string {
  return packet.scroll.entries.map((entry) => `${entry.station}:${entry.action}`).join(" -> ");
}

function findCanonicalFile(packet: FoundryProductionPacket, suffix: string): string {
  const outputPlan = proposeOutputStructure(packet);
  return outputPlan.canonicalFiles.find((filePath) => filePath.endsWith(suffix)) ?? "unresolved";
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
    `Isolde: Packet -> ${packet.packetId} | Template -> ${packet.templateId} | Tier -> ${packet.consequenceTier}`,
    `Isolde: Execution mode -> ${packet.executionMode ?? "normal"}`,
    `Isolde: Required professions -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Optional professions -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    `Isolde: Carmilla output root -> ${outputPlan.rootPath}`,
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
    `Isolde: Required professions -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Optional professions -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    `Isolde: Carmilla canonized output root -> ${outputPlan.rootPath}`,
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
