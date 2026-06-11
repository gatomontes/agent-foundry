import { assertNonEmpty, toTimestamp } from "../shared/types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
import { CitadelScribe, recordScrollEntry } from "./scribe.js";
import type {
  CitadelProposalItem,
  CitadelRookReturnPacket,
  DeploymentDirective,
  FoundryProductionPacket,
  HandoffDirective,
  NotarialRecord,
  RookReturnStatus,
  StaffingDirective,
  StaffingTarget,
} from "./types.js";
import { exampleProductionOrder, exampleOperatorPromptRequest } from "../examples/fixtures.js";

function classifyTemplate(packet: IsoldeIntakePacket): FoundryProductionPacket["templateId"] {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();

  if (corpus.includes("critical") || corpus.includes("security") || corpus.includes("payroll calculation")) {
    return "verification-heavy";
  }

  if (
    corpus.includes("song") ||
    corpus.includes("title ideation") ||
    corpus.includes("title ") ||
    corpus.includes(" title") ||
    corpus.includes("lyric") ||
    corpus.includes("copy") ||
    corpus.includes("creative") ||
    corpus.includes("naming") ||
    corpus.includes("tagline") ||
    corpus.includes("brand language")
  ) {
    return "creative-development";
  }

  if (corpus.includes("prototype") || corpus.includes("exploratory")) {
    return "rapid-prototype";
  }

  return "saas-build";
}

function classifyTier(packet: IsoldeIntakePacket): FoundryProductionPacket["consequenceTier"] {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();

  if (corpus.includes("critical") || corpus.includes("security")) {
    return "critical";
  }

  if (corpus.includes("payroll") || corpus.includes("employee")) {
    return "important";
  }

  if (corpus.includes("prototype") || corpus.includes("exploratory")) {
    return "trivial";
  }

  if (
    corpus.includes("song") ||
    corpus.includes("title ideation") ||
    corpus.includes("title ") ||
    corpus.includes(" title") ||
    corpus.includes("lyric") ||
    corpus.includes("copy") ||
    corpus.includes("creative") ||
    corpus.includes("naming") ||
    corpus.includes("tagline") ||
    corpus.includes("brand language")
  ) {
    return "trivial";
  }

  return "routine";
}

function requiresClarification(packet: IsoldeIntakePacket): boolean {
  return clarificationQuestions(packet).length > 0;
}

function clarificationQuestions(packet: IsoldeIntakePacket): string[] {
  const loweredObjective = packet.objective.toLowerCase();
  const loweredNotes = packet.notes.map((note) => note.toLowerCase());
  const hasCapabilityAnswer = loweredNotes.some((note) => note.startsWith("first concrete capability:"));
  const hasFlowAnswer = loweredNotes.some((note) => note.startsWith("preferred flow:"));
  const clarificationSatisfied = hasCapabilityAnswer && hasFlowAnswer;
  const hasDeploymentAnswer = loweredNotes.some((note) => note.startsWith("deployment target:"));
  const questions: string[] = [];

  if ((loweredObjective.includes("have not decided") || loweredObjective.includes("not decided")) && !clarificationSatisfied) {
    questions.push("What is the first concrete SaaS capability that should be implemented?");
    questions.push("Should the first runtime pass optimize for rapid prototype, creative development, or verification-heavy flow?");
  }

  if (!hasDeploymentAnswer) {
    questions.push(
      "Which deployment target should Foundry produce for the forged workers: worker-spec-only, persona-only-artifacts, codex-skill, or local-agent-manifest?",
    );
  }

  return questions;
}

function requiresFailureCase(packet: IsoldeIntakePacket): boolean {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();
  return corpus.includes("failure test") || corpus.includes("simulate verification failure");
}

function extractTaggedNote(packet: IsoldeIntakePacket, prefix: string): string | null {
  const loweredPrefix = prefix.toLowerCase();
  const match = packet.notes.find((note) => note.toLowerCase().startsWith(loweredPrefix));

  if (!match) {
    return null;
  }

  const value = match.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

function cleanRequestText(value: string): string {
  return value
    .trim()
    .replace(/^(please|help me|i need to|i want to)\s+/i, "")
    .replace(/^(build|create|implement|design|make|start|launch)\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/[.]+$/g, "")
    .trim();
}

function toSentence(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return trimmed;
  }

  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

function stripTrailingPunctuation(value: string): string {
  return value.trim().replace(/[.!?]+$/g, "");
}

function buildRequestedTarget(packet: IsoldeIntakePacket): string {
  const explicitCapability = extractTaggedNote(packet, "first concrete capability:");

  if (explicitCapability) {
    return cleanRequestText(explicitCapability);
  }

  return cleanRequestText(packet.objective);
}

function buildConstraintNotes(packet: IsoldeIntakePacket): string[] {
  return packet.notes
    .filter((note) => {
      const lowered = note.toLowerCase();
      return !lowered.startsWith("first concrete capability:") && !lowered.startsWith("preferred flow:");
    })
    .map(stripTrailingPunctuation);
}

function formatTemplateLabel(templateId: FoundryProductionPacket["templateId"]): string {
  switch (templateId) {
    case "rapid-prototype":
      return "rapid prototype flow";
    case "verification-heavy":
      return "verification-heavy flow";
    case "creative-development":
      return "creative development flow";
    default:
      return "SaaS build flow";
  }
}

function buildProductionProfile(
  templateId: FoundryProductionPacket["templateId"],
): FoundryProductionPacket["productionProfile"] {
  if (templateId === "rapid-prototype") {
    return {
      mode: "prototype",
      evidenceLevel: "governance-shaped",
      retentionPolicy: "append-only-runs",
      manifestStrategy: "hash-only",
    };
  }

  return {
    mode: "production",
    evidenceLevel: "governance-shaped",
    retentionPolicy: "append-only-runs",
    manifestStrategy: "hmac-sha256",
  };
}

function inferDeploymentDirective(packet: IsoldeIntakePacket): DeploymentDirective | null {
  const explicit = extractTaggedNote(packet, "deployment target:");

  if (!explicit) {
    return null;
  }

  const normalized = explicit.toLowerCase().trim();

  if (
    normalized !== "worker-spec-only" &&
    normalized !== "persona-only-artifacts" &&
    normalized !== "codex-skill" &&
    normalized !== "local-agent-manifest"
  ) {
    return null;
  }

  return {
    target: normalized,
    rationale: `Operator explicitly selected deployment target ${normalized}.`,
  };
}

function inferHandoffDirective(packet: IsoldeIntakePacket): HandoffDirective {
  const explicitRecipient = extractTaggedNote(packet, "handoff recipient:");
  const normalizedRecipient = explicitRecipient?.toLowerCase().trim();
  const recipientType: HandoffDirective["recipientType"] =
    normalizedRecipient === "agent" || normalizedRecipient === "skill" || normalizedRecipient === "operator"
      ? normalizedRecipient
      : "operator";

  if (recipientType === "operator") {
    return {
      recipientType,
      mode: "operator-delivery",
      packageScope: "run-package",
      operatorDestinationPolicy: "choose-at-return",
      rationale:
        "A human operator is the default recipient in the Isolde entry flow, so Foundry may offer package placement without crossing into installation or activation.",
    };
  }

  return {
    recipientType,
    mode: "package-reference",
    packageScope: "run-package",
    operatorDestinationPolicy: "not-applicable",
    rationale:
      "When the recipient is another agent or skill, Foundry should stop at returning package references and avoid any extra delivery ceremony.",
  };
}

function slugTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "staffing-target";
}

function buildStaffingTarget(
  title: string,
  mode: StaffingTarget["mode"],
  purpose: string,
  rationale: string,
  required = true,
): StaffingTarget {
  return {
    id: slugTitle(title),
    title,
    mode,
    purpose,
    rationale,
    required,
  };
}

function uniqueTargets(targets: StaffingTarget[]): StaffingTarget[] {
  const seen = new Set<string>();
  const result: StaffingTarget[] = [];

  for (const target of targets) {
    if (seen.has(target.id)) {
      continue;
    }

    seen.add(target.id);
    result.push(target);
  }

  return result;
}

function inferStaffingDirective(
  packet: IsoldeIntakePacket,
  templateId: FoundryProductionPacket["templateId"],
): StaffingDirective {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();
  const targets: StaffingTarget[] = [];
  const mentionsPersona =
    corpus.includes("persona") || corpus.includes("agent") || corpus.includes("worker") || corpus.includes("team");
  const defaultMode: StaffingTarget["mode"] = mentionsPersona ? "persona" : "profession";

  if (corpus.includes("puerto rico") || corpus.includes("ivu") || corpus.includes("sales tax")) {
    targets.push(
      buildStaffingTarget(
        "Puerto Rico Sales Tax Compliance Specialist",
        defaultMode,
        "Own IVU applicability, exemption handling, bona fide agricultural cases, and transaction-time tax snapshot rules.",
        "The request references Puerto Rico or sales-tax behavior, which requires a domain owner rather than a generic runtime operator.",
      ),
    );
  }

  if (corpus.includes("pos") || corpus.includes("checkout") || corpus.includes("cashier")) {
    targets.push(
      buildStaffingTarget(
        "POS Systems Architect",
        defaultMode,
        "Define lane behavior, cashier workflow, and transaction-boundary rules for point-of-sale execution.",
        "The request touches live transaction behavior, so a POS-native architecture owner is needed.",
      ),
    );
  }

  if (corpus.includes("payroll")) {
    targets.push(
      buildStaffingTarget(
        "Payroll Compliance Specialist",
        defaultMode,
        "Own statutory payroll correctness, release gating, and high-risk workflow interpretation.",
        "Payroll work needs a primary compliance owner instead of being routed as generic SaaS implementation.",
      ),
    );
  }

  if (corpus.includes("tax") && corpus.includes("payroll")) {
    targets.push(
      buildStaffingTarget(
        "Payroll Tax Operations Specialist",
        defaultMode,
        "Define accrued, due, deposited, and remitted payroll-tax behavior and filing-state semantics.",
        "The request mentions payroll tax operations, which is a narrower domain than general payroll compliance.",
      ),
    );
  }

  if (corpus.includes("song") || corpus.includes("chorus")) {
    targets.push(
      buildStaffingTarget(
        "Chorus Architect",
        defaultMode,
        "Forge chorus-first structures and hook architecture for song development.",
        "The request is song-oriented and needs a specialist who owns chorus construction rather than generic creative execution.",
      ),
    );
  }

  if (corpus.includes("lyric") || corpus.includes("death metal") || corpus.includes("gothic")) {
    targets.push(
      buildStaffingTarget(
        "Gothic/Death Metal Lyric Strategist",
        defaultMode,
        "Pressure-test genre fit, tonal integrity, and lane-native lyric choices.",
        "The request includes lyric or genre-sensitive language, which requires a domain-specific creative reviewer.",
      ),
    );
  }

  if (corpus.includes("title")) {
    targets.push(
      buildStaffingTarget(
        "Song Title Ideator",
        defaultMode,
        "Generate and compare title lanes that reinforce theme, tone, and memorability.",
        "The request explicitly involves title ideation and should have a title-owning specialist.",
      ),
    );
  }

  if (corpus.includes("security") || corpus.includes("pentest") || corpus.includes("exploit")) {
    targets.push(
      buildStaffingTarget(
        "Chief Security Architect",
        defaultMode,
        "Own trust boundaries, release gates, and security decision quality for the mission.",
        "Security-sensitive work should be owned by a dedicated security authority rather than the default implementation crew.",
      ),
    );
  }

  if (corpus.includes("research") || corpus.includes("investigate") || corpus.includes("verify")) {
    targets.push(
      buildStaffingTarget(
        "Research Analyst",
        defaultMode,
        "Gather and synthesize evidence relevant to the mission's decision-making surface.",
        "The request contains research or verification language that benefits from explicit evidence ownership.",
        templateId === "verification-heavy",
      ),
    );
  }

  if (targets.length === 0) {
    targets.push(
      buildStaffingTarget(
        "Domain Lead Persona",
        "persona",
        "Act as the primary domain owner for the requested work and shape the downstream specialist roster.",
        "The request did not match a narrower known domain, so Foundry should first forge an explicit domain-owning lead instead of pretending the default runtime crew is the answer.",
      ),
      buildStaffingTarget(
        "Implementation Specialist",
        "persona",
        "Translate the domain lead's requirements into concrete system or delivery work.",
        "Most requests eventually need an implementation counterpart once the primary domain owner is identified.",
        false,
      ),
    );
  }

  return {
    intent:
      "Infer the professions/personas the requester actually needs for this mission, then forge those workers as the production target. Foundry's own runtime crew is supporting infrastructure, not the answer.",
    targets: uniqueTargets(targets),
  };
}

function describeTemplateBuild(templateId: FoundryProductionPacket["templateId"], target: string): string {
  switch (templateId) {
    case "rapid-prototype":
      return `Shape ${target} as a fast prototype slice with minimal ceremony and quick feedback loops.`;
    case "verification-heavy":
      return `Shape ${target} as a controlled implementation slice with explicit verification and review pressure before any trusted disposition.`;
    case "creative-development":
      return `Shape ${target} as a governed creative-development slice spanning framing, generation, fit verification, and shortlist-ready review.`;
    default:
      return `Shape ${target} as a governed SaaS delivery slice spanning architecture, implementation, and functional verification.`;
  }
}

function buildNormalProposalItems(
  packet: IsoldeIntakePacket,
  templateId: FoundryProductionPacket["templateId"],
): CitadelProposalItem[] {
  const target = buildRequestedTarget(packet);
  const constraints = buildConstraintNotes(packet);
  const preferredFlow = extractTaggedNote(packet, "preferred flow:");
  const staffingDirective = inferStaffingDirective(packet, templateId);
  const deploymentDirective = inferDeploymentDirective(packet);
  const staffingSummary = staffingDirective.targets
    .map((staffingTarget) => `${staffingTarget.title} [${staffingTarget.mode}]`)
    .join(" | ");
  const constraintSummary =
    constraints.length > 0
      ? `Preserve these operator notes: ${constraints.join(" | ")}.`
      : "No extra operator constraints were supplied beyond the objective.";
  const flowSummary = preferredFlow
    ? `Preferred flow noted by the operator: ${preferredFlow}.`
    : `Selected governed flow: ${formatTemplateLabel(templateId)}.`;

  return [
    {
      action: `Infer the right professions/personas for ${target}`,
      purpose: "Turn the operator request into the worker roster the requester actually needs, not Foundry's default internal crew.",
      details: `${constraintSummary} Initial staffing inference: ${staffingSummary}.`,
      expectedOutcome: `The team can inspect the proposed professions/personas that should be forged for ${target}.`,
    },
    {
      action: `Forge ${target} as a staffing-driven delivery slice`,
      purpose: "Use the inferred worker roster as the production target instead of collapsing the request into generic implementation roles.",
      details: `${describeTemplateBuild(templateId, target)} Foundry's own execution spine remains support infrastructure around the forged workers.`,
      expectedOutcome: `The first delivery slice reflects the mission's real domain workers rather than a static default crew.`,
    },
    {
      action: `Prepare adapter-ready deployment output for ${target}`,
      purpose: "Keep the forged worker set separate from any downstream deployment or activation behavior.",
      details: deploymentDirective
        ? `Operator-selected deployment target: ${deploymentDirective.target}. Foundry should emit that package form and stop at the handoff boundary.`
        : "Deployment target remains unresolved, so Foundry should preserve validated worker specs and route adapter selection back to the operator.",
      expectedOutcome: deploymentDirective
        ? `The forged workers can be emitted as a governed ${deploymentDirective.target} package.`
        : "The operator can choose whether the forged workers should remain worker specs or be materialized through a specific package adapter.",
    },
    {
      action: `Thread ${target} through the ${formatTemplateLabel(templateId)}`,
      purpose: "Show how the requested work will move through architecture, execution, and verification in this run.",
      details: `${flowSummary} Keep the packet objective, topology, and governance notes aligned around ${target}.`,
      expectedOutcome: `Isolde can present a build-specific plan instead of repeating the same explanation across unrelated requests.`,
    },
    {
      action: `Materialize inspectable change intent for ${target}`,
      purpose: "Make the planned work legible to the operator before any implementation proceeds.",
      details:
        "Preserve the proposal, critique report, audit report, failure path, hash manifest, and scribe report as the visible explanation bundle for this request.",
      expectedOutcome:
        "The operator can see the intended changes/builds and the evidence surfaces that will track them during execution.",
    },
  ];
}

function buildNotarialRecord(
  packet: IsoldeIntakePacket,
  returnKind: CitadelRookReturnPacket["returnKind"],
  dispositionContext: string,
  requiredActions: string[],
  recommendedActions: string[],
  blockedActions: string[],
  humanDecisionsRequired: string[],
): NotarialRecord {
  const preparedAt = toTimestamp();

  return {
    preparedBy: "citadel-notary",
    preparedAt,
    stationFindings: [
      {
        station: "citadel-core",
        findingSummary:
          returnKind === "production-order"
            ? `Citadel classified request ${packet.requestId} as production-ready pending Foundry-side operator confirmation.`
            : `Citadel determined request ${packet.requestId} still requires operator clarification before production can begin.`,
        evidenceRefs: [`mission:${packet.requestId}`, `objective:${packet.objective}`],
        proposedActions: recommendedActions,
        blockedActions,
        unresolvedQuestions: humanDecisionsRequired,
      },
      {
        station: "citadel-rook",
        findingSummary: "Citadel prepared the governed return scroll with boundary-safe summary preservation.",
        evidenceRefs: [`scroll:${packet.scroll.scrollId}`],
        proposedActions: requiredActions,
        blockedActions: [],
        unresolvedQuestions: [],
      },
    ],
    preReturnSummary: {
      dispositionContext,
      requiredActions,
      recommendedActions,
      blockedActions,
      humanDecisionsRequired,
      followUpRoutes: returnKind === "production-order" ? ["foundry-rook", "isolde"] : ["isolde"],
      archivalCopyCreated: true,
      archivalReference: `archive://citadel/notary/${packet.requestId}`,
    },
  };
}

function buildReturnStatus(): RookReturnStatus {
  return {
    normalizedByRook: true,
    notarialSummaryPresent: true,
    archivalCopyConfirmed: true,
    readyForExternalReturn: true,
  };
}

export class CitadelAdapter {
  readonly receivedIntake: IsoldeIntakePacket[];
  readonly emittedReturns: CitadelRookReturnPacket[];
  readonly scribe: CitadelScribe;

  constructor() {
    this.receivedIntake = [];
    this.emittedReturns = [];
    this.scribe = new CitadelScribe();
  }

  receiveFoundryBoundaryIntake(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    assertNonEmpty(packet.packetId, "isoldeIntake.packetId");
    assertNonEmpty(packet.objective, "isoldeIntake.objective");

    this.receivedIntake.push(packet);
    recordScrollEntry(packet.scroll, "citadel-rook", "scroll-received", "Citadel Rook received the intake scroll from Foundry.");
    this.scribe.record(packet.scroll, "scroll-recorded", "Citadel Scribe recorded intake arrival.");
    recordScrollEntry(packet.scroll, "citadel-core", "scroll-reviewed", "Citadel reviewed the intake and classified the next governed action.");

    const returnPacket = requiresClarification(packet)
      ? this.buildPromptReturn(packet)
      : this.buildProductionReturn(packet);

    this.scribe.record(packet.scroll, "scroll-recorded", "Citadel Scribe recorded the governed return.");
    recordScrollEntry(packet.scroll, "citadel-rook", "scroll-returned", "Citadel Rook emitted the governed return scroll toward Foundry.");
    this.emittedReturns.push(returnPacket);
    return returnPacket;
  }

  private buildProductionReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const productionOrder = exampleProductionOrder();
    const templateId = classifyTemplate(packet);
    const consequenceTier = classifyTier(packet);
    const staffingDirective = inferStaffingDirective(packet, templateId);
    const deploymentDirective = inferDeploymentDirective(packet) ?? {
      target: "worker-spec-only",
      rationale:
        "No deployment adapter was selected by the operator, so validated worker specs remain the only safe production output.",
    };
    const handoffDirective = inferHandoffDirective(packet);
    const executionMode = requiresFailureCase(packet) ? "verification-failure" : "normal";
    const proposalTitle =
      executionMode === "verification-failure"
        ? "Controlled verification-failure validation package"
        : `Governed plan for ${buildRequestedTarget(packet)} using the ${formatTemplateLabel(templateId)}`;
    const proposalItems =
      executionMode === "verification-failure"
        ? [
            {
              action: "Run the requested work through a controlled verification-failure path",
              purpose: "Prove that the governance chain behaves correctly when verification does not pass.",
              details:
                "Inject a deliberate verification failure, preserve the critique and audit trail, and route the packet through restoration-aware handling.",
              expectedOutcome:
                "The team gets evidence that failure, blockage, and restoration semantics are working before any trusted release claim is made.",
            },
            {
              action: "Tighten release blocking around failed verification",
              purpose: "Prevent failed outputs from drifting into operator-facing trust or downstream release paths.",
              details:
                "Keep release-facing disposition frozen whenever the controlled failure path is active and preserve the blocked packet for Citadel review.",
              expectedOutcome:
                "Failure artifacts remain visible, and the runtime demonstrates disciplined refusal rather than silent continuation.",
            },
            {
              action: "Strengthen evidence preservation across the failure cycle",
              purpose: "Make the failure test useful for future governance, critique, and audit review.",
              details:
                "Require the failure path, hash manifest, critique report, audit report, and scribe report to remain attached as a coherent evidence set.",
              expectedOutcome:
                "Citadel receives a reusable proof bundle showing what failed, why it failed, and how custody was preserved.",
            },
          ]
        : buildNormalProposalItems(packet, templateId);
    const requestedTarget = buildRequestedTarget(packet);
    const notarialRecord = buildNotarialRecord(
      packet,
      "production-order",
      `Disposition remains governed but untrusted for release until Foundry confirms initiation and downstream verification completes for ${requestedTarget}.`,
      [
        "Preserve the notarial summary with the production order.",
        "Obtain explicit operator confirmation before production initiation.",
      ],
      proposalItems.map((item) => item.action),
      executionMode === "verification-failure"
        ? ["Treat trusted release as blocked while the controlled failure path remains active."]
        : ["Treat trusted release as blocked until verification, critique, and audit conclude."],
      executionMode === "verification-failure"
        ? ["Confirm whether the operator wants the controlled failure run initiated now."]
        : ["Confirm whether the operator wants the governed build plan initiated now."],
    );
    const returnStatus = buildReturnStatus();

    const governedOrder: FoundryProductionPacket = {
      ...productionOrder,
      packetId: `fp-${packet.requestId}`,
      missionId: productionOrder.missionId,
      citadelRookReference: `cr-${packet.requestId}`,
      objective: packet.objective,
      summary:
        executionMode === "verification-failure"
          ? `Citadel approved a controlled failure-case production run for request ${packet.requestId}.`
          : `Citadel approved production initiation for request ${packet.requestId}.`,
      proposal: {
        title: proposalTitle,
        summary:
          executionMode === "verification-failure"
            ? "Citadel proposes a controlled failure-oriented run focused on validating blockage, evidence preservation, and restoration behavior."
            : `Citadel proposes a request-specific governed build plan for ${requestedTarget}.`,
        items: proposalItems,
      },
      consequenceTier,
      templateId,
      staffingDirective,
      deploymentDirective,
      handoffDirective,
      executionMode,
      notarialRecord,
      returnStatus,
      governanceNotes: [
        "Verification remains mandatory before any trusted disposition.",
        "Foundry must preserve artifact lineage for implementation outputs.",
        ...packet.notes,
      ],
      productionProfile: buildProductionProfile(templateId),
      scroll: packet.scroll,
      createdAt: toTimestamp(),
      ...(executionMode === "verification-failure"
        ? {
            failureReason:
              "Controlled failure case requested to validate verification, critique, audit, and restoration behavior.",
          }
        : {}),
      ...(productionOrder.topology
        ? {
            topology: {
              ...productionOrder.topology,
              objective: packet.objective,
              consequenceTier,
              templateId,
            },
          }
        : {}),
    };

    return {
      packetId: `cr-return-${packet.requestId}`,
      missionId: governedOrder.missionId,
      source: "citadel-rook",
      returnKind: "production-order",
      scroll: packet.scroll,
      notarialRecord,
      productionOrder: governedOrder,
      returnStatus,
      createdAt: toTimestamp(),
    };
  }

  private buildPromptReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const promptRequest = exampleOperatorPromptRequest();
    const questions = clarificationQuestions(packet);
    const hasDeploymentQuestion = questions.some((question) => question.toLowerCase().includes("deployment target"));
    const notarialRecord = buildNotarialRecord(
      packet,
      "operator-prompt-request",
      hasDeploymentQuestion
        ? "Production remains blocked pending operator clarification on deployment target selection for the forged workers."
        : "Production remains blocked pending operator clarification on the first concrete capability and preferred governed flow.",
      [
        "Surface the clarification questions through Isolde.",
        "Preserve the returned answers on the next intake scroll.",
      ],
      hasDeploymentQuestion
        ? ["Capture the deployment target.", "Preserve the forged worker inference for the next return."]
        : ["Capture the first concrete capability.", "Capture the preferred governed flow."],
      ["Do not initiate production while clarification remains unresolved."],
      questions,
    );
    const returnStatus = buildReturnStatus();

    return {
      packetId: `cr-return-${packet.requestId}`,
      missionId: promptRequest.missionId,
      source: "citadel-rook",
      returnKind: "operator-prompt-request",
      scroll: packet.scroll,
      notarialRecord,
      operatorPromptRequest: {
        ...promptRequest,
        packetId: `opr-${packet.requestId}`,
        reason: `Citadel requires clarification before production can begin for request ${packet.requestId}.`,
        questions,
        blockingIssues: hasDeploymentQuestion
          ? [
              "Forged worker targets are available, but the deployment adapter is unresolved.",
              "Foundry should not silently choose between worker-spec-only, persona-only-artifacts, codex-skill, or local-agent-manifest.",
            ]
          : promptRequest.blockingIssues,
        scroll: packet.scroll,
        notarialRecord,
        returnStatus,
        createdAt: toTimestamp(),
      },
      returnStatus,
      createdAt: toTimestamp(),
    };
  }
}
