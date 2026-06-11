import type { DelegationPacket } from "../delegation/types.js";
import type { IsoldeIntakePacket } from "../boundary/isolde.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  NotarialRecord,
  OperatorPromptRequest,
  RookReturnStatus,
} from "../boundary/types.js";
import type { AuditScroll } from "../boundary/scribe.js";
import type { ValidationIssue, ValidationResult } from "./types.js";
import { loadSchema, validateAgainstSchema } from "./validator.js";

function withMissionId(value: { missionId: string | null }): { mission_id?: string } {
  return value.missionId ? { mission_id: value.missionId } : {};
}

function projectAuditScroll(scroll: AuditScroll): Record<string, unknown> {
  return {
    scroll_id: scroll.scrollId,
    attached_scroll_id: scroll.attachedScrollId,
    ...withMissionId(scroll),
    entries: scroll.entries.map((entry) => ({
      at: entry.at,
      station: entry.station,
      action: entry.action,
      summary: entry.summary,
    })),
  };
}

function projectNotarialRecord(record: NotarialRecord): Record<string, unknown> {
  return {
    prepared_by: record.preparedBy,
    prepared_at: record.preparedAt,
    station_findings: record.stationFindings.map((finding) => ({
      station: finding.station,
      finding_summary: finding.findingSummary,
      evidence_refs: finding.evidenceRefs,
      proposed_actions: finding.proposedActions,
      blocked_actions: finding.blockedActions,
      unresolved_questions: finding.unresolvedQuestions,
    })),
    pre_return_summary: {
      disposition_context: record.preReturnSummary.dispositionContext,
      required_actions: record.preReturnSummary.requiredActions,
      recommended_actions: record.preReturnSummary.recommendedActions,
      blocked_actions: record.preReturnSummary.blockedActions,
      human_decisions_required: record.preReturnSummary.humanDecisionsRequired,
      follow_up_routes: record.preReturnSummary.followUpRoutes,
      archival_copy_created: record.preReturnSummary.archivalCopyCreated,
      archival_reference: record.preReturnSummary.archivalReference,
    },
  };
}

function projectRookReturnStatus(status: RookReturnStatus): Record<string, unknown> {
  return {
    normalized_by_rook: status.normalizedByRook,
    notarial_summary_present: status.notarialSummaryPresent,
    archival_copy_confirmed: status.archivalCopyConfirmed,
    ready_for_external_return: status.readyForExternalReturn,
  };
}

function projectOperatorPromptRequest(packet: OperatorPromptRequest): Record<string, unknown> {
  return {
    packet_id: packet.packetId,
    mission_id: packet.missionId,
    reason: packet.reason,
    questions: packet.questions,
    blocking_issues: packet.blockingIssues,
    return_route: packet.returnRoute,
    scroll: projectAuditScroll(packet.scroll),
    notarial_record: packet.notarialRecord ? projectNotarialRecord(packet.notarialRecord) : {},
    return_status: packet.returnStatus ? projectRookReturnStatus(packet.returnStatus) : {},
    created_at: packet.createdAt,
  };
}

function projectProductionOrder(packet: FoundryProductionPacket): Record<string, unknown> {
  return {
    packet_id: packet.packetId,
    mission_id: packet.missionId,
    citadel_rook_reference: packet.citadelRookReference,
    objective: packet.objective,
    summary: packet.summary,
    proposal: {
      title: packet.proposal.title,
      summary: packet.proposal.summary,
      items: packet.proposal.items.map((item) => ({
        action: item.action,
        purpose: item.purpose,
        details: item.details,
        expected_outcome: item.expectedOutcome,
      })),
    },
    consequence_tier: packet.consequenceTier,
    template_id: packet.templateId,
    staffing_directive: {
      intent: packet.staffingDirective.intent,
      targets: packet.staffingDirective.targets.map((target) => ({
        id: target.id,
        title: target.title,
        mode: target.mode,
        purpose: target.purpose,
        rationale: target.rationale,
        required: target.required,
      })),
    },
    deployment_directive: {
      target: packet.deploymentDirective.target,
      rationale: packet.deploymentDirective.rationale,
    },
    handoff_directive: {
      recipient_type: packet.handoffDirective.recipientType,
      mode: packet.handoffDirective.mode,
      package_scope: packet.handoffDirective.packageScope,
      operator_destination_policy: packet.handoffDirective.operatorDestinationPolicy,
      rationale: packet.handoffDirective.rationale,
    },
    required_profession_ids: packet.requiredProfessionIds,
    optional_profession_ids: packet.optionalProfessionIds,
    governance_notes: packet.governanceNotes,
    production_profile: {
      mode: packet.productionProfile.mode,
      evidence_level: packet.productionProfile.evidenceLevel,
      retention_policy: packet.productionProfile.retentionPolicy,
      manifest_strategy: packet.productionProfile.manifestStrategy,
    },
    scroll: projectAuditScroll(packet.scroll),
    notarial_record: packet.notarialRecord ? projectNotarialRecord(packet.notarialRecord) : {},
    return_status: packet.returnStatus ? projectRookReturnStatus(packet.returnStatus) : {},
    created_at: packet.createdAt,
  };
}

function projectCitadelRookReturn(packet: CitadelRookReturnPacket): Record<string, unknown> {
  return {
    packet_id: packet.packetId,
    mission_id: packet.missionId,
    source: packet.source,
    return_kind: packet.returnKind,
    scroll: projectAuditScroll(packet.scroll),
    notarial_record: projectNotarialRecord(packet.notarialRecord),
    return_status: projectRookReturnStatus(packet.returnStatus),
    created_at: packet.createdAt,
  };
}

function projectRookIntake(packet: IsoldeIntakePacket): Record<string, unknown> {
  return {
    scroll_id: packet.packetId,
    audit_scroll: projectAuditScroll(packet.scroll),
    created_at: packet.createdAt,
    source_type: "human",
    source_identity: packet.operatorId,
    continuity_reference: packet.requestId,
    inbound_request: {
      raw_text: packet.objective,
      referenced_artifacts: [],
      received_channel: "isolde",
    },
    expected_outcome: {
      requested_deliverable: packet.objective,
      success_condition_hint: [],
      requested_output_format: "unspecified",
    },
    structured_intake: {
      objective: packet.objective,
      scope: "operator-request",
      explicit_constraints: packet.notes,
      inferred_constraints: [],
      dependencies: [],
      open_questions: [],
      assumptions: [],
    },
    governance_signals: {
      authority_clues: [`operator:${packet.operatorId}`],
      consequence_clues: [],
      verification_needs: [],
      escalation_triggers: [],
    },
    routing: {
      recommended_next_phase: "classify",
      recommended_contracts: [
        "rook-contract",
        "audit-scroll-schema",
      ],
      recommended_roles: [
        "foundry-rook",
        "citadel-rook",
      ],
    },
    scroll_status: {
      intake_state: packet.notes.length > 0 ? "CLARIFIED" : "RECEIVED",
      clarification_required: false,
      ready_for_classification: true,
    },
  };
}

function projectDelegation(packet: DelegationPacket): Record<string, unknown> {
  return {
    operation: {
      id: packet.id,
      mission_id: packet.missionId,
      objective: packet.objective,
    },
    authority: {
      delegator: packet.parent.operatorId,
      executor: packet.child.operatorId,
    },
    contracts: {
      execution: "foundry.execution-contract",
      verification: "citadel.verification-contract",
    },
    constraints: {
      consequence_tier: packet.consequenceTier,
      constraint_notes: packet.constraints,
      escalation_policy: "citadel.escalation-protocol",
    },
    artifacts: {
      required_outputs: packet.dependencies.map((dependency) => `${dependency.kind}:${dependency.id}`),
      merge_owner: packet.parent.operatorId,
      output_contract: "foundry.run-package.v1",
    },
    reporting: {
      required_state_emission: true,
      return_conditions: packet.returnConditions,
      status: packet.status,
    },
  };
}

function prefixIssues(prefix: string, issues: ValidationIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path === "$" ? prefix : `${prefix}${issue.path.slice(1)}`,
    message: issue.message,
  }));
}

function mergeResults(...results: ValidationResult[]): ValidationResult {
  const issues = results.flatMap((result) => result.issues);
  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateProjected(value: Record<string, unknown>, schemaFileName: string): ValidationResult {
  return validateAgainstSchema(value, loadSchema(schemaFileName));
}

export function validateCitadelAuditScroll(scroll: AuditScroll): ValidationResult {
  return validateProjected(projectAuditScroll(scroll), "citadel.audit-scroll.v1.schema.json");
}

export function validateCitadelNotarialRecord(record: NotarialRecord): ValidationResult {
  return validateProjected(projectNotarialRecord(record), "citadel.notarial-record.v1.schema.json");
}

export function validateCitadelRookReturnStatus(status: RookReturnStatus): ValidationResult {
  return validateProjected(projectRookReturnStatus(status), "citadel.rook-return-status.v1.schema.json");
}

export function validateCitadelRookIntake(packet: IsoldeIntakePacket): ValidationResult {
  return mergeResults(
    validateProjected(projectRookIntake(packet), "citadel.rook-intake-scroll.v1.schema.json"),
    prefixResult("$.audit_scroll", validateCitadelAuditScroll(packet.scroll)),
  );
}

export function validateCitadelOperatorPromptRequest(packet: OperatorPromptRequest): ValidationResult {
  return mergeResults(
    validateProjected(projectOperatorPromptRequest(packet), "citadel.operator-prompt-request.v1.schema.json"),
    prefixResult("$.scroll", validateCitadelAuditScroll(packet.scroll)),
    packet.notarialRecord
      ? prefixResult("$.notarial_record", validateCitadelNotarialRecord(packet.notarialRecord))
      : invalidResult("$.notarial_record", "Missing required notarial record."),
    packet.returnStatus
      ? prefixResult("$.return_status", validateCitadelRookReturnStatus(packet.returnStatus))
      : invalidResult("$.return_status", "Missing required return status."),
  );
}

export function validateCitadelProductionOrder(packet: FoundryProductionPacket): ValidationResult {
  return mergeResults(
    validateProjected(projectProductionOrder(packet), "citadel.production-order.v1.schema.json"),
    prefixResult("$.scroll", validateCitadelAuditScroll(packet.scroll)),
    packet.notarialRecord
      ? prefixResult("$.notarial_record", validateCitadelNotarialRecord(packet.notarialRecord))
      : invalidResult("$.notarial_record", "Missing required notarial record."),
    packet.returnStatus
      ? prefixResult("$.return_status", validateCitadelRookReturnStatus(packet.returnStatus))
      : invalidResult("$.return_status", "Missing required return status."),
  );
}

export function validateCitadelRookReturnPacket(packet: CitadelRookReturnPacket): ValidationResult {
  const nested =
    packet.returnKind === "production-order"
      ? packet.productionOrder
        ? prefixResult("$.production_order", validateCitadelProductionOrder(packet.productionOrder))
        : invalidResult("$.production_order", "Missing production order for production-order return.")
      : packet.operatorPromptRequest
        ? prefixResult("$.operator_prompt_request", validateCitadelOperatorPromptRequest(packet.operatorPromptRequest))
        : invalidResult("$.operator_prompt_request", "Missing operator prompt request for prompt return.");

  return mergeResults(
    validateProjected(projectCitadelRookReturn(packet), "citadel.rook-return-packet.v1.schema.json"),
    prefixResult("$.scroll", validateCitadelAuditScroll(packet.scroll)),
    prefixResult("$.notarial_record", validateCitadelNotarialRecord(packet.notarialRecord)),
    prefixResult("$.return_status", validateCitadelRookReturnStatus(packet.returnStatus)),
    nested,
  );
}

export function validateCitadelDelegationScroll(packet: DelegationPacket): ValidationResult {
  return validateProjected(projectDelegation(packet), "citadel.delegation-scroll.v1.schema.json");
}

export function assertValidationResult(label: string, result: ValidationResult): void {
  if (result.valid) {
    return;
  }

  const issues = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
  throw new Error(`${label} failed Citadel schema validation.\n${issues}`);
}

export function assertValidCitadelRookIntake(packet: IsoldeIntakePacket): void {
  assertValidationResult("Rook intake", validateCitadelRookIntake(packet));
}

export function assertValidCitadelOperatorPromptRequest(packet: OperatorPromptRequest): void {
  assertValidationResult("Operator prompt request", validateCitadelOperatorPromptRequest(packet));
}

export function assertValidCitadelProductionOrder(packet: FoundryProductionPacket): void {
  assertValidationResult("Production order", validateCitadelProductionOrder(packet));
}

export function assertValidCitadelRookReturnPacket(packet: CitadelRookReturnPacket): void {
  assertValidationResult("Citadel rook return packet", validateCitadelRookReturnPacket(packet));
}

export function assertValidCitadelDelegationScroll(packet: DelegationPacket): void {
  assertValidationResult("Delegation scroll", validateCitadelDelegationScroll(packet));
}

function prefixResult(prefix: string, result: ValidationResult): ValidationResult {
  return {
    valid: result.valid,
    issues: prefixIssues(prefix, result.issues),
  };
}

function invalidResult(path: string, message: string): ValidationResult {
  return {
    valid: false,
    issues: [{ path, message }],
  };
}
