import { assertNonEmpty } from "../shared/types.js";
import { requireProfessions } from "../professions/registry.js";
import { validateTopology } from "../topology/graph.js";
import { createAuditScroll } from "./scribe.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  OperatorPromptRequest,
} from "./types.js";

export function validateOperatorPromptRequest(packet: OperatorPromptRequest): OperatorPromptRequest {
  assertNonEmpty(packet.packetId, "operatorPromptRequest.packetId");
  assertNonEmpty(packet.missionId, "operatorPromptRequest.missionId");
  assertNonEmpty(packet.reason, "operatorPromptRequest.reason");

  if (packet.questions.length === 0) {
    throw new Error("operatorPromptRequest.questions must contain at least one operator-facing question.");
  }

  if (packet.returnRoute !== "isolde") {
    throw new Error("operatorPromptRequest.returnRoute must be isolde.");
  }

  if (packet.scroll.entries.length === 0) {
    throw new Error("operatorPromptRequest.scroll must contain at least one entry.");
  }

  return packet;
}

export function validateFoundryProductionPacket(packet: FoundryProductionPacket): FoundryProductionPacket {
  assertNonEmpty(packet.packetId, "foundryProductionPacket.packetId");
  assertNonEmpty(packet.missionId, "foundryProductionPacket.missionId");
  assertNonEmpty(packet.citadelRookReference, "foundryProductionPacket.citadelRookReference");
  assertNonEmpty(packet.objective, "foundryProductionPacket.objective");
  assertNonEmpty(packet.summary, "foundryProductionPacket.summary");
  assertNonEmpty(packet.proposal.title, "foundryProductionPacket.proposal.title");
  assertNonEmpty(packet.proposal.summary, "foundryProductionPacket.proposal.summary");

  if (packet.requiredProfessionIds.length === 0) {
    throw new Error("foundryProductionPacket.requiredProfessionIds must contain at least one profession.");
  }

  if (packet.proposal.items.length === 0) {
    throw new Error("foundryProductionPacket.proposal.items must contain at least one proposal item.");
  }

  for (const [index, item] of packet.proposal.items.entries()) {
    assertNonEmpty(item.action, `foundryProductionPacket.proposal.items[${index}].action`);
    assertNonEmpty(item.purpose, `foundryProductionPacket.proposal.items[${index}].purpose`);
    assertNonEmpty(item.details, `foundryProductionPacket.proposal.items[${index}].details`);
    assertNonEmpty(
      item.expectedOutcome,
      `foundryProductionPacket.proposal.items[${index}].expectedOutcome`,
    );
  }

  if (packet.scroll.entries.length === 0) {
    throw new Error("foundryProductionPacket.scroll must contain at least one entry.");
  }

  requireProfessions(packet.requiredProfessionIds);
  requireProfessions(packet.optionalProfessionIds);

  if (packet.topology) {
    if (packet.topology.missionId !== packet.missionId) {
      throw new Error("foundryProductionPacket.topology.missionId must match packet missionId.");
    }

    if (packet.topology.templateId !== packet.templateId) {
      throw new Error("foundryProductionPacket.topology.templateId must match packet templateId.");
    }

    validateTopology(packet.topology);

    const packetRequired = new Set(packet.requiredProfessionIds);
    const topologyRequired = new Set(packet.topology.requiredProfessionIds);

    for (const professionId of packetRequired) {
      if (!topologyRequired.has(professionId)) {
        throw new Error(`Packet topology is missing required profession ${professionId}.`);
      }
    }
  }

  return packet;
}

export function normalizeCitadelReturnForFoundry(
  packet: CitadelRookReturnPacket,
): FoundryProductionPacket | OperatorPromptRequest {
  assertNonEmpty(packet.packetId, "citadelRookReturn.packetId");
  assertNonEmpty(packet.missionId, "citadelRookReturn.missionId");

  if (packet.scroll.entries.length === 0) {
    throw new Error("citadelRookReturn.scroll must contain at least one entry.");
  }

  if (packet.source !== "citadel-rook") {
    throw new Error("Citadel return packet must originate from citadel-rook.");
  }

  if (packet.returnKind === "production-order") {
    if (!packet.productionOrder) {
      throw new Error("Citadel production-order packet is missing productionOrder.");
    }

    return validateFoundryProductionPacket(packet.productionOrder);
  }

  if (!packet.operatorPromptRequest) {
    throw new Error("Citadel operator-prompt-request packet is missing operatorPromptRequest.");
  }

  return validateOperatorPromptRequest(packet.operatorPromptRequest);
}
