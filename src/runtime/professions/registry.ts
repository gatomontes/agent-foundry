import { createAuthorityPolicy } from "../authority/policy.js";
import type { ProfessionManifest } from "./types.js";

const professionRegistry: ProfessionManifest[] = [
  {
    id: "research-analyst",
    name: "Research Analyst",
    purpose: "Acquire, organize, synthesize, and contextualize information.",
    responsibilities: [
      "Evidence gathering",
      "Comparative synthesis",
      "Context reconstruction",
    ],
    expectedArtifacts: ["research briefs", "findings", "evidence summaries", "comparative analyses"],
    verificationLevel: "standard",
    preferredRuntimes: ["codex-oriented", "retrieval-heavy"],
    escalationConditions: ["source contradiction", "insufficient evidence", "scope ambiguity"],
    authorityPolicy: createAuthorityPolicy({
      class: "PROPOSE_ONLY",
      permittedActions: [],
      maxConsequenceTier: "important",
      scopedTargets: ["docs/", "records/", "artifacts/"],
    }),
  },
  {
    id: "systems-architect",
    name: "Systems Architect",
    purpose: "Design operational topology, boundaries, governance relationships, and system structure.",
    responsibilities: [
      "Topology design",
      "Boundary definition",
      "Dependency analysis",
    ],
    expectedArtifacts: ["architecture briefs", "system maps", "governance structures", "operational flow definitions"],
    verificationLevel: "standard",
    preferredRuntimes: ["reasoning-heavy", "codex-oriented"],
    escalationConditions: ["architectural incoherence", "unsafe coupling", "unclear authority boundary"],
    authorityPolicy: createAuthorityPolicy({
      class: "PROPOSE_ONLY",
      permittedActions: [],
      maxConsequenceTier: "critical",
      scopedTargets: ["docs/", "src/", "architecture/"],
    }),
  },
  {
    id: "runtime-operator",
    name: "Runtime Operator",
    purpose: "Execute operational tasks using runtime and tool infrastructure.",
    responsibilities: [
      "Implementation execution",
      "Operational reporting",
      "Tool invocation",
    ],
    expectedArtifacts: ["implementations", "execution reports", "operational logs", "deployment artifacts"],
    verificationLevel: "standard",
    preferredRuntimes: ["execution-capable", "open-agent", "codex-oriented"],
    escalationConditions: ["tool failure", "authority insufficiency", "runtime instability"],
    authorityPolicy: createAuthorityPolicy({
      class: "EXECUTE_WITHIN_SCOPE",
      permittedActions: [],
      maxConsequenceTier: "important",
      scopedTargets: ["src/", "tests/", "docs/"],
    }),
  },
  {
    id: "verification-specialist",
    name: "Verification Specialist",
    purpose: "Evaluate whether outputs satisfy evidence and governance requirements.",
    responsibilities: [
      "Evidence evaluation",
      "Contradiction exposure",
      "Confidence assessment",
    ],
    expectedArtifacts: ["verification reports", "evidence chains", "confidence assessments"],
    verificationLevel: "independent",
    preferredRuntimes: ["independent-runtime", "test-capable"],
    escalationConditions: ["verification failure", "missing evidence", "non-reproducible result"],
    authorityPolicy: createAuthorityPolicy({
      class: "READ_ONLY",
      permittedActions: [],
      maxConsequenceTier: "critical",
      scopedTargets: ["src/", "tests/", "docs/", "artifacts/"],
    }),
  },
  {
    id: "auditor",
    name: "Auditor",
    purpose: "Verify verification itself and evaluate process integrity.",
    responsibilities: [
      "Audit lineage reconstruction",
      "Governance breach detection",
      "Verification discipline review",
    ],
    expectedArtifacts: ["audit findings", "process integrity reviews", "governance breach analysis"],
    verificationLevel: "independent",
    preferredRuntimes: ["independent-oversight"],
    escalationConditions: ["audit bypass", "lineage ambiguity", "review chain collapse"],
    authorityPolicy: createAuthorityPolicy({
      class: "READ_ONLY",
      permittedActions: [],
      maxConsequenceTier: "critical",
      scopedTargets: ["docs/", "records/", "artifacts/", "src/"],
    }),
  },
  {
    id: "executive-secretary",
    name: "Executive Secretary",
    purpose: "Coordinate intake, routing, continuity, staffing requests, and summaries.",
    responsibilities: [
      "Operational routing",
      "Continuity preservation",
      "Staffing coordination",
    ],
    expectedArtifacts: ["staffing packets", "operational summaries", "continuity records", "escalation summaries"],
    verificationLevel: "standard",
    preferredRuntimes: ["conversational-orchestration", "memory-capable"],
    escalationConditions: ["routing ambiguity", "continuity break", "handoff fragility"],
    authorityPolicy: createAuthorityPolicy({
      class: "DRAFT_ONLY",
      permittedActions: [],
      maxConsequenceTier: "important",
      scopedTargets: ["docs/", "operations/", "records/"],
    }),
    personaExpressions: ["Carmilla"],
  },
  {
    id: "critique-authority",
    name: "Critique Authority",
    purpose: "Pressure-test coherence, assumptions, structure, and strategic integrity.",
    responsibilities: [
      "Adversarial review",
      "Contradiction detection",
      "Structural pressure testing",
    ],
    expectedArtifacts: ["critique reports", "contradiction findings", "structural pressure analysis"],
    verificationLevel: "independent",
    preferredRuntimes: ["adversarial-reasoning"],
    escalationConditions: ["unresolved contradiction", "inflated confidence", "coherence failure"],
    authorityPolicy: createAuthorityPolicy({
      class: "READ_ONLY",
      permittedActions: [],
      maxConsequenceTier: "critical",
      scopedTargets: ["docs/", "src/", "artifacts/"],
    }),
    personaExpressions: ["Blackquill"],
  },
];

const professionMap = new Map(professionRegistry.map((profession) => [profession.id, profession]));

export function listProfessions(): ProfessionManifest[] {
  return [...professionRegistry];
}

export function getProfession(professionId: string): ProfessionManifest {
  const profession = professionMap.get(professionId);

  if (!profession) {
    throw new Error(`Unknown profession ${professionId}.`);
  }

  return profession;
}

export function requireProfessions(professionIds: string[]): ProfessionManifest[] {
  return professionIds.map(getProfession);
}
