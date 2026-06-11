# Foundry Runtime

This directory contains executable runtime primitives for The Foundry.

Phase 1 implements the control spine described in:

- `authority/`
- `delegation/`
- `state/`

Phase 2 adds:

- `professions/`
- `topology/`
- `staffing/`

Phase 3 boundary alignment adds:

- `boundary/`
- `examples/`
- `output/`

The initial runtime is intentionally small. It exists to transform doctrine into constrained, typed, inspectable software without pretending the full Foundry already exists.

Production-style runs now preserve append-only output history under:

`./output/{project-slug}/runs/{timestamp}-{packet}/`

and can emit:

- `mission-attestation.json`
- `execution-evidence.md`
- `output-manifest.sha256`
- `manifest-signature.json` when `FOUNDRY_MANIFEST_SECRET` is configured

The runtime resolves `FOUNDRY_MANIFEST_SECRET` from the live environment first, then from:

- `./.foundry.env`
- `./.env.local`

To inspect the current boundary flow from the terminal, run:

`npm.cmd run example`

To invoke the Foundry interactively through Isolde, run:

`npm.cmd run foundry`

Mission output should canonically land under:

`./output/{project-slug}/`

Carmilla proposes the mission-specific output structure when a governed production-ready packet arrives.
