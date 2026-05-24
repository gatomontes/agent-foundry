import { runFoundryRookExample } from "./usage.js";

const summary = await runFoundryRookExample();

console.log(JSON.stringify(summary, null, 2));
