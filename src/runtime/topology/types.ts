import type { ConsequenceTier } from "../shared/types.js";

export type FlowTemplateId = "rapid-prototype" | "verification-heavy" | "saas-build";
export type NodeKind = "intake" | "coordination" | "execution" | "verification" | "critique" | "audit" | "disposition";
export type EdgeKind = "sequence" | "review" | "escalation";

export interface TopologyNode {
  id: string;
  label: string;
  kind: NodeKind;
  professionId?: string;
  required: boolean;
}

export interface TopologyEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface FlowTemplate {
  id: FlowTemplateId;
  name: string;
  recommendedFor: string[];
  minimumConsequenceTier: ConsequenceTier;
  professionIds: string[];
  optionalProfessionIds: string[];
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface MissionAssemblyRequest {
  missionId: string;
  objective: string;
  consequenceTier: ConsequenceTier;
  templateId: FlowTemplateId;
  includeOptional?: boolean;
  requiredProfessionIds?: string[];
  optionalProfessionIds?: string[];
}

export interface MissionTopology {
  missionId: string;
  objective: string;
  consequenceTier: ConsequenceTier;
  templateId: FlowTemplateId;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  requiredProfessionIds: string[];
  optionalProfessionIds: string[];
}
