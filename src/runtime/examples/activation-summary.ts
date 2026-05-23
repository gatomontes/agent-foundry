import type { ProductionInitiatedOutcome } from "../boundary/foundry-rook.js";
import type { FoundryProductionPacket } from "../boundary/types.js";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

export function buildProductionOrderSummary(packet: FoundryProductionPacket): string[] {
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
    `Isolde: Required professions -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Optional professions -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    `Isolde: Next active node -> ${
      nextNode
        ? `${nextNode.id} (${nextNode.label}${nextNode.professionId ? ` / ${nextNode.professionId}` : ""})`
        : "unresolved"
    }`,
  ];
}

export function buildActivationSummary(outcome: ProductionInitiatedOutcome): string[] {
  const { packet, missionRuntime } = outcome;
  const topology = missionRuntime.topology;
  const orderedNodeIds = missionRuntime.orderedTopology();
  const nextNodeId = orderedNodeIds[1] ?? orderedNodeIds[0] ?? null;
  const nextNode = topology?.nodes.find((node) => node.id === nextNodeId) ?? null;

  return [
    `Isolde: Mission activated as ${missionRuntime.mission.missionId}.`,
    `Isolde: Objective -> ${packet.objective}`,
    `Isolde: Packet -> ${packet.packetId} | Template -> ${packet.templateId} | Tier -> ${packet.consequenceTier}`,
    `Isolde: Required professions -> ${formatList(packet.requiredProfessionIds)}`,
    `Isolde: Optional professions -> ${formatList(packet.optionalProfessionIds)}`,
    `Isolde: Governance notes -> ${formatList(packet.governanceNotes)}`,
    `Isolde: Next active node -> ${
      nextNode
        ? `${nextNode.id} (${nextNode.label}${nextNode.professionId ? ` / ${nextNode.professionId}` : ""})`
        : "unresolved"
    }`,
    `Isolde: Ordered topology -> ${orderedNodeIds.join(" -> ")}`,
  ];
}
