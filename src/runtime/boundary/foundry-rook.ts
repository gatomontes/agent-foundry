import { normalizeCitadelReturnForFoundry } from "./packets.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  OperatorPromptRequest,
} from "./types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
import { FoundryScribe, recordScrollEntry } from "./scribe.js";
import { MissionRuntime } from "../mission-runtime.js";

export type FoundryRookOutcomeKind =
  | "production-pending-confirmation"
  | "production-initiated"
  | "operator-prompt-routed";

export interface ProductionPendingConfirmationOutcome {
  kind: "production-pending-confirmation";
  packet: FoundryProductionPacket;
}

export interface ProductionInitiatedOutcome {
  kind: "production-initiated";
  packet: FoundryProductionPacket;
  missionRuntime: MissionRuntime;
}

export interface OperatorPromptRoutedOutcome {
  kind: "operator-prompt-routed";
  promptRequest: OperatorPromptRequest;
  target: "isolde";
}

export type FoundryRookOutcome =
  | ProductionPendingConfirmationOutcome
  | ProductionInitiatedOutcome
  | OperatorPromptRoutedOutcome;

export class FoundryRook {
  readonly activeMissions: Map<string, MissionRuntime>;
  readonly routedPrompts: OperatorPromptRequest[];
  readonly forwardedIntake: IsoldeIntakePacket[];
  readonly scribe: FoundryScribe;

  constructor() {
    this.activeMissions = new Map();
    this.routedPrompts = [];
    this.forwardedIntake = [];
    this.scribe = new FoundryScribe();
  }

  receiveIsoldeIntake(packet: IsoldeIntakePacket): IsoldeIntakePacket {
    recordScrollEntry(packet.scroll, "foundry-rook", "packet-received", "Foundry Rook received intake from Isolde.");
    this.scribe.record(packet.scroll, "packet-recorded", "Foundry Scribe recorded outbound transfer toward Citadel.");
    recordScrollEntry(packet.scroll, "foundry-rook", "packet-forwarded", "Foundry Rook forwarded intake to Citadel.");
    this.forwardedIntake.push(packet);
    return packet;
  }

  receiveCitadelReturn(packet: CitadelRookReturnPacket): FoundryRookOutcome {
    recordScrollEntry(packet.scroll, "foundry-rook", "packet-received", "Foundry Rook received return packet from Citadel Rook.");
    this.scribe.record(packet.scroll, "packet-recorded", "Foundry Scribe recorded the returning packet.");
    const normalized = normalizeCitadelReturnForFoundry(packet);

    if ("citadelRookReference" in normalized) {
      return {
        kind: "production-pending-confirmation",
        packet: normalized,
      };
    }

    return this.routeOperatorPrompt(normalized);
  }

  initiateProduction(packet: FoundryProductionPacket): ProductionInitiatedOutcome {
    this.scribe.record(packet.scroll, "packet-recorded", "Foundry Scribe recorded operator-approved production initiation.");
    const missionRuntime = new MissionRuntime(packet);
    this.activeMissions.set(packet.missionId, missionRuntime);

    return {
      kind: "production-initiated",
      packet,
      missionRuntime,
    };
  }

  routeOperatorPrompt(promptRequest: OperatorPromptRequest): OperatorPromptRoutedOutcome {
    this.scribe.record(promptRequest.scroll, "packet-recorded", "Foundry Scribe recorded an operator clarification request.");
    this.routedPrompts.push(promptRequest);

    return {
      kind: "operator-prompt-routed",
      promptRequest,
      target: "isolde",
    };
  }

  getMissionRuntime(missionId: string): MissionRuntime {
    const runtime = this.activeMissions.get(missionId);

    if (!runtime) {
      throw new Error(`No active mission runtime found for ${missionId}.`);
    }

    return runtime;
  }
}
