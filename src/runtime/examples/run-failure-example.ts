import { FoundryRook } from "../boundary/foundry-rook.js";
import { CitadelAdapter } from "../boundary/citadel-adapter.js";
import { Isolde } from "../boundary/isolde.js";
import { exampleFailureIntent } from "./fixtures.js";
import { materializeOutputStructure } from "../output/carmilla.js";

const isolde = new Isolde();
const foundryRook = new FoundryRook();
const citadelAdapter = new CitadelAdapter();

const intake = isolde.receiveOperatorIntent(exampleFailureIntent());
foundryRook.receiveIsoldeIntake(intake);
const outcome = foundryRook.receiveCitadelReturn(
  citadelAdapter.receiveFoundryBoundaryIntake(intake),
);

if (outcome.kind !== "production-pending-confirmation") {
  throw new Error("Expected a production-pending-confirmation outcome for the failure example.");
}

const initiated = foundryRook.initiateProduction(outcome.packet);
const materialized = await materializeOutputStructure(outcome.packet);

console.log(
  JSON.stringify(
    {
      missionId: initiated.missionRuntime.mission.missionId,
      executionMode: initiated.packet.executionMode,
      failureReason: initiated.packet.failureReason ?? null,
      hashManifestPath: materialized.hashManifestPath,
      critiqueReportPath: materialized.critiqueReportPath,
      auditReportPath: materialized.auditReportPath,
      failurePathReportPath: materialized.failurePathReportPath,
    },
    null,
    2,
  ),
);
