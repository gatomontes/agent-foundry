import type { ConsequenceTier, RuntimeReference, RuntimeTimestamp } from "../shared/types.js";
import type { FlowTemplateId, MissionTopology } from "../topology/types.js";

export type CitadelReturnKind = "production-order" | "operator-prompt-request";

export interface OperatorPromptRequest {
  packetId: string;
  missionId: string;
  reason: string;
  questions: string[];
  blockingIssues: string[];
  returnRoute: "isolde";
  createdAt: RuntimeTimestamp;
}

export interface FoundryProductionPacket {
  packetId: string;
  missionId: string;
  citadelRookReference: string;
  objective: string;
  summary: string;
  consequenceTier: ConsequenceTier;
  templateId: FlowTemplateId;
  requiredProfessionIds: string[];
  optionalProfessionIds: string[];
  governanceNotes: string[];
  artifacts: RuntimeReference[];
  topology?: MissionTopology;
  createdAt: RuntimeTimestamp;
}

export interface CitadelRookReturnPacket {
  packetId: string;
  missionId: string;
  source: "citadel-rook";
  returnKind: CitadelReturnKind;
  productionOrder?: FoundryProductionPacket;
  operatorPromptRequest?: OperatorPromptRequest;
  createdAt: RuntimeTimestamp;
}
