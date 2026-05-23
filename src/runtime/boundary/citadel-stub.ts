import { assertNonEmpty } from "../shared/types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
import { CitadelScribe, recordScrollEntry } from "./scribe.js";
import type { CitadelRookReturnPacket } from "./types.js";
import {
  exampleProductionReturnPacket,
  examplePromptReturnPacket,
} from "../examples/fixtures.js";

export class CitadelStub {
  readonly receivedIntake: IsoldeIntakePacket[];
  readonly emittedReturns: CitadelRookReturnPacket[];
  readonly scribe: CitadelScribe;

  constructor() {
    this.receivedIntake = [];
    this.emittedReturns = [];
    this.scribe = new CitadelScribe();
  }

  receiveFoundryBoundaryIntake(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    assertNonEmpty(packet.packetId, "isoldeIntake.packetId");
    assertNonEmpty(packet.objective, "isoldeIntake.objective");

    this.receivedIntake.push(packet);
    recordScrollEntry(packet.scroll, "citadel-rook", "packet-received", "Citadel Rook received the intake packet from Foundry.");
    this.scribe.record(packet.scroll, "packet-recorded", "Citadel Scribe recorded intake arrival.");
    recordScrollEntry(packet.scroll, "citadel-core", "packet-reviewed", "Citadel reviewed the intake and determined the next governed response.");

    const loweredObjective = packet.objective.toLowerCase();
    const loweredNotes = packet.notes.map((note) => note.toLowerCase());
    const hasCapabilityAnswer = loweredNotes.some((note) => note.startsWith("first concrete capability:"));
    const hasFlowAnswer = loweredNotes.some((note) => note.startsWith("preferred flow:"));
    const clarificationSatisfied = hasCapabilityAnswer && hasFlowAnswer;
    const returnPacket =
      (loweredObjective.includes("have not decided") || loweredObjective.includes("not decided")) &&
      !clarificationSatisfied
        ? this.buildPromptReturn(packet)
        : this.buildProductionReturn(packet);

    this.emittedReturns.push(returnPacket);
    return returnPacket;
  }

  private buildProductionReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const productionReturn = exampleProductionReturnPacket();
    const productionOrder = productionReturn.productionOrder;

    if (!productionOrder) {
      throw new Error("Example production return packet must include a productionOrder.");
    }

    return {
      packetId: productionReturn.packetId,
      missionId: productionOrder.missionId,
      source: productionReturn.source,
      returnKind: productionReturn.returnKind,
      scroll: packet.scroll,
      productionOrder: {
        ...productionOrder,
        objective: packet.objective,
        summary: `Citadel approved production initiation for request ${packet.requestId}.`,
        governanceNotes: [
          ...productionOrder.governanceNotes,
          ...packet.notes,
        ],
        scroll: packet.scroll,
      },
      createdAt: productionReturn.createdAt,
    };
  }

  private buildPromptReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const promptReturn = examplePromptReturnPacket();
    const operatorPromptRequest = promptReturn.operatorPromptRequest;

    if (!operatorPromptRequest) {
      throw new Error("Example prompt return packet must include an operatorPromptRequest.");
    }

    return {
      packetId: promptReturn.packetId,
      missionId: operatorPromptRequest.missionId,
      source: promptReturn.source,
      returnKind: promptReturn.returnKind,
      scroll: packet.scroll,
      operatorPromptRequest: {
        ...operatorPromptRequest,
        reason: `Citadel requires clarification before production can begin for request ${packet.requestId}.`,
        scroll: packet.scroll,
      },
      createdAt: promptReturn.createdAt,
    };
  }
}
