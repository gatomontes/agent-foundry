import { assertNonEmpty } from "../shared/types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
import type { CitadelRookReturnPacket } from "./types.js";
import {
  exampleProductionReturnPacket,
  examplePromptReturnPacket,
} from "../examples/fixtures.js";

export class CitadelStub {
  readonly receivedIntake: IsoldeIntakePacket[];
  readonly emittedReturns: CitadelRookReturnPacket[];

  constructor() {
    this.receivedIntake = [];
    this.emittedReturns = [];
  }

  receiveFoundryBoundaryIntake(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    assertNonEmpty(packet.packetId, "isoldeIntake.packetId");
    assertNonEmpty(packet.objective, "isoldeIntake.objective");

    this.receivedIntake.push(packet);

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
      productionOrder: {
        ...productionOrder,
        objective: packet.objective,
        summary: `Citadel approved production initiation for request ${packet.requestId}.`,
        governanceNotes: [
          ...productionOrder.governanceNotes,
          ...packet.notes,
        ],
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
      operatorPromptRequest: {
        ...operatorPromptRequest,
        reason: `Citadel requires clarification before production can begin for request ${packet.requestId}.`,
      },
      createdAt: promptReturn.createdAt,
    };
  }
}
