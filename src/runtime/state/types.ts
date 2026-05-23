import type { AuditRecord, RuntimeReference, RuntimeTimestamp } from "../shared/types.js";

export type MissionState =
  | "initialized"
  | "active"
  | "blocked"
  | "waiting-review"
  | "needs-human-decision"
  | "partial"
  | "completed"
  | "failed"
  | "archived";

export interface MissionSnapshot {
  missionId: string;
  state: MissionState;
  summary: string;
  activeDelegationIds: string[];
  artifacts: RuntimeReference[];
  blockers: string[];
  resumableFrom: string | null;
  auditTrail: AuditRecord[];
  createdAt: RuntimeTimestamp;
  updatedAt: RuntimeTimestamp;
}
