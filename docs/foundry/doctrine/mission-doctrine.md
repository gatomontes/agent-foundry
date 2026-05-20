# Mission Doctrine

## Purpose

Mission Doctrine defines the canonical operational center of The Foundry.

The previous doctrine spine established:
- delegation as lawful operational motion
- execution authority as lawful operational power
- escalation as lawful operational state transition

However, all three doctrines reference an implicit object:

```text
mission
```

This document begins formalizing that object.

A mission is the container through which The Foundry transforms human intent into governed operational work.

---

# Governing Principle

```text
A mission is the canonical unit of governed synthetic operation.
```

All delegation, authority, escalation, review, topology, and disposition should eventually attach to a mission.

Without a canonical mission object:
- delegation becomes disconnected
- authority scope becomes ambiguous
- escalation lacks containment
- review gates float without jurisdiction
- runtime state cannot be resumed reliably

---

# Mission Philosophy

A mission exists to:
- preserve operational context
- define objective boundaries
- attach authority
- organize topology
- track state
- constrain delegation
- attach review gates
- preserve continuity
- produce disposition

A mission must NOT become:
- a vague task label
- an unbounded conversation thread
- a prompt wrapper
- an uncontrolled agent swarm
- an undocumented execution blob

---

# Draft Definition 1 — Operational Identity Persistence

## Definition

Operational identity persistence defines what allows an operational entity to remain identifiable across time, delegation, review, interruption, and recovery.

An operational entity is not merely:
- a name
- a persona
- a profession
- a prompt

An operational entity becomes persistent when it is bound to:
- mission context
- assigned role
- authority scope
- delegation lineage
- runtime state
- memory boundary
- review obligations

---

## Purpose

Operational identity persistence is required so The Foundry can answer:

```text
Who acted?
Under what authority?
For which mission?
From what context?
With what lineage?
With what state?
```

---

## Draft Identity Structure

```yaml
operational_identity:
  id:

  entity:
    name:
    kind:
    profession:
    persona:

  mission:
    id:
    role:

  authority:
    scope:
    class:

  lineage:
    parent:
    delegation_chain:

  state:
    current:
    last_transition:

  memory:
    visible:
    canonical_access:
    restricted_access:
```

---

## Identity Rule

```text
Profession defines capability.
Persona defines expression.
Mission role defines operational identity.
```

Example:

```text
Carmilla as Correspondence Steward in Mission A
```

is not identical to:

```text
Carmilla as Repository Steward in Mission B
```

They may share persona continuity, but they possess distinct operational identities.

---

## Runtime Implication

Operational identity persistence will eventually support:
- audit trails
- authority verification
- delegation lineage
- memory attribution
- recovery
- review accountability

---

# Draft Definition 2 — Canonical Mission Object

## Definition

A mission is the canonical object that binds objective, context, authority, topology, state, artifacts, review, escalation, and final disposition.

It is the primary runtime container for governed work.

---

## Mission Object

```yaml
mission:
  id:

  objective:
    statement:
    success_criteria:
    boundaries:

  origin:
    human_request:
    created_at:
    source:

  context:
    summary:
    artifacts:
    assumptions:
    constraints:

  authority:
    default_class:
    scope:
    approval_required:

  topology:
    operators:
    delegations:
    dependencies:
    review_gates:

  state:
    current:
    history:
    resumable:

  escalation:
    current:
    history:

  review:
    required:
    completed:
    unresolved:

  artifacts:
    produced:
    consumed:
    canonical:

  disposition:
    status:
    summary:
    unresolved:
    next_actions:
```

---

## Mission Requirements

Every mission should eventually define:
- objective
- scope
- authority
- topology
- state
- review requirements
- escalation semantics
- artifacts
- disposition criteria

---

## Mission Lifecycle

```text
Intent Intake
    ↓
Mission Creation
    ↓
Objective Clarification
    ↓
Authority Assignment
    ↓
Topology Assembly
    ↓
Delegation Dispatch
    ↓
Execution / Escalation
    ↓
Review Gates
    ↓
Disposition
    ↓
Archival / Recovery / Continuation
```

---

## Mission Rule

```text
No governed operation should execute outside a mission context.
```

Small direct answers may remain outside full mission runtime, but any delegated, mutable, reviewable, or persistent operation should be mission-bound.

---

## Runtime Implication

The mission object eventually maps toward:

```text
src/runtime/mission/
```

Potential runtime components:

```text
Mission
MissionState
MissionTopology
MissionDisposition
MissionArtifactRegistry
MissionAuthorityBinding
MissionReviewBinding
```

---

# Draft Definition 5 — Review Escalation Hierarchy

## Definition

Review Escalation Hierarchy defines how review authority, critique gates, human override, and reviewer disagreement are resolved inside a mission.

Review is not merely commentary.

Review is a governed mission function.

---

## Purpose

This definition exists to answer:

```text
Who can block execution?
Who can require revision?
Who can override review?
What happens when reviewers disagree?
```

---

## Review Authority Classes

```text
ADVISORY
REVISION_REQUIRED
BLOCKING
HUMAN_DECISION_REQUIRED
FINAL_OVERRIDE
```

---

## Draft Review Hierarchy

```text
1. Doctrine violation review
2. Authority violation review
3. Evidence / confidence review
4. Domain specialist review
5. Blackquill critique
6. Human decision / final override
```

---

## Review Semantics

## ADVISORY

May warn, recommend, or critique.

Does not halt execution.

---

## REVISION_REQUIRED

Requires revision before final disposition.

Execution may continue only if the mission explicitly permits partial continuation.

---

## BLOCKING

Halts execution until the blocking defect is resolved.

Examples:
- authority violation
- unsafe mutation
- unsupported critical claim
- missing required evidence
- doctrinal contradiction

---

## HUMAN_DECISION_REQUIRED

Escalates to the human when the system cannot lawfully choose.

Examples:
- strategic tradeoff
- risk acceptance
- destructive action
- reviewer disagreement

---

## FINAL_OVERRIDE

The human may override non-safety review blocks.

However, safety, legality, or platform-level prohibitions remain non-overridable by the mission runtime.

---

# Reviewer Disagreement

Reviewer disagreement should trigger:

```text
NEEDS_HUMAN_DECISION
```

unless a higher-priority doctrine clearly resolves the conflict.

---

# Blackquill Role

Blackquill may:
- expose contradictions
- degrade confidence
- require revision
- request escalation
- recommend blocking

Blackquill should not silently mutate mission state.

Its power should be attached through review gates, not hidden execution authority.

---

# Review Rule

```text
Review may halt execution only when the mission grants blocking authority or doctrine requires it.
```

---

# Runtime Implication

Review escalation hierarchy eventually maps toward:

```text
src/runtime/review/
src/runtime/mission/
```

Potential runtime components:

```text
ReviewGate
ReviewAuthority
ReviewEscalation
ReviewConflictResolver
MissionReviewBinding
```

---

# Mission Doctrine To-Do

The following Blackquill-identified deficiencies remain unresolved and should become future doctrine drafts.

---

## To-Do Definition 3 — Escalation Temporal Semantics

Need to define:
- escalation duration
- timeout behavior
- retry rules
- stale escalation detection
- abandonment rules
- automatic recovery attempts
- re-entry windows

Reason:

Escalation is already stateful, but not yet temporal.

---

## To-Do Definition 4 — Authority and Memory Linkage

Need to define:
- whether entities may retain memory after authority revocation
- memory visibility by authority scope
- sensitive memory invalidation
- mission-bound memory access
- canonical vs restricted memory
- memory purge or quarantine semantics

Reason:

Authority boundaries are incomplete unless memory visibility is governed.

---

## To-Do Definition 6 — Operational Cost Doctrine

Need to define:
- mission complexity scoring
- orchestration thresholds
- delegation cost
- review overhead
- recursion penalties
- direct-handling preference
- anti-bureaucracy controls

Reason:

Without cost pressure, The Foundry may over-orchestrate simple work.

---

# Doctrine Completion Standard

Mission Doctrine is not complete until it defines:
- canonical mission structure
- operational identity binding
- review hierarchy
- temporal escalation
- authority-memory linkage
- operational cost pressure
- runtime mapping
- failure modes
- examples

This draft completes initial definitions for:

```text
1. Operational Identity Persistence
2. Canonical Mission Object
5. Review Escalation Hierarchy
```

and records future work for:

```text
3. Escalation Temporal Semantics
4. Authority and Memory Linkage
6. Operational Cost Doctrine
```

---

# Governing Principle

The mission is the vessel.

Without it, operations drift.

With it, delegation, authority, escalation, review, and memory can become lawful parts of a governed synthetic institution.
