import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { CitadelStub } from "../boundary/citadel-stub.js";
import { FoundryRook } from "../boundary/foundry-rook.js";
import { Isolde } from "../boundary/isolde.js";
import {
  buildActivationSummary,
  buildProductionOrderSummary,
} from "./activation-summary.js";

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const isolde = new Isolde();
  const foundryRook = new FoundryRook();
  const citadelStub = new CitadelStub();

  try {
    output.write("Isolde: Welcome to the Foundry.\n");
    output.write("Isolde: I can carry your request into the governed chain.\n\n");

    const objective = (await rl.question("Isolde: What task should I carry forward?\n> ")).trim();

    if (objective.length === 0) {
      output.write("\nIsolde: I need a concrete task before I can proceed.\n");
      return;
    }

    const notesRaw = (
      await rl.question(
        "\nIsolde: Any notes or constraints I should preserve? You can leave this blank.\n> ",
      )
    ).trim();

    let intake = isolde.receiveOperatorIntent({
      requestId: `req-${Date.now()}`,
      operatorId: "operator-terminal",
      objective,
      notes: notesRaw.length > 0 ? [notesRaw] : [],
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      foundryRook.receiveIsoldeIntake(intake);
      const citadelReturn = citadelStub.receiveFoundryBoundaryIntake(intake);
      const outcome = foundryRook.receiveCitadelReturn(citadelReturn);

      output.write("\n");

      if (outcome.kind === "production-pending-confirmation") {
        for (const line of buildProductionOrderSummary(outcome.packet)) {
          output.write(`${line}\n`);
        }

        const confirmation = (
          await rl.question("Isolde: Do you want me to initiate production now? (yes/no)\n> ")
        ).trim().toLowerCase();

        if (confirmation !== "yes" && confirmation !== "y") {
          output.write(
            "Isolde: Production remains uninitiated. The governed packet is preserved pending further instruction.\n",
          );
          return;
        }

        const initiated = foundryRook.initiateProduction(outcome.packet);

        for (const line of buildActivationSummary(initiated)) {
          output.write(`${line}\n`);
        }

        return;
      }

      if (outcome.kind === "production-initiated") {
        output.write("Isolde: Citadel has returned a governed production order.\n");

        for (const line of buildActivationSummary(outcome)) {
          output.write(`${line}\n`);
        }

        return;
      }

      const surfaced = isolde.surfacePrompt(intake.operatorId, outcome.promptRequest);
      output.write("Isolde: Citadel needs clarification before production can begin.\n");

      const answers: string[] = [];

      for (let index = 0; index < surfaced.questions.length; index += 1) {
        const question = surfaced.questions[index];
        const answer = (await rl.question(`- ${question}\n> `)).trim();
        answers.push(
          index === 0
            ? `First concrete capability: ${answer}`
            : index === 1
              ? `Preferred flow: ${answer}`
              : `Clarification ${index + 1}: ${answer}`,
        );
      }

      intake = isolde.receiveClarification(intake, answers);
    }

    output.write("Isolde: Citadel still has unresolved questions after several passes.\n");
  } finally {
    rl.close();
  }
}

void main();
