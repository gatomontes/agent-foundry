import { assertNonEmpty, toTimestamp } from "../shared/types.js";
import type { MissionSnapshot, MissionState } from "./types.js";

const missionTransitions: Record<MissionState, MissionState[]> = {
  initialized: ["active", "blocked", "archived"],
  active: ["blocked", "waiting-review", "needs-human-decision", "partial", "completed", "failed"],
  blocked: ["active", "needs-human-decision", "failed", "archived"],
  "waiting-review": ["active", "completed", "failed", "needs-human-decision"],
  "needs-human-decision": ["active", "blocked", "failed", "archived"],
  partial: ["active", "waiting-review", "blocked", "failed", "completed"],
  completed: ["archived"],
  failed: ["archived"],
  archived: [],
};

export function createMissionSnapshot(
  mission: Omit<MissionSnapshot, "createdAt" | "updatedAt" | "auditTrail"> & {
    auditTrail?: MissionSnapshot["auditTrail"];
  },
): MissionSnapshot {
  assertNonEmpty(mission.missionId, "mission.missionId");
  assertNonEmpty(mission.summary, "mission.summary");

  const timestamp = toTimestamp();

  return {
    ...mission,
    auditTrail: mission.auditTrail ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function transitionMission(
  snapshot: MissionSnapshot,
  nextState: MissionState,
  actorId: string,
  summary: string,
): MissionSnapshot {
  assertNonEmpty(actorId, "actorId");
  assertNonEmpty(summary, "summary");

  if (!missionTransitions[snapshot.state].includes(nextState)) {
    throw new Error(`Cannot transition mission ${snapshot.missionId} from ${snapshot.state} to ${nextState}.`);
  }

  const at = toTimestamp();

  return {
    ...snapshot,
    state: nextState,
    summary,
    updatedAt: at,
    auditTrail: [
      ...snapshot.auditTrail,
      {
        at,
        actorId,
        summary: `${snapshot.state} -> ${nextState}: ${summary}`,
      },
    ],
  };
}

export function withMissionBlocker(snapshot: MissionSnapshot, blocker: string): MissionSnapshot {
  assertNonEmpty(blocker, "blocker");

  return {
    ...snapshot,
    blockers: snapshot.blockers.includes(blocker) ? snapshot.blockers : [...snapshot.blockers, blocker],
    updatedAt: toTimestamp(),
  };
}
