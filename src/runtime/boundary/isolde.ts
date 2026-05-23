import { assertNonEmpty, toTimestamp, type RuntimeTimestamp } from "../shared/types.js";
import { createAuditScroll, recordScrollEntry } from "./scribe.js";
import type { OperatorPromptRequest } from "./types.js";

export interface OperatorIntent {
  requestId: string;
  operatorId: string;
  objective: string;
  notes?: string[];
}

export interface IsoldeIntakePacket {
  packetId: string;
  requestId: string;
  operatorId: string;
  objective: string;
  notes: string[];
  normalizedBy: "isolde";
  destination: "foundry-rook";
  scroll: import("./scribe.js").AuditScroll;
  createdAt: RuntimeTimestamp;
}

export interface SurfacedPrompt {
  missionId: string;
  operatorId: string;
  reason: string;
  questions: string[];
  surfacedAt: RuntimeTimestamp;
}

export class Isolde {
  readonly forwardedIntake: IsoldeIntakePacket[];
  readonly surfacedPrompts: SurfacedPrompt[];

  constructor() {
    this.forwardedIntake = [];
    this.surfacedPrompts = [];
  }

  receiveOperatorIntent(intent: OperatorIntent): IsoldeIntakePacket {
    assertNonEmpty(intent.requestId, "operatorIntent.requestId");
    assertNonEmpty(intent.operatorId, "operatorIntent.operatorId");
    assertNonEmpty(intent.objective, "operatorIntent.objective");

    const packet: IsoldeIntakePacket = {
      packetId: `isolde-${intent.requestId}`,
      requestId: intent.requestId,
      operatorId: intent.operatorId,
      objective: intent.objective.trim(),
      notes: intent.notes ?? [],
      normalizedBy: "isolde",
      destination: "foundry-rook",
      scroll: createAuditScroll(`isolde-${intent.requestId}`),
      createdAt: toTimestamp(),
    };

    packet.scroll.missionId = intent.requestId;
    recordScrollEntry(
      packet.scroll,
      "isolde",
      "packet-created",
      `Isolde normalized operator request ${intent.requestId}.`,
    );

    this.forwardedIntake.push(packet);
    return packet;
  }

  receiveClarification(
    priorPacket: IsoldeIntakePacket,
    answers: string[],
  ): IsoldeIntakePacket {
    assertNonEmpty(priorPacket.packetId, "priorPacket.packetId");

    const packet: IsoldeIntakePacket = {
      packetId: `${priorPacket.packetId}-clarified-${this.forwardedIntake.length + 1}`,
      requestId: priorPacket.requestId,
      operatorId: priorPacket.operatorId,
      objective: priorPacket.objective,
      notes: [...priorPacket.notes, ...answers.filter((answer) => answer.trim().length > 0)],
      normalizedBy: "isolde",
      destination: "foundry-rook",
      scroll: priorPacket.scroll,
      createdAt: toTimestamp(),
    };

    packet.scroll.packetId = packet.packetId;
    recordScrollEntry(
      packet.scroll,
      "isolde",
      "packet-repackaged",
      `Isolde attached clarification answers for request ${priorPacket.requestId}.`,
    );

    this.forwardedIntake.push(packet);
    return packet;
  }

  surfacePrompt(operatorId: string, promptRequest: OperatorPromptRequest): SurfacedPrompt {
    assertNonEmpty(operatorId, "operatorId");

    const surfaced: SurfacedPrompt = {
      missionId: promptRequest.missionId,
      operatorId,
      reason: promptRequest.reason,
      questions: promptRequest.questions,
      surfacedAt: toTimestamp(),
    };

    this.surfacedPrompts.push(surfaced);
    return surfaced;
  }
}
