import type {
  ConsequenceTier,
  ExecutionEvidence,
  ProductionProfile,
  RuntimeReference,
  RuntimeTimestamp,
} from "../shared/types.js";
import type { FlowTemplateId, MissionTopology } from "../topology/types.js";
import type { AuditScroll } from "./scribe.js";

export type CitadelReturnKind = "production-order" | "operator-prompt-request";

export interface NotarialStationFinding {
  station: string;
  findingSummary: string;
  evidenceRefs: string[];
  proposedActions: string[];
  blockedActions: string[];
  unresolvedQuestions: string[];
}

export interface PreReturnSummary {
  dispositionContext: string;
  requiredActions: string[];
  recommendedActions: string[];
  blockedActions: string[];
  humanDecisionsRequired: string[];
  followUpRoutes: string[];
  archivalCopyCreated: boolean;
  archivalReference: string;
}

export interface NotarialRecord {
  preparedBy: string;
  preparedAt: RuntimeTimestamp;
  stationFindings: NotarialStationFinding[];
  preReturnSummary: PreReturnSummary;
}

export interface RookReturnStatus {
  normalizedByRook: true;
  notarialSummaryPresent: boolean;
  archivalCopyConfirmed: boolean;
  readyForExternalReturn: boolean;
}

export interface OperatorPromptRequest {
  packetId: string;
  missionId: string;
  reason: string;
  questions: string[];
  blockingIssues: string[];
  returnRoute: "isolde";
  scroll: AuditScroll;
  notarialRecord?: NotarialRecord;
  returnStatus?: RookReturnStatus;
  createdAt: RuntimeTimestamp;
}

export interface CitadelProposal {
  title: string;
  summary: string;
  items: CitadelProposalItem[];
}

export interface CitadelProposalItem {
  action: string;
  purpose: string;
  details: string;
  expectedOutcome: string;
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
  productionProfile: ProductionProfile;
  scroll: AuditScroll;
  notarialRecord?: NotarialRecord;
  returnStatus?: RookReturnStatus;
  topology?: MissionTopology;
  executionEvidence?: ExecutionEvidence;
  createdAt: RuntimeTimestamp;
}

export interface CitadelRookReturnPacket {
  packetId: string;
  missionId: string;
  source: "citadel-rook";
  returnKind: CitadelReturnKind;
  scroll: AuditScroll;
  notarialRecord: NotarialRecord;
  productionOrder?: FoundryProductionPacket;
  operatorPromptRequest?: OperatorPromptRequest;
  returnStatus: RookReturnStatus;
  createdAt: RuntimeTimestamp;
}
