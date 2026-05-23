import type { ConsequenceTier } from "../shared/types.js";
import type { FoundryProductionPacket } from "../boundary/types.js";
import type { FlowTemplateId } from "../topology/types.js";
import type { ProfessionSelection } from "../professions/types.js";

export interface StaffingRequest {
  objective: string;
  consequenceTier: ConsequenceTier;
  preferMinimalTeam?: boolean;
  requireIndependentReview?: boolean;
}

export interface StaffingRecommendation {
  templateId: FlowTemplateId;
  professionChain: ProfessionSelection[];
  optionalAdditions: ProfessionSelection[];
  rationale: string[];
}

export interface ProductionPacketStaffingRequest {
  packet: FoundryProductionPacket;
  preferMinimalTeam?: boolean;
}
