import { assertNonEmpty, toTimestamp } from "../shared/types.js";
import type { IsoldeIntakePacket } from "./isolde.js";
import { CitadelScribe, recordScrollEntry } from "./scribe.js";
import type { CitadelRookReturnPacket, FoundryProductionPacket } from "./types.js";
import { exampleProductionOrder, exampleOperatorPromptRequest } from "../examples/fixtures.js";

function classifyTemplate(packet: IsoldeIntakePacket): FoundryProductionPacket["templateId"] {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();

  if (corpus.includes("critical") || corpus.includes("security") || corpus.includes("payroll calculation")) {
    return "verification-heavy";
  }

  if (corpus.includes("prototype") || corpus.includes("exploratory")) {
    return "rapid-prototype";
  }

  return "saas-build";
}

function classifyTier(packet: IsoldeIntakePacket): FoundryProductionPacket["consequenceTier"] {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();

  if (corpus.includes("critical") || corpus.includes("security")) {
    return "critical";
  }

  if (corpus.includes("payroll") || corpus.includes("employee")) {
    return "important";
  }

  if (corpus.includes("prototype") || corpus.includes("exploratory")) {
    return "trivial";
  }

  return "routine";
}

function requiresClarification(packet: IsoldeIntakePacket): boolean {
  const loweredObjective = packet.objective.toLowerCase();
  const loweredNotes = packet.notes.map((note) => note.toLowerCase());
  const hasCapabilityAnswer = loweredNotes.some((note) => note.startsWith("first concrete capability:"));
  const hasFlowAnswer = loweredNotes.some((note) => note.startsWith("preferred flow:"));
  const clarificationSatisfied = hasCapabilityAnswer && hasFlowAnswer;

  return (
    (loweredObjective.includes("have not decided") || loweredObjective.includes("not decided")) &&
    !clarificationSatisfied
  );
}

function requiresFailureCase(packet: IsoldeIntakePacket): boolean {
  const corpus = `${packet.objective} ${packet.notes.join(" ")}`.toLowerCase();
  return corpus.includes("failure test") || corpus.includes("simulate verification failure");
}

export class CitadelAdapter {
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
    recordScrollEntry(packet.scroll, "citadel-core", "packet-reviewed", "Citadel reviewed the intake and classified the next governed action.");

    const returnPacket = requiresClarification(packet)
      ? this.buildPromptReturn(packet)
      : this.buildProductionReturn(packet);

    this.scribe.record(packet.scroll, "packet-recorded", "Citadel Scribe recorded the governed return.");
    recordScrollEntry(packet.scroll, "citadel-rook", "packet-returned", "Citadel Rook emitted the governed return packet toward Foundry.");
    this.emittedReturns.push(returnPacket);
    return returnPacket;
  }

  private buildProductionReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const productionOrder = exampleProductionOrder();
    const templateId = classifyTemplate(packet);
    const consequenceTier = classifyTier(packet);
    const executionMode = requiresFailureCase(packet) ? "verification-failure" : "normal";
    const proposalTitle =
      executionMode === "verification-failure"
        ? "Controlled verification-failure validation run"
        : `Governed ${templateId} production initiation`;
    const expectedArtifacts = [
      "Critique report",
      "Audit report",
      "Failure path report",
      "Hash manifest",
      "Scribe report",
    ];
    const risks = [
      "Implementation outputs remain untrusted until verification completes.",
      consequenceTier === "critical"
        ? "Critical consequence tier requires especially careful downstream handling."
        : `Consequence tier is governed as ${consequenceTier} and may constrain execution choices.`,
    ];

    const governedOrder: FoundryProductionPacket = {
      ...productionOrder,
      packetId: `fp-${packet.requestId}`,
      missionId: productionOrder.missionId,
      citadelRookReference: `cr-${packet.requestId}`,
      objective: packet.objective,
      summary:
        executionMode === "verification-failure"
          ? `Citadel approved a controlled failure-case production run for request ${packet.requestId}.`
          : `Citadel approved production initiation for request ${packet.requestId}.`,
      proposal: {
        title: proposalTitle,
        rationale:
          executionMode === "verification-failure"
            ? "Validate the verification, critique, audit, and restoration chain under a deliberate failure condition."
            : `Initiate a ${templateId} flow that matches the stated objective and preserved operator constraints.`,
        plannedFlow:
          executionMode === "verification-failure"
            ? "Run the requested work through a governed verification-failure path, preserve evidence, and require restoration-aware reporting."
            : "Proceed through the governed topology in order, preserve artifact lineage, and hold final trust pending verification.",
        expectedArtifacts,
        risks,
      },
      consequenceTier,
      templateId,
      executionMode,
      governanceNotes: [
        "Verification remains mandatory before any trusted disposition.",
        "Foundry must preserve artifact lineage for implementation outputs.",
        ...packet.notes,
      ],
      scroll: packet.scroll,
      createdAt: toTimestamp(),
      ...(executionMode === "verification-failure"
        ? {
            failureReason:
              "Controlled failure case requested to validate verification, critique, audit, and restoration behavior.",
          }
        : {}),
      ...(productionOrder.topology
        ? {
            topology: {
              ...productionOrder.topology,
              objective: packet.objective,
              consequenceTier,
              templateId,
            },
          }
        : {}),
    };

    return {
      packetId: `cr-return-${packet.requestId}`,
      missionId: governedOrder.missionId,
      source: "citadel-rook",
      returnKind: "production-order",
      scroll: packet.scroll,
      productionOrder: governedOrder,
      createdAt: toTimestamp(),
    };
  }

  private buildPromptReturn(packet: IsoldeIntakePacket): CitadelRookReturnPacket {
    const promptRequest = exampleOperatorPromptRequest();

    return {
      packetId: `cr-return-${packet.requestId}`,
      missionId: promptRequest.missionId,
      source: "citadel-rook",
      returnKind: "operator-prompt-request",
      scroll: packet.scroll,
      operatorPromptRequest: {
        ...promptRequest,
        packetId: `opr-${packet.requestId}`,
        reason: `Citadel requires clarification before production can begin for request ${packet.requestId}.`,
        scroll: packet.scroll,
        createdAt: toTimestamp(),
      },
      createdAt: toTimestamp(),
    };
  }
}
