import { toTimestamp } from "../shared/types.js";
import type { OperatorIntent } from "../boundary/isolde.js";
import { createAuditScroll, recordScrollEntry } from "../boundary/scribe.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  NotarialRecord,
  OperatorPromptRequest,
  RookReturnStatus,
} from "../boundary/types.js";
import type { MissionTopology } from "../topology/types.js";

function exampleNotarialRecord(
  missionId: string,
  dispositionContext: string,
  recommendedActions: string[],
  blockedActions: string[],
  humanDecisionsRequired: string[],
): NotarialRecord {
  return {
    preparedBy: "citadel-notary",
    preparedAt: toTimestamp(),
    stationFindings: [
      {
        station: "citadel-core",
        findingSummary: `Citadel recorded governed findings for ${missionId}.`,
        evidenceRefs: [`mission:${missionId}`],
        proposedActions: recommendedActions,
        blockedActions,
        unresolvedQuestions: humanDecisionsRequired,
      },
    ],
    preReturnSummary: {
      dispositionContext,
      requiredActions: ["Preserve the summary with the return scroll."],
      recommendedActions,
      blockedActions,
      humanDecisionsRequired,
      followUpRoutes: ["foundry-rook", "isolde"],
      archivalCopyCreated: true,
      archivalReference: `archive://citadel/notary/${missionId}`,
    },
  };
}

function exampleReturnStatus(): RookReturnStatus {
  return {
    normalizedByRook: true,
    notarialSummaryPresent: true,
    archivalCopyConfirmed: true,
    readyForExternalReturn: true,
  };
}

export function exampleSaasBuildTopology(): MissionTopology {
  return {
    missionId: "mission-saas-001",
    objective: "Build the initial governed SaaS runtime shell.",
    consequenceTier: "routine",
    templateId: "saas-build",
    requiredProfessionIds: [
      "systems-architect",
      "runtime-operator",
      "verification-specialist",
    ],
    optionalProfessionIds: ["critique-authority", "executive-secretary"],
    nodes: [
      { id: "intake", label: "Executive Intake", kind: "intake", required: true },
      {
        id: "architecture",
        label: "Systems Architecture",
        kind: "coordination",
        professionId: "systems-architect",
        required: true,
      },
      {
        id: "execution",
        label: "Implementation",
        kind: "execution",
        professionId: "runtime-operator",
        required: true,
      },
      {
        id: "verification",
        label: "Functional Verification",
        kind: "verification",
        professionId: "verification-specialist",
        required: true,
      },
      { id: "disposition", label: "Operational Disposition", kind: "disposition", required: true },
    ],
    edges: [
      { from: "intake", to: "architecture", kind: "sequence" },
      { from: "architecture", to: "execution", kind: "sequence" },
      { from: "execution", to: "verification", kind: "sequence" },
      { from: "verification", to: "disposition", kind: "sequence" },
    ],
  };
}

export function exampleOperatorIntent(): OperatorIntent {
  return {
    requestId: "req-001",
    operatorId: "operator-001",
    objective: "Build the initial governed SaaS runtime shell.",
    notes: ["Start with the smallest coherent implementation slice."],
  };
}

export function exampleFailureIntent(): OperatorIntent {
  return {
    requestId: "req-failure-001",
    operatorId: "operator-001",
    objective: "Run a failure test for a payroll SaaS homepage output pipeline.",
    notes: ["Simulate verification failure and preserve restoration evidence."],
  };
}

export function exampleClarificationIntent(): OperatorIntent {
  return {
    requestId: "req-clarify-001",
    operatorId: "operator-001",
    objective: "Help me start a SaaS system, but I have not decided the first capability yet.",
    notes: ["Scope is still exploratory."],
  };
}

export function exampleProductionOrder(): FoundryProductionPacket {
  const scroll = createAuditScroll("fp-001", "mission-saas-001");
  recordScrollEntry(scroll, "citadel-notary", "scroll-notarized", "Example notarial summary prepared before Foundry return.");
  recordScrollEntry(scroll, "citadel-rook", "scroll-returned", "Example production scroll prepared by Citadel Rook.");
  const notarialRecord = exampleNotarialRecord(
    "mission-saas-001",
    "Production is ready for Foundry handling but remains untrusted for release until downstream verification and operator approval complete.",
    [
      "Build the smallest governed runtime shell first.",
      "Tighten verification before any trusted release claim.",
      "Strengthen output lineage and reviewability.",
    ],
    ["Treat trusted release as blocked until verification concludes."],
    ["Confirm whether the operator wants production initiated now."],
  );
  const returnStatus = exampleReturnStatus();

  return {
    packetId: "fp-001",
    missionId: "mission-saas-001",
    citadelRookReference: "cr-001",
    objective: "Build the initial governed SaaS runtime shell.",
    summary: "Citadel approved production initiation for the initial Foundry runtime shell.",
    proposal: {
      title: "Governed SaaS runtime shell improvement package",
      summary: "Citadel proposes a concrete set of improvements to establish the first governed runtime slice without losing verification discipline.",
      items: [
        {
          action: "Build the smallest governed runtime shell first",
          purpose: "Create a practical first delivery slice instead of starting with a broad, vague system build.",
          details:
            "Anchor the first pass on a coherent runtime shell that preserves intake, architecture, implementation, verification, and disposition boundaries.",
          expectedOutcome:
            "The mission starts with a concrete deliverable that is small enough to execute and structured enough to govern.",
        },
        {
          action: "Tighten verification before any trusted release claim",
          purpose: "Prevent early implementation progress from being mistaken for validated delivery.",
          details:
            "Keep verification, critique, and audit distinct so the runtime cannot collapse trust decisions into a single optimistic pass.",
          expectedOutcome:
            "Operators can approve progress while still seeing clearly that trust remains gated by verification.",
        },
        {
          action: "Strengthen output lineage and reviewability",
          purpose: "Make future expansion, challenge, and restoration easier as the system grows.",
          details:
            "Preserve critique, audit, failure-path, manifest, and scribe artifacts as explicit companion outputs for the run.",
          expectedOutcome:
            "The resulting output package stays inspectable and defensible as downstream work builds on it.",
        },
      ],
    },
    consequenceTier: "routine",
    templateId: "saas-build",
    requiredProfessionIds: [
      "systems-architect",
      "runtime-operator",
      "verification-specialist",
    ],
    optionalProfessionIds: ["critique-authority", "executive-secretary"],
    governanceNotes: [
      "Verification remains mandatory before any trusted disposition.",
      "Foundry must preserve artifact lineage for implementation outputs.",
    ],
    productionProfile: {
      mode: "production",
      evidenceLevel: "governance-shaped",
      retentionPolicy: "append-only-runs",
      manifestStrategy: "hmac-sha256",
    },
    artifacts: [
      { id: "artifact-arch-001", kind: "architecture-brief" },
      { id: "artifact-plan-001", kind: "implementation-plan" },
    ],
    scroll,
    notarialRecord,
    returnStatus,
    topology: exampleSaasBuildTopology(),
    createdAt: toTimestamp(),
  };
}

export function exampleOperatorPromptRequest(): OperatorPromptRequest {
  const scroll = createAuditScroll("opr-001", "mission-saas-clarify-001");
  recordScrollEntry(scroll, "citadel-notary", "scroll-notarized", "Example clarification notarial summary prepared before Foundry return.");
  recordScrollEntry(scroll, "citadel-rook", "scroll-returned", "Example clarification scroll prepared by Citadel Rook.");
  const notarialRecord = exampleNotarialRecord(
    "mission-saas-clarify-001",
    "Production remains blocked pending operator clarification.",
    [
      "Answer the first capability question.",
      "Answer the preferred flow question.",
    ],
    ["Do not initiate production while clarification remains unresolved."],
    [
      "What is the first concrete SaaS capability that should be implemented?",
      "Should the first runtime pass optimize for rapid prototype, creative development, or verification-heavy flow?",
    ],
  );
  const returnStatus = exampleReturnStatus();

  return {
    packetId: "opr-001",
    missionId: "mission-saas-clarify-001",
    reason: "Citadel requires clarification before production can begin.",
    questions: [
      "What is the first concrete SaaS capability that should be implemented?",
      "Should the first runtime pass optimize for rapid prototype, creative development, or verification-heavy flow?",
    ],
    blockingIssues: [
      "Primary deliverable is still too broad.",
      "Consequence tier may change depending on production target.",
    ],
    returnRoute: "isolde",
    scroll,
    notarialRecord,
    returnStatus,
    createdAt: toTimestamp(),
  };
}

export function exampleProductionReturnPacket(): CitadelRookReturnPacket {
  const productionOrder = exampleProductionOrder();

  return {
    packetId: "cr-return-001",
    missionId: "mission-saas-001",
    source: "citadel-rook",
    returnKind: "production-order",
    scroll: productionOrder.scroll,
    notarialRecord: productionOrder.notarialRecord!,
    productionOrder,
    returnStatus: productionOrder.returnStatus!,
    createdAt: toTimestamp(),
  };
}

export function examplePromptReturnPacket(): CitadelRookReturnPacket {
  const operatorPromptRequest = exampleOperatorPromptRequest();

  return {
    packetId: "cr-return-002",
    missionId: "mission-saas-clarify-001",
    source: "citadel-rook",
    returnKind: "operator-prompt-request",
    scroll: operatorPromptRequest.scroll,
    notarialRecord: operatorPromptRequest.notarialRecord!,
    operatorPromptRequest,
    returnStatus: operatorPromptRequest.returnStatus!,
    createdAt: toTimestamp(),
  };
}
