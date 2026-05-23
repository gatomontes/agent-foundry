import { FoundryRook } from "../boundary/foundry-rook.js";
import { CitadelStub } from "../boundary/citadel-stub.js";
import { Isolde } from "../boundary/isolde.js";
import {
  exampleClarificationIntent,
  exampleOperatorIntent,
} from "./fixtures.js";

export interface ExampleUsageSummary {
  intakeDestination: string;
  citadelReturnSource: string;
  productionOutcomeKind: string;
  activatedMissionId: string;
  orderedTopology: string[];
  promptOutcomeKind: string;
  promptTarget: string;
  promptQuestionCount: number;
}

export function runFoundryRookExample(): ExampleUsageSummary {
  const isolde = new Isolde();
  const foundryRook = new FoundryRook();
  const citadelStub = new CitadelStub();

  const operatorIntake = isolde.receiveOperatorIntent(exampleOperatorIntent());
  foundryRook.receiveIsoldeIntake(operatorIntake);
  const productionOutcome = foundryRook.receiveCitadelReturn(
    citadelStub.receiveFoundryBoundaryIntake(operatorIntake),
  );

  if (productionOutcome.kind !== "production-pending-confirmation") {
    throw new Error("Expected production-pending-confirmation outcome from production return packet.");
  }

  const initiatedOutcome = foundryRook.initiateProduction(productionOutcome.packet);

  const clarificationIntake = isolde.receiveOperatorIntent(exampleClarificationIntent());
  foundryRook.receiveIsoldeIntake(clarificationIntake);
  const promptOutcome = foundryRook.receiveCitadelReturn(
    citadelStub.receiveFoundryBoundaryIntake(clarificationIntake),
  );

  if (promptOutcome.kind !== "operator-prompt-routed") {
    throw new Error("Expected operator-prompt-routed outcome from prompt return packet.");
  }

  isolde.surfacePrompt(clarificationIntake.operatorId, promptOutcome.promptRequest);

  return {
    intakeDestination: operatorIntake.destination,
    citadelReturnSource: citadelStub.emittedReturns[0]?.source ?? "unknown",
    productionOutcomeKind: initiatedOutcome.kind,
    activatedMissionId: initiatedOutcome.missionRuntime.mission.missionId,
    orderedTopology: initiatedOutcome.missionRuntime.orderedTopology(),
    promptOutcomeKind: promptOutcome.kind,
    promptTarget: promptOutcome.target,
    promptQuestionCount: promptOutcome.promptRequest.questions.length,
  };
}
