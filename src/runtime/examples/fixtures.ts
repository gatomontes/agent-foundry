import { toTimestamp } from "../shared/types.js";
import type { OperatorIntent } from "../boundary/isolde.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  OperatorPromptRequest,
} from "../boundary/types.js";
import type { MissionTopology } from "../topology/types.js";

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

export function exampleClarificationIntent(): OperatorIntent {
  return {
    requestId: "req-clarify-001",
    operatorId: "operator-001",
    objective: "Help me start a SaaS system, but I have not decided the first capability yet.",
    notes: ["Scope is still exploratory."],
  };
}

export function exampleProductionOrder(): FoundryProductionPacket {
  return {
    packetId: "fp-001",
    missionId: "mission-saas-001",
    citadelRookReference: "cr-001",
    objective: "Build the initial governed SaaS runtime shell.",
    summary: "Citadel approved production initiation for the initial Foundry runtime shell.",
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
    artifacts: [
      { id: "artifact-arch-001", kind: "architecture-brief" },
      { id: "artifact-plan-001", kind: "implementation-plan" },
    ],
    topology: exampleSaasBuildTopology(),
    createdAt: toTimestamp(),
  };
}

export function exampleOperatorPromptRequest(): OperatorPromptRequest {
  return {
    packetId: "opr-001",
    missionId: "mission-saas-clarify-001",
    reason: "Citadel requires clarification before production can begin.",
    questions: [
      "What is the first concrete SaaS capability that should be implemented?",
      "Should the first runtime pass optimize for rapid prototype or verification-heavy flow?",
    ],
    blockingIssues: [
      "Primary deliverable is still too broad.",
      "Consequence tier may change depending on production target.",
    ],
    returnRoute: "isolde",
    createdAt: toTimestamp(),
  };
}

export function exampleProductionReturnPacket(): CitadelRookReturnPacket {
  return {
    packetId: "cr-return-001",
    missionId: "mission-saas-001",
    source: "citadel-rook",
    returnKind: "production-order",
    productionOrder: exampleProductionOrder(),
    createdAt: toTimestamp(),
  };
}

export function examplePromptReturnPacket(): CitadelRookReturnPacket {
  return {
    packetId: "cr-return-002",
    missionId: "mission-saas-clarify-001",
    source: "citadel-rook",
    returnKind: "operator-prompt-request",
    operatorPromptRequest: exampleOperatorPromptRequest(),
    createdAt: toTimestamp(),
  };
}
