import type { ConsequenceTier, RuntimeReference, RuntimeTimestamp } from "../shared/types.js";
import type { AuthorityClass } from "../authority/types.js";

export type DelegationStatus =
  | "draft"
  | "active"
  | "blocked"
  | "returned"
  | "cancelled";

export type ReturnCondition = "success" | "blocked" | "needs-human-decision" | "failed";

export interface DelegationEndpoint {
  operatorId: string;
  professionId?: string;
  authorityClass: AuthorityClass;
}

export interface DelegationPacket {
  id: string;
  missionId: string;
  parent: DelegationEndpoint;
  child: DelegationEndpoint;
  objective: string;
  consequenceTier: ConsequenceTier;
  constraints: string[];
  dependencies: RuntimeReference[];
  returnConditions: ReturnCondition[];
  status: DelegationStatus;
  createdAt: RuntimeTimestamp;
  updatedAt: RuntimeTimestamp;
}
