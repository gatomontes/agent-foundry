import { assertNonEmpty, toTimestamp } from "../shared/types.js";
import type { DelegationPacket, DelegationStatus } from "./types.js";

const allowedTransitions: Record<DelegationStatus, DelegationStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["blocked", "returned", "cancelled"],
  blocked: ["active", "returned", "cancelled"],
  returned: [],
  cancelled: [],
};

export function createDelegationPacket(
  packet: Omit<DelegationPacket, "createdAt" | "updatedAt" | "status"> & {
    status?: DelegationStatus;
  },
): DelegationPacket {
  assertNonEmpty(packet.id, "delegation.id");
  assertNonEmpty(packet.missionId, "delegation.missionId");
  assertNonEmpty(packet.parent.operatorId, "delegation.parent.operatorId");
  assertNonEmpty(packet.child.operatorId, "delegation.child.operatorId");
  assertNonEmpty(packet.objective, "delegation.objective");

  if (packet.returnConditions.length === 0) {
    throw new Error("delegation.returnConditions must contain at least one terminal condition.");
  }

  const timestamp = toTimestamp();

  return {
    ...packet,
    status: packet.status ?? "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function transitionDelegation(
  packet: DelegationPacket,
  nextStatus: DelegationStatus,
): DelegationPacket {
  if (!allowedTransitions[packet.status].includes(nextStatus)) {
    throw new Error(`Cannot transition delegation ${packet.id} from ${packet.status} to ${nextStatus}.`);
  }

  return {
    ...packet,
    status: nextStatus,
    updatedAt: toTimestamp(),
  };
}
