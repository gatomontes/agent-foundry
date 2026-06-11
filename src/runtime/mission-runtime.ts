import { createHash } from "node:crypto";

import type { AuthorityPolicy, RuntimeAction } from "./authority/types.js";
import { evaluateAuthority } from "./authority/policy.js";
import { validateFoundryProductionPacket } from "./boundary/packets.js";
import type { FoundryProductionPacket } from "./boundary/types.js";
import { createDelegationPacket, transitionDelegation } from "./delegation/packet.js";
import type { DelegationPacket, DelegationStatus } from "./delegation/types.js";
import { assertValidCitadelDelegationScroll } from "./schema/citadel-boundary-validator.js";
import { toTimestamp, type ExecutionEvidence } from "./shared/types.js";
import { createMissionSnapshot, transitionMission, withMissionBlocker } from "./state/machine.js";
import type { MissionSnapshot, MissionState } from "./state/types.js";
import { assembleMissionTopology } from "./topology/assembly.js";
import { orderedNodeIds, validateTopology } from "./topology/graph.js";
import type { FlowTemplateId, MissionTopology } from "./topology/types.js";

export class MissionRuntime {
  readonly mission: MissionSnapshot;
  readonly delegations: Map<string, DelegationPacket>;
  readonly productionPacket: FoundryProductionPacket;
  readonly runtimeSessionId: string;
  readonly initiatedAt: string;
  topology: MissionTopology | null;

  constructor(packet: FoundryProductionPacket) {
    const productionPacket = validateFoundryProductionPacket(packet);
    const initiatedAt = toTimestamp();

    this.mission = createMissionSnapshot({
      missionId: productionPacket.missionId,
      state: "initialized",
      summary: productionPacket.summary,
      activeDelegationIds: [],
      artifacts: productionPacket.artifacts,
      blockers: [],
      resumableFrom: productionPacket.citadelRookReference,
    });
    this.delegations = new Map();
    this.productionPacket = productionPacket;
    this.initiatedAt = initiatedAt;
    this.runtimeSessionId = createHash("sha256")
      .update(`${productionPacket.packetId}:${initiatedAt}`)
      .digest("hex")
      .slice(0, 16);
    this.topology = productionPacket.topology
      ? productionPacket.topology
      : assembleMissionTopology({
          missionId: productionPacket.missionId,
          objective: productionPacket.objective,
          consequenceTier: productionPacket.consequenceTier,
          templateId: productionPacket.templateId,
          includeOptional: productionPacket.optionalProfessionIds.length > 0,
          requiredProfessionIds: productionPacket.requiredProfessionIds,
          optionalProfessionIds: productionPacket.optionalProfessionIds,
        });
    validateTopology(this.topology);
  }

  authorize(policy: AuthorityPolicy, action: RuntimeAction) {
    return evaluateAuthority(policy, action);
  }

  delegate(packet: Omit<DelegationPacket, "createdAt" | "updatedAt" | "status">): DelegationPacket {
    const delegation = createDelegationPacket(packet);
    assertValidCitadelDelegationScroll(delegation);
    this.delegations.set(delegation.id, delegation);
    this.mission.activeDelegationIds.push(delegation.id);
    return delegation;
  }

  updateDelegation(delegationId: string, status: DelegationStatus): DelegationPacket {
    const current = this.delegations.get(delegationId);

    if (!current) {
      throw new Error(`Unknown delegation ${delegationId}.`);
    }

    const updated = transitionDelegation(current, status);
    this.delegations.set(delegationId, updated);

    if (status === "returned" || status === "cancelled") {
      this.mission.activeDelegationIds = this.mission.activeDelegationIds.filter((id) => id !== delegationId);
    }

    return updated;
  }

  transition(nextState: MissionState, actorId: string, summary: string): MissionSnapshot {
    const updated = transitionMission(this.mission, nextState, actorId, summary);
    Object.assign(this.mission, updated);
    return this.mission;
  }

  addBlocker(blocker: string): MissionSnapshot {
    const updated = withMissionBlocker(this.mission, blocker);
    Object.assign(this.mission, updated);
    return this.mission;
  }

  setTopology(templateId: FlowTemplateId, objective: string, consequenceTier: MissionTopology["consequenceTier"], includeOptional = false): MissionTopology {
    const topology = assembleMissionTopology({
      missionId: this.mission.missionId,
      objective,
      consequenceTier,
      templateId,
      includeOptional,
    });
    validateTopology(topology);
    this.topology = topology;
    return topology;
  }

  orderedTopology(): string[] {
    if (!this.topology) {
      throw new Error(`Mission ${this.mission.missionId} has no assigned topology.`);
    }

    return orderedNodeIds(this.topology);
  }

  buildExecutionEvidence(initiatedBy = "foundry-rook"): ExecutionEvidence {
    return {
      runtimeSessionId: this.runtimeSessionId,
      initiatedAt: this.initiatedAt,
      initiatedBy,
      missionState: this.mission.state,
      topologyAssigned: this.topology !== null,
      requiredProfessions: [...this.productionPacket.requiredProfessionIds],
      optionalProfessions: [...this.productionPacket.optionalProfessionIds],
      activeDelegationCount: this.delegations.size,
      evidenceRefs: [
        `mission:${this.mission.missionId}`,
        `packet:${this.productionPacket.packetId}`,
        `scroll:${this.productionPacket.scroll.scrollId}`,
        `runtime-session:${this.runtimeSessionId}`,
      ],
    };
  }
}
