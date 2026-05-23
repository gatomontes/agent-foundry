import { normalizeCitadelReturnForFoundry } from "./packets.js";
import type {
  CitadelRookReturnPacket,
  FoundryProductionPacket,
  OperatorPromptRequest,
} from "./types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
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

  constructor() {
    this.activeMissions = new Map();
    this.routedPrompts = [];
    this.forwardedIntake = [];
  }

  receiveIsoldeIntake(packet: IsoldeIntakePacket): IsoldeIntakePacket {
    this.forwardedIntake.push(packet);
    return packet;
  }

  receiveCitadelReturn(packet: CitadelRookReturnPacket): FoundryRookOutcome {
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
    const missionRuntime = new MissionRuntime(packet);
    this.activeMissions.set(packet.missionId, missionRuntime);

    return {
      kind: "production-initiated",
      packet,
      missionRuntime,
    };
  }

  routeOperatorPrompt(promptRequest: OperatorPromptRequest): OperatorPromptRoutedOutcome {
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
