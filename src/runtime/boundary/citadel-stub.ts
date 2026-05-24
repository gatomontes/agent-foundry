import { CitadelAdapter } from "./citadel-adapter.js";

// Backward-compatible alias while the runtime transitions from a stub name
// to an adapter-facing Citadel boundary surface.
export class CitadelStub extends CitadelAdapter {}
