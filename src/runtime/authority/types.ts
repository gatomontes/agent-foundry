import type { ConsequenceTier } from "../shared/types.js";

export type AuthorityClass =
  | "READ_ONLY"
  | "DRAFT_ONLY"
  | "PROPOSE_ONLY"
  | "EXECUTE_WITH_APPROVAL"
  | "EXECUTE_WITHIN_SCOPE"
  | "FORBIDDEN";

export type ActionKind =
  | "READ_ARTIFACT"
  | "WRITE_DRAFT"
  | "MODIFY_SCOPED_ARTIFACT"
  | "EXECUTE_TOOL"
  | "DELEGATE_WORK"
  | "REQUEST_APPROVAL"
  | "PUBLISH_RESULT"
  | "DELETE_ARTIFACT";

export interface RuntimeAction {
  kind: ActionKind;
  target: string;
  consequenceTier: ConsequenceTier;
  requiresApproval?: boolean;
}

export interface AuthorityPolicy {
  class: AuthorityClass;
  permittedActions: ActionKind[];
  blockedActions?: ActionKind[];
  maxConsequenceTier: ConsequenceTier;
  scopedTargets?: string[];
  notes?: string[];
}

export interface AuthorityDecision {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
}
