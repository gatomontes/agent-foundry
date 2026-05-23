import { getProfession, requireProfessions } from "../professions/registry.js";
import type { ConsequenceTier } from "../shared/types.js";
import { getFlowTemplate } from "./templates.js";
import type { FlowTemplateId, MissionAssemblyRequest, MissionTopology, TopologyNode } from "./types.js";

const tierOrder = ["trivial", "routine", "important", "critical"] as const;

function tierRank(tier: ConsequenceTier): number {
  return tierOrder.indexOf(tier);
}

function includeNode(node: TopologyNode, includeOptional: boolean): boolean {
  return node.required || includeOptional;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validateTemplateSupport(
  templateProfessionIds: string[],
  packetRequiredProfessionIds: string[],
  packetOptionalProfessionIds: string[],
  templateId: FlowTemplateId,
): void {
  const supported = new Set(templateProfessionIds);

  for (const professionId of [...packetRequiredProfessionIds, ...packetOptionalProfessionIds]) {
    if (!supported.has(professionId)) {
      throw new Error(`Template ${templateId} does not support packet profession ${professionId}.`);
    }
  }
}

export function assembleMissionTopology(request: MissionAssemblyRequest): MissionTopology {
  const template = getFlowTemplate(request.templateId);

  if (tierRank(request.consequenceTier) < tierRank(template.minimumConsequenceTier)) {
    throw new Error(
      `Template ${template.id} requires consequence tier ${template.minimumConsequenceTier} or higher.`,
    );
  }

  const packetRequiredProfessionIds = unique(request.requiredProfessionIds ?? template.professionIds);
  const packetOptionalProfessionIds = unique(
    request.optionalProfessionIds ?? (request.includeOptional === true ? template.optionalProfessionIds : []),
  );
  const supportedProfessionIds = unique([...template.professionIds, ...template.optionalProfessionIds]);

  requireProfessions(packetRequiredProfessionIds);
  packetOptionalProfessionIds.forEach(getProfession);
  validateTemplateSupport(
    supportedProfessionIds,
    packetRequiredProfessionIds,
    packetOptionalProfessionIds,
    request.templateId,
  );

  const activeProfessionIds = new Set([...packetRequiredProfessionIds, ...packetOptionalProfessionIds]);
  const allowedNodes = template.nodes.filter((node) => {
    if (!includeNode(node, request.includeOptional === true)) {
      return false;
    }

    if (!node.professionId) {
      return true;
    }

    return activeProfessionIds.has(node.professionId);
  });
  const allowedNodeIds = new Set(allowedNodes.map((node) => node.id));
  const allowedEdges = template.edges.filter(
    (edge) => allowedNodeIds.has(edge.from) && allowedNodeIds.has(edge.to),
  );

  return {
    missionId: request.missionId,
    objective: request.objective,
    consequenceTier: request.consequenceTier,
    templateId: request.templateId,
    nodes: allowedNodes,
    edges: allowedEdges,
    requiredProfessionIds: packetRequiredProfessionIds,
    optionalProfessionIds: packetOptionalProfessionIds,
  };
}

export function suggestTemplateForTier(consequenceTier: ConsequenceTier): FlowTemplateId {
  if (consequenceTier === "critical" || consequenceTier === "important") {
    return "verification-heavy";
  }

  if (consequenceTier === "routine") {
    return "saas-build";
  }

  return "rapid-prototype";
}
