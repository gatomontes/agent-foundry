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
        ? "Controlled verification-failure validation package"
        : `Governed ${templateId} improvement package`;
    const proposalItems =
      executionMode === "verification-failure"
        ? [
            {
              action: "Run the requested work through a controlled verification-failure path",
              purpose: "Prove that the governance chain behaves correctly when verification does not pass.",
              details:
                "Inject a deliberate verification failure, preserve the critique and audit trail, and route the packet through restoration-aware handling.",
              expectedOutcome:
                "The team gets evidence that failure, blockage, and restoration semantics are working before any trusted release claim is made.",
            },
            {
              action: "Tighten release blocking around failed verification",
              purpose: "Prevent failed outputs from drifting into operator-facing trust or downstream release paths.",
              details:
                "Keep release-facing disposition frozen whenever the controlled failure path is active and preserve the blocked packet for Citadel review.",
              expectedOutcome:
                "Failure artifacts remain visible, and the runtime demonstrates disciplined refusal rather than silent continuation.",
            },
            {
              action: "Strengthen evidence preservation across the failure cycle",
              purpose: "Make the failure test useful for future governance, critique, and audit review.",
              details:
                "Require the failure path, hash manifest, critique report, audit report, and scribe report to remain attached as a coherent evidence set.",
              expectedOutcome:
                "Citadel receives a reusable proof bundle showing what failed, why it failed, and how custody was preserved.",
            },
          ]
        : [
            {
              action: "Build the smallest governed implementation slice first",
              purpose: "Establish a concrete starting point without overcommitting to a broad or underspecified build.",
              details:
                "Use the selected template to begin with the first coherent capability and preserve the operator's stated constraints inside the governed packet.",
              expectedOutcome:
                "The team gets a practical first increment that can be executed, reviewed, and expanded without losing governance shape.",
            },
            {
              action: "Tighten verification before any trusted disposition",
              purpose: "Keep implementation momentum from being confused with validated delivery.",
              details:
                "Require the governed flow to pass through verification and keep critique and audit as distinct custody surfaces before trust claims are made.",
              expectedOutcome:
                "Outputs can move forward operationally while still being clearly marked as untrusted until verification is complete.",
            },
            {
              action: "Strengthen artifact lineage and reporting",
              purpose: "Make the work reviewable, challengeable, and restorable as the mission evolves.",
              details:
                "Preserve the critique report, audit report, failure path, hash manifest, and scribe report as explicit artifacts attached to the run.",
              expectedOutcome:
                "Operators and downstream reviewers can see what was proposed, what was produced, and how governance custody was maintained.",
            },
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
        summary:
          executionMode === "verification-failure"
            ? "Citadel proposes a controlled failure-oriented run focused on validating blockage, evidence preservation, and restoration behavior."
            : `Citadel proposes a concrete governed improvement package for ${packet.objective}.`,
        items: proposalItems,
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
