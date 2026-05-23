import type { FlowTemplate } from "./types.js";

const flowTemplates: FlowTemplate[] = [
  {
    id: "rapid-prototype",
    name: "Rapid Prototype Flow",
    recommendedFor: ["exploration", "experimentation", "concept validation", "low-consequence implementation"],
    minimumConsequenceTier: "trivial",
    professionIds: ["systems-architect", "runtime-operator", "verification-specialist"],
    optionalProfessionIds: ["critique-authority", "executive-secretary"],
    nodes: [
      { id: "intake", label: "Executive Intake", kind: "intake", required: true },
      { id: "architecture", label: "Rapid Decomposition", kind: "coordination", professionId: "systems-architect", required: true },
      { id: "execution", label: "Focused Execution", kind: "execution", professionId: "runtime-operator", required: true },
      { id: "verification", label: "Lightweight Verification", kind: "verification", professionId: "verification-specialist", required: true },
      { id: "review", label: "Iterative Review", kind: "critique", professionId: "critique-authority", required: false },
      { id: "disposition", label: "Prototype Disposition", kind: "disposition", required: true },
    ],
    edges: [
      { from: "intake", to: "architecture", kind: "sequence" },
      { from: "architecture", to: "execution", kind: "sequence" },
      { from: "execution", to: "verification", kind: "sequence" },
      { from: "verification", to: "review", kind: "review" },
      { from: "verification", to: "disposition", kind: "sequence" },
      { from: "review", to: "disposition", kind: "review" },
    ],
  },
  {
    id: "verification-heavy",
    name: "Verification Heavy Flow",
    recommendedFor: ["financial correctness", "security exposure", "architectural significance", "high trust sensitivity"],
    minimumConsequenceTier: "important",
    professionIds: [
      "systems-architect",
      "runtime-operator",
      "verification-specialist",
      "critique-authority",
      "auditor",
    ],
    optionalProfessionIds: ["executive-secretary"],
    nodes: [
      { id: "intake", label: "Executive Intake", kind: "intake", required: true },
      { id: "architecture", label: "Architecture Review", kind: "coordination", professionId: "systems-architect", required: true },
      { id: "execution", label: "Controlled Execution", kind: "execution", professionId: "runtime-operator", required: true },
      { id: "verification", label: "Independent Verification", kind: "verification", professionId: "verification-specialist", required: true },
      { id: "critique", label: "Critique Pressure Test", kind: "critique", professionId: "critique-authority", required: true },
      { id: "audit", label: "Audit Review", kind: "audit", professionId: "auditor", required: true },
      { id: "disposition", label: "Final Disposition", kind: "disposition", required: true },
    ],
    edges: [
      { from: "intake", to: "architecture", kind: "sequence" },
      { from: "architecture", to: "execution", kind: "sequence" },
      { from: "execution", to: "verification", kind: "sequence" },
      { from: "verification", to: "critique", kind: "review" },
      { from: "critique", to: "audit", kind: "review" },
      { from: "audit", to: "disposition", kind: "sequence" },
      { from: "verification", to: "disposition", kind: "escalation" },
      { from: "critique", to: "disposition", kind: "escalation" },
    ],
  },
  {
    id: "saas-build",
    name: "SaaS Build Flow",
    recommendedFor: ["platform build", "workflow software", "operational systems", "compliance software"],
    minimumConsequenceTier: "routine",
    professionIds: ["systems-architect", "runtime-operator", "verification-specialist"],
    optionalProfessionIds: ["research-analyst", "auditor", "critique-authority", "executive-secretary"],
    nodes: [
      { id: "intake", label: "Executive Intake", kind: "intake", required: true },
      { id: "architecture", label: "Systems Architecture", kind: "coordination", professionId: "systems-architect", required: true },
      { id: "execution", label: "Implementation", kind: "execution", professionId: "runtime-operator", required: true },
      { id: "verification", label: "Functional Verification", kind: "verification", professionId: "verification-specialist", required: true },
      { id: "critique", label: "Architecture Review", kind: "critique", professionId: "critique-authority", required: false },
      { id: "audit", label: "Operational Audit", kind: "audit", professionId: "auditor", required: false },
      { id: "disposition", label: "Operational Disposition", kind: "disposition", required: true },
    ],
    edges: [
      { from: "intake", to: "architecture", kind: "sequence" },
      { from: "architecture", to: "execution", kind: "sequence" },
      { from: "execution", to: "verification", kind: "sequence" },
      { from: "verification", to: "critique", kind: "review" },
      { from: "critique", to: "audit", kind: "review" },
      { from: "verification", to: "disposition", kind: "sequence" },
      { from: "audit", to: "disposition", kind: "review" },
    ],
  },
];

const templateMap = new Map(flowTemplates.map((template) => [template.id, template]));

export function listFlowTemplates(): FlowTemplate[] {
  return [...flowTemplates];
}

export function getFlowTemplate(templateId: FlowTemplate["id"]): FlowTemplate {
  const template = templateMap.get(templateId);

  if (!template) {
    throw new Error(`Unknown flow template ${templateId}.`);
  }

  return template;
}
