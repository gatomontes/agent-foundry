import { createDelegationPacket } from "../delegation/packet.js";
import { exampleOperatorIntent, exampleProductionReturnPacket, examplePromptReturnPacket } from "./fixtures.js";
import { Isolde } from "../boundary/isolde.js";
import {
  validateCitadelDelegationScroll,
  validateCitadelRookIntake,
  validateCitadelRookReturnPacket,
} from "../schema/citadel-boundary-validator.js";

function report(label: string, issues: { path: string; message: string }[]): never {
  throw new Error(`${label} failed validation.\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
}

function ensure(label: string, valid: boolean, issues: { path: string; message: string }[]): void {
  if (!valid) {
    report(label, issues);
  }

  console.log(`${label}: valid`);
}

const isolde = new Isolde();
const intake = isolde.receiveOperatorIntent(exampleOperatorIntent());
ensure("Rook intake", validateCitadelRookIntake(intake).valid, validateCitadelRookIntake(intake).issues);

const productionReturn = exampleProductionReturnPacket();
ensure(
  "Production return",
  validateCitadelRookReturnPacket(productionReturn).valid,
  validateCitadelRookReturnPacket(productionReturn).issues,
);

const promptReturn = examplePromptReturnPacket();
ensure(
  "Prompt return",
  validateCitadelRookReturnPacket(promptReturn).valid,
  validateCitadelRookReturnPacket(promptReturn).issues,
);

const delegation = createDelegationPacket({
  id: "delegation-001",
  missionId: productionReturn.missionId,
  parent: {
    operatorId: "chief-of-staff",
    authorityClass: "EXECUTE_WITH_APPROVAL",
  },
  child: {
    operatorId: "systems-architect",
    professionId: "systems-architect",
    authorityClass: "EXECUTE_WITHIN_SCOPE",
  },
  objective: "Produce the boundary package architecture brief.",
  consequenceTier: "routine",
  constraints: ["Preserve Citadel handoff boundaries."],
  dependencies: [{ id: "artifact-arch-001", kind: "architecture-brief" }],
  returnConditions: ["success", "blocked"],
});
ensure(
  "Delegation scroll",
  validateCitadelDelegationScroll(delegation).valid,
  validateCitadelDelegationScroll(delegation).issues,
);
