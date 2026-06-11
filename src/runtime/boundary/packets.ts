import { assertNonEmpty } from "../shared/types.js";
import { requireProfessions } from "../professions/registry.js";
import { validateTopology } from "../topology/graph.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  NotarialRecord,
  OperatorPromptRequest,
  RookReturnStatus,
} from "./types.js";

function validateNotarialRecord(record: NotarialRecord): NotarialRecord {
  assertNonEmpty(record.preparedBy, "notarialRecord.preparedBy");
  assertNonEmpty(record.preReturnSummary.dispositionContext, "notarialRecord.preReturnSummary.dispositionContext");
  assertNonEmpty(record.preReturnSummary.archivalReference, "notarialRecord.preReturnSummary.archivalReference");

  if (!record.preReturnSummary.archivalCopyCreated) {
    throw new Error("notarialRecord.preReturnSummary.archivalCopyCreated must be true before Foundry accepts external return readiness.");
  }

  if (record.stationFindings.length === 0) {
    throw new Error("notarialRecord.stationFindings must contain at least one materially participating station.");
  }

  for (const [index, finding] of record.stationFindings.entries()) {
    assertNonEmpty(finding.station, `notarialRecord.stationFindings[${index}].station`);
    assertNonEmpty(
      finding.findingSummary,
      `notarialRecord.stationFindings[${index}].findingSummary`,
    );
  }

  return record;
}

function validateReturnStatus(status: RookReturnStatus): RookReturnStatus {
  if (!status.notarialSummaryPresent) {
    throw new Error("citadelRookReturn.returnStatus.notarialSummaryPresent must be true.");
  }

  if (!status.archivalCopyConfirmed) {
    throw new Error("citadelRookReturn.returnStatus.archivalCopyConfirmed must be true.");
  }

  if (!status.readyForExternalReturn) {
    throw new Error("citadelRookReturn.returnStatus.readyForExternalReturn must be true.");
  }

  return status;
}

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
  assertNonEmpty(packet.staffingDirective.intent, "foundryProductionPacket.staffingDirective.intent");
  assertNonEmpty(packet.deploymentDirective.target, "foundryProductionPacket.deploymentDirective.target");
  assertNonEmpty(packet.deploymentDirective.rationale, "foundryProductionPacket.deploymentDirective.rationale");
  assertNonEmpty(packet.handoffDirective.recipientType, "foundryProductionPacket.handoffDirective.recipientType");
  assertNonEmpty(packet.handoffDirective.mode, "foundryProductionPacket.handoffDirective.mode");
  assertNonEmpty(packet.handoffDirective.packageScope, "foundryProductionPacket.handoffDirective.packageScope");
  assertNonEmpty(
    packet.handoffDirective.operatorDestinationPolicy,
    "foundryProductionPacket.handoffDirective.operatorDestinationPolicy",
  );
  assertNonEmpty(packet.handoffDirective.rationale, "foundryProductionPacket.handoffDirective.rationale");
  assertNonEmpty(packet.productionProfile.mode, "foundryProductionPacket.productionProfile.mode");
  assertNonEmpty(
    packet.productionProfile.evidenceLevel,
    "foundryProductionPacket.productionProfile.evidenceLevel",
  );
  assertNonEmpty(
    packet.productionProfile.retentionPolicy,
    "foundryProductionPacket.productionProfile.retentionPolicy",
  );
  assertNonEmpty(
    packet.productionProfile.manifestStrategy,
    "foundryProductionPacket.productionProfile.manifestStrategy",
  );

  if (packet.requiredProfessionIds.length === 0) {
    throw new Error("foundryProductionPacket.requiredProfessionIds must contain at least one profession.");
  }

  if (packet.proposal.items.length === 0) {
    throw new Error("foundryProductionPacket.proposal.items must contain at least one proposal item.");
  }

  if (packet.staffingDirective.targets.length === 0) {
    throw new Error("foundryProductionPacket.staffingDirective.targets must contain at least one target.");
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

  for (const [index, target] of packet.staffingDirective.targets.entries()) {
    assertNonEmpty(target.id, `foundryProductionPacket.staffingDirective.targets[${index}].id`);
    assertNonEmpty(target.title, `foundryProductionPacket.staffingDirective.targets[${index}].title`);
    assertNonEmpty(target.purpose, `foundryProductionPacket.staffingDirective.targets[${index}].purpose`);
    assertNonEmpty(target.rationale, `foundryProductionPacket.staffingDirective.targets[${index}].rationale`);
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

  validateNotarialRecord(packet.notarialRecord);
  validateReturnStatus(packet.returnStatus);

  if (packet.source !== "citadel-rook") {
    throw new Error("Citadel return packet must originate from citadel-rook.");
  }

  if (packet.returnKind === "production-order") {
    if (!packet.productionOrder) {
      throw new Error("Citadel production-order packet is missing productionOrder.");
    }

    return validateFoundryProductionPacket({
      ...packet.productionOrder,
      notarialRecord: packet.notarialRecord,
      returnStatus: packet.returnStatus,
    });
  }

  if (!packet.operatorPromptRequest) {
    throw new Error("Citadel operator-prompt-request packet is missing operatorPromptRequest.");
  }

  return validateOperatorPromptRequest({
    ...packet.operatorPromptRequest,
    notarialRecord: packet.notarialRecord,
    returnStatus: packet.returnStatus,
  });
}
