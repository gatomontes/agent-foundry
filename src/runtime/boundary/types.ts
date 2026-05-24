import type { ConsequenceTier, RuntimeReference, RuntimeTimestamp } from "../shared/types.js";
import type { FlowTemplateId, MissionTopology } from "../topology/types.js";
import type { AuditScroll } from "./scribe.js";

export type CitadelReturnKind = "production-order" | "operator-prompt-request";

export interface OperatorPromptRequest {
  packetId: string;
  missionId: string;
  reason: string;
  questions: string[];
  blockingIssues: string[];
  returnRoute: "isolde";
  scroll: AuditScroll;
  createdAt: RuntimeTimestamp;
}

export interface CitadelProposal {
  title: string;
  rationale: string;
  plannedFlow: string;
  expectedArtifacts: string[];
  risks: string[];
}

export interface FoundryProductionPacket {
  packetId: string;
  missionId: string;
  citadelRookReference: string;
  objective: string;
  summary: string;
  proposal: CitadelProposal;
  consequenceTier: ConsequenceTier;
  templateId: FlowTemplateId;
  executionMode?: "normal" | "verification-failure";
  failureReason?: string;
  requiredProfessionIds: string[];
  optionalProfessionIds: string[];
  governanceNotes: string[];
  artifacts: RuntimeReference[];
  scroll: AuditScroll;
  topology?: MissionTopology;
  createdAt: RuntimeTimestamp;
}

export interface CitadelRookReturnPacket {
  packetId: string;
  missionId: string;
  source: "citadel-rook";
  returnKind: CitadelReturnKind;
  scroll: AuditScroll;
  productionOrder?: FoundryProductionPacket;
  operatorPromptRequest?: OperatorPromptRequest;
  createdAt: RuntimeTimestamp;
}
