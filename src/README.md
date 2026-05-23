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

To inspect the current boundary flow from the terminal, run:

`npm.cmd run example`

To invoke the Foundry interactively through Isolde, run:

`npm.cmd run foundry`

Mission output should canonically land under:

`./output/{project-slug}/`

Carmilla proposes the mission-specific output structure when a governed production-ready packet arrives.
