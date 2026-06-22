# The Foundry

The factory that turns cognition into action.

The Foundry is the production, persona-forging, and assembly layer for governed multi-agent work.

It receives governed packets from Citadel and converts them into:
- persona and worker-package forging,
- production initiation,
- specialist staffing activation,
- operational topology materialization,
- execution dispatch,
- continuity-preserving operator prompting through Isolde,
- governed return handling.

The current runtime now includes production-oriented output capabilities:
- append-only run folders under each mission output root,
- runtime initiation evidence attached at production start,
- machine-readable mission attestation artifacts,
- hash manifests for every run,
- optional HMAC-SHA256 manifest signatures when `FOUNDRY_MANIFEST_SECRET` is configured.

Repo-local secret configuration is supported through `.foundry.env` or `.env.local`.
`FOUNDRY_MANIFEST_SECRET` in either file will be used automatically by the runtime.

## Repository Name Note

The GitHub repository slug may still appear as `agent-foundry` for continuity and existing clone URLs.

The canonical domain name is **The Foundry**.

---

## Core Distinction

```txt
The Foundry forges and assembles cognition.
Citadel governs cognition.
The Pit stress-tests persona-candidates.
The Garrison houses admitted agents until summoned.
Armory grants bounded capabilities.
Blackquill audits cognition.
Carmilla preserves cognition.
```

The Foundry is not the governance substrate.
That is Citadel.

The Foundry is not the proving ground.
That is The Pit.

The Foundry is not the roster or barracks.
That is The Garrison.

The Foundry is not the critic or judge.
That is Blackquill and Citadel disposition.

The Foundry is not the archive.
That is Carmilla and Secretariat custody.

## Foundry Boundary: Isolde

Isolde belongs to the outer Foundry boundary, not to the Citadel.

She is the gentle help-desk clerk of The Foundry.

Her duties are limited:
- receive operator input,
- ask basic clarification questions when necessary,
- hand the request to Foundry Rook,
- return operator prompts and final results issued through Foundry Rook,
- return the final result to the operator.

Isolde is not a strategist, commander, critic, archivist, persona architect, or execution specialist.

All operator-agent communication should pass through Isolde.
The operator does not speak directly to internal Foundry components.
Internal Foundry components do not speak directly to the operator.

## Foundry Boundary: Rook

Foundry Rook is the Foundry-side production ingress boundary.

Its duties are:
- receive governed return packets from Citadel Rook,
- distinguish production initiation from operator re-prompt requirements,
- normalize production packets for internal Foundry runtime activation,
- hand operator prompt requests to Isolde,
- preserve boundary traceability between governance and production.

Foundry Rook does not determine governance law.
It activates governed work.

## Relationship To The Citadel

The Citadel is not internal to The Foundry.

The Citadel governs operational law through its own Rook boundary.

Citadel receives normalized requests through Citadel Rook and returns governed outcomes back across the wall, such as:
- a production order for Foundry to initiate,
- a persona-forging order for Foundry to materialize,
- an operator prompt request for Isolde to surface before production can continue,
- a return-to-Foundry order after Pit/Citadel review.

The Foundry consumes Citadel outputs.
It does not replace Citadel governance.

## Purpose

The Foundry exists to make abstract agent governance usable.

Humans do not naturally request:
- verification semantics,
- restoration protocols,
- escalation topology,
- epistemic governance.

Humans request outcomes:
- build a SaaS,
- review a pull request,
- launch a product,
- write a lyric,
- design a compliance workflow,
- investigate a security incident.

The Foundry translates governed mission intent into organized production capability.

## Foundry Flow

```txt
Operator Intent
  -> Isolde
    -> Foundry Rook
      -> Citadel Rook
        -> Citadel
          -> Citadel Rook Return Packet
            -> Foundry Rook
              -> either:
                 1. initiate production
                 2. forge persona / worker package
                 3. hand off operator prompt to Isolde
                 4. receive return-to-Foundry repair instruction
```

## Communication Rule

```txt
Operator <-> Isolde <-> Foundry Rook <-> Citadel Rook <-> Citadel
```

No internal Foundry component should bypass Isolde when communicating with the operator.
No production component should bypass Foundry Rook when consuming Citadel output.

## Reinforced Constraints

### Operational-First Doctrine

The Foundry must remain operationally tangible.

Doctrine without executable mission structure becomes abstraction.

### Boundary Discipline

Isolde owns operator communication.
Foundry Rook owns production ingress and operator re-prompt routing.
The Citadel owns governance planning and mission law.
The Pit owns persona-candidate stress testing and survival reporting.
The Garrison owns admitted-agent residence, readiness, and roster state.
Armory owns bounded capability grants.
Blackquill owns critique.
Carmilla preserves memory.
Operators own final human intent and accountability.
The Foundry owns personnel and worker-package forging.

No component should absorb another component's primary responsibility.

### Mission Blueprints

Concrete mission blueprints are required.

Recommended categories:
- SaaS
- Security
- Compliance
- Research
- Creative
- Product
- Payroll

Each blueprint should define:
- objective
- staffing
- operational flow
- governance attachment
- Pit requirement
- Garrison summonability requirements
- review gates
- disposition criteria

### Specialist Taxonomy Discipline

Specialists should follow:

```txt
core profession archetype
-> specialization
-> persona candidate
-> worker package
-> runtime implementation
```

Avoid uncontrolled profession proliferation.

### Mythologization Control

The gothic institutional identity reinforces the ecosystem.

It must never replace operational rigor.

Guiding principle:

```txt
cathedral, not cosplay
```

## Repository Direction

This repository should define:
- intake patterns,
- boundary packet schemas,
- persona-forging contracts,
- capability maps,
- specialist catalogs,
- assembly protocols,
- mission blueprints,
- topology templates,
- Citadel integration points,
- Pit stress-test integration points,
- Garrison admission and readiness handoff points,
- Blackquill review-gate attachments,
- Carmilla archival continuity points,
- Isolde communication boundary rules,
- Foundry Rook production doctrine,
- product/monetization concepts.

## Not a Prompt Library

The Foundry is not a prompt pile.

It is a cognitive assembly and forging system.

Its value is not that it can summon personas.

Its value is that it knows how to materialize governed orders into production, how to forge persona-candidates and worker packages under Citadel law, and how to route unresolved needs back to the operator without collapsing governance into implementation.
