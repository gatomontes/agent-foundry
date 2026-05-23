import { validateFoundryProductionPacket } from "../boundary/packets.js";
import type { FoundryProductionPacket } from "../boundary/types.js";
import { getProfession } from "../professions/registry.js";
import type { ProfessionSelection } from "../professions/types.js";
import { suggestTemplateForTier } from "../topology/assembly.js";
import { getFlowTemplate } from "../topology/templates.js";
import type {
  ProductionPacketStaffingRequest,
  StaffingRecommendation,
  StaffingRequest,
} from "./types.js";

function buildSelections(professionIds: string[], required: boolean, reason: string): ProfessionSelection[] {
  return professionIds.map((professionId) => {
    const profession = getProfession(professionId);

    return {
      professionId,
      required,
      reason: `${profession.name}: ${reason}`,
    };
  });
}

export function recommendStaffing(request: StaffingRequest): StaffingRecommendation {
  const templateId = suggestTemplateForTier(request.consequenceTier);
  const template = getFlowTemplate(templateId);
  const rationale: string[] = [
    `Selected ${template.name} for ${request.consequenceTier} consequence work.`,
  ];

  if (request.preferMinimalTeam === true) {
    rationale.push("Minimal-team preference preserved by defaulting to the template's required professions.");
  }

  if (request.requireIndependentReview === true && !template.professionIds.includes("verification-specialist")) {
    rationale.push("Independent review requested, but the selected template lacks a verification specialist.");
  }

  if (request.consequenceTier === "important" || request.consequenceTier === "critical") {
    rationale.push("Higher-consequence work favors stronger verification and review topology.");
  }

  const optionalIds =
    request.preferMinimalTeam === true ? [] : template.optionalProfessionIds;

  return {
    templateId,
    professionChain: buildSelections(
      template.professionIds,
      true,
      `Required by ${template.name} for objective "${request.objective}".`,
    ),
    optionalAdditions: buildSelections(
      optionalIds,
      false,
      "Optional support role recommended when coordination or review pressure increases.",
    ),
    rationale,
  };
}

function buildPacketSelections(
  packet: FoundryProductionPacket,
  professionIds: string[],
  required: boolean,
  reason: string,
): ProfessionSelection[] {
  return professionIds.map((professionId) => {
    const profession = getProfession(professionId);

    return {
      professionId,
      required,
      reason: `${profession.name}: ${reason} Packet ${packet.packetId} marked this role as ${required ? "required" : "optional"}.`,
    };
  });
}

export function recommendStaffingFromProductionPacket(
  request: ProductionPacketStaffingRequest,
): StaffingRecommendation {
  const packet = validateFoundryProductionPacket(request.packet);
  const template = getFlowTemplate(packet.templateId);
  const optionalIds = request.preferMinimalTeam === true ? [] : packet.optionalProfessionIds;

  return {
    templateId: packet.templateId,
    professionChain: buildPacketSelections(
      packet,
      packet.requiredProfessionIds,
      true,
      `Required by Citadel-governed production order for objective "${packet.objective}".`,
    ),
    optionalAdditions: buildPacketSelections(
      packet,
      optionalIds,
      false,
      "Optional support role available for coordination or review expansion.",
    ),
    rationale: [
      `Honored Citadel production order ${packet.packetId} as the authoritative staffing source.`,
      `Applied ${template.name} as the packet's declared template.`,
      `Consequence tier ${packet.consequenceTier} remains governed upstream by Citadel.`,
    ],
  };
}
