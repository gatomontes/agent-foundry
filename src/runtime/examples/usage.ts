import { FoundryRook } from "../boundary/foundry-rook.js";
import { CitadelAdapter } from "../boundary/citadel-adapter.js";
import { Isolde } from "../boundary/isolde.js";
import {
  exampleClarificationIntent,
  exampleFailureIntent,
  exampleOperatorIntent,
} from "./fixtures.js";
import { materializeOutputStructure } from "../output/carmilla.js";

export interface ExampleUsageSummary {
  intakeDestination: string;
  citadelReturnSource: string;
  productionOutcomeKind: string;
  activatedMissionId: string;
  orderedTopology: string[];
  promptOutcomeKind: string;
  promptTarget: string;
  promptQuestionCount: number;
  failurePacketMode: string;
  failureManifestPath: string;
}

export async function runFoundryRookExample(): Promise<ExampleUsageSummary> {
  const isolde = new Isolde();
  const foundryRook = new FoundryRook();
  const citadelAdapter = new CitadelAdapter();

  const operatorIntake = isolde.receiveOperatorIntent(exampleOperatorIntent());
  foundryRook.receiveIsoldeIntake(operatorIntake);
  const productionOutcome = foundryRook.receiveCitadelReturn(
    citadelAdapter.receiveFoundryBoundaryIntake(operatorIntake),
  );

  if (productionOutcome.kind !== "production-pending-confirmation") {
    throw new Error("Expected production-pending-confirmation outcome from production return packet.");
  }

  const initiatedOutcome = foundryRook.initiateProduction(productionOutcome.packet);

  const clarificationIntake = isolde.receiveOperatorIntent(exampleClarificationIntent());
  foundryRook.receiveIsoldeIntake(clarificationIntake);
  const promptOutcome = foundryRook.receiveCitadelReturn(
    citadelAdapter.receiveFoundryBoundaryIntake(clarificationIntake),
  );

  if (promptOutcome.kind !== "operator-prompt-routed") {
    throw new Error("Expected operator-prompt-routed outcome from prompt return packet.");
  }

  isolde.surfacePrompt(clarificationIntake.operatorId, promptOutcome.promptRequest);
  const failureIntake = isolde.receiveOperatorIntent(exampleFailureIntent());
  foundryRook.receiveIsoldeIntake(failureIntake);
  const failureOutcome = foundryRook.receiveCitadelReturn(
    citadelAdapter.receiveFoundryBoundaryIntake(failureIntake),
  );

  if (failureOutcome.kind !== "production-pending-confirmation") {
    throw new Error("Expected production-pending-confirmation outcome from failure return packet.");
  }

  const failureInitiated = foundryRook.initiateProduction(failureOutcome.packet);
  const failureMaterialized = await materializeOutputStructure(failureOutcome.packet);

  return {
    intakeDestination: operatorIntake.destination,
    citadelReturnSource: citadelAdapter.emittedReturns[0]?.source ?? "unknown",
    productionOutcomeKind: initiatedOutcome.kind,
    activatedMissionId: initiatedOutcome.missionRuntime.mission.missionId,
    orderedTopology: initiatedOutcome.missionRuntime.orderedTopology(),
    promptOutcomeKind: promptOutcome.kind,
    promptTarget: promptOutcome.target,
    promptQuestionCount: promptOutcome.promptRequest.questions.length,
    failurePacketMode: failureInitiated.packet.executionMode ?? "normal",
    failureManifestPath: failureMaterialized.hashManifestPath,
  };
}
