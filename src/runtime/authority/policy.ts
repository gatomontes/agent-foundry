import { assertNonEmpty } from "../shared/types.js";
import type {
  ActionKind,
  AuthorityClass,
  AuthorityDecision,
  AuthorityPolicy,
  RuntimeAction,
} from "./types.js";

const tierOrder = ["trivial", "routine", "important", "critical"] as const;

const authorityDefaults: Record<AuthorityClass, ActionKind[]> = {
  READ_ONLY: ["READ_ARTIFACT", "REQUEST_APPROVAL"],
  DRAFT_ONLY: ["READ_ARTIFACT", "WRITE_DRAFT", "REQUEST_APPROVAL"],
  PROPOSE_ONLY: ["READ_ARTIFACT", "WRITE_DRAFT", "DELEGATE_WORK", "REQUEST_APPROVAL"],
  EXECUTE_WITH_APPROVAL: [
    "READ_ARTIFACT",
    "WRITE_DRAFT",
    "MODIFY_SCOPED_ARTIFACT",
    "EXECUTE_TOOL",
    "DELEGATE_WORK",
    "REQUEST_APPROVAL",
  ],
  EXECUTE_WITHIN_SCOPE: [
    "READ_ARTIFACT",
    "WRITE_DRAFT",
    "MODIFY_SCOPED_ARTIFACT",
    "EXECUTE_TOOL",
    "DELEGATE_WORK",
    "REQUEST_APPROVAL",
    "PUBLISH_RESULT",
  ],
  FORBIDDEN: [],
};

function tierRank(tier: RuntimeAction["consequenceTier"]): number {
  return tierOrder.indexOf(tier);
}

function targetIsInScope(target: string, scopedTargets?: string[]): boolean {
  if (!scopedTargets || scopedTargets.length === 0) {
    return true;
  }

  return scopedTargets.some((prefix) => target.startsWith(prefix));
}

export function createAuthorityPolicy(policy: AuthorityPolicy): AuthorityPolicy {
  const permittedActions =
    policy.permittedActions.length > 0
      ? policy.permittedActions
      : authorityDefaults[policy.class];

  return {
    ...policy,
    permittedActions,
  };
}

export function evaluateAuthority(
  policy: AuthorityPolicy,
  action: RuntimeAction,
): AuthorityDecision {
  assertNonEmpty(action.target, "action.target");

  if (policy.class === "FORBIDDEN") {
    return {
      allowed: false,
      reason: "Authority class FORBIDDEN cannot perform runtime actions.",
      requiresApproval: false,
    };
  }

  if (tierRank(action.consequenceTier) > tierRank(policy.maxConsequenceTier)) {
    return {
      allowed: false,
      reason: `Action tier ${action.consequenceTier} exceeds policy maximum ${policy.maxConsequenceTier}.`,
      requiresApproval: false,
    };
  }

  if (!policy.permittedActions.includes(action.kind)) {
    return {
      allowed: false,
      reason: `Action ${action.kind} is not permitted for authority class ${policy.class}.`,
      requiresApproval: false,
    };
  }

  if (policy.blockedActions?.includes(action.kind)) {
    return {
      allowed: false,
      reason: `Action ${action.kind} is explicitly blocked by policy.`,
      requiresApproval: false,
    };
  }

  if (!targetIsInScope(action.target, policy.scopedTargets)) {
    return {
      allowed: false,
      reason: `Target ${action.target} is outside the policy scope.`,
      requiresApproval: false,
    };
  }

  const requiresApproval =
    action.requiresApproval === true || policy.class === "EXECUTE_WITH_APPROVAL";

  return {
    allowed: true,
    reason: requiresApproval
      ? "Action is permitted but requires explicit approval."
      : "Action is permitted within scope.",
    requiresApproval,
  };
}
