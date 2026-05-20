# Missing Doctrine Categories

## Purpose

This document identifies the doctrine categories still required for The Foundry to become operationally constrained, governable, and extensible.

The current Foundry doctrine establishes the civilization model:

```text
Doctrine
    ↓
Professions
    ↓
Personas
```

However, structural doctrine alone is not sufficient.

A mature doctrine layer must define how the system behaves under delegation, uncertainty, execution, memory, critique, failure, and recovery.

---

# Current Doctrine State

The Foundry currently has early structural doctrine covering:

- Foundry as human-facing assembly layer
- separation between Foundry, AFW, and Blackquill
- profession/persona distinction
- personnel architecture
- Carmilla as a forged persona assembled from professions

This is foundational, but incomplete.

The missing categories below should become first-class doctrine files under:

```text
docs/foundry/doctrine/
```

Implementation and runtime execution should live separately under:

```text
src/
```

---

# 1. Delegation Doctrine

## Purpose

Defines when and how work may be delegated from one operational entity to another.

## Required Questions

- When may an operator delegate?
- Who may delegate?
- Who may receive delegated work?
- What information must be included in a delegation package?
- Can delegation recurse?
- What limits recursive delegation?
- Who retains responsibility after delegation?
- How are dependencies tracked?
- How does control return to the parent operator?

## Required Concepts

- delegation package
- parent operator
- child operator
- delegation boundary
- resumption condition
- recursive depth limit
- handoff status

## Priority

Critical.

Delegation is the spine of The Foundry.

---

# 2. Execution Authority Doctrine

## Purpose

Defines which entities may act, which may only advise, and which actions require human approval.

## Required Questions

- Who may execute changes?
- Who is read-only?
- Who may draft but not send?
- Who may modify repositories?
- Who may touch infrastructure?
- Which actions require approval?
- Which actions are forbidden?
- Which environments are mutable?

## Example Authority Classes

```text
READ_ONLY
DRAFT_ONLY
PROPOSE_ONLY
EXECUTE_WITH_APPROVAL
EXECUTE_WITHIN_SCOPE
FORBIDDEN
```

## Example Assignments

```text
Observer: READ_ONLY
Blackquill Critic: PROPOSE_ONLY
Correspondence Steward: DRAFT_ONLY
Infrastructure Operator: EXECUTE_WITH_APPROVAL
Repository Steward: EXECUTE_WITHIN_SCOPE
```

## Priority

Critical.

Without authority boundaries, every agent becomes dangerously omnipotent.

---

# 3. Evidence Doctrine

## Purpose

Defines what counts as evidence, how claims are supported, and how confidence is assigned.

## Required Questions

- What qualifies as evidence?
- What is weak evidence?
- What is unverifiable?
- When must a claim be reproduced?
- When must uncertainty be elevated?
- What evidence is required for execution?
- What evidence is required for critique?
- How are screenshots, logs, code, citations, and user statements weighted?

## Required Concepts

- evidence grade
- confidence level
- claim support
- unverifiable claim
- reproduction requirement
- source quality
- evidence dossier

## Priority

Critical.

Evidence doctrine is essential for SecOps, compliance, payroll, code review, and Blackquill critique.

---

# 4. Escalation Doctrine

## Purpose

Defines operational state transitions when work cannot proceed normally.

## Required Statuses

```text
SUCCESS
BLOCKED
UNDERCONSTRAINED
NEEDS_HUMAN_DECISION
IMPOSSIBLE
RECURSIVE
PARTIAL
FAILED
```

## Required Questions

- When does work become blocked?
- What qualifies as underconstrained?
- When must the human decide?
- When is something impossible?
- When is partial completion acceptable?
- What information must accompany each status?
- Who receives escalations?

## Priority

Critical.

Escalation statuses are not labels. They are operational state transitions.

---

# 5. Critique Doctrine

## Purpose

Defines how review and adversarial evaluation operate.

## Required Questions

- When is critique required?
- What intensity of critique is appropriate?
- What can Blackquill block?
- What can Blackquill only warn about?
- What constitutes a fatal flaw?
- What constitutes acceptable risk?
- When does critique trigger revision?
- When does critique trigger escalation?

## Required Concepts

- critique intensity
- contradiction threshold
- fatal flaw
- risk classification
- review gate
- confidence degradation
- revision requirement

## Priority

High.

Critique must be structural, not decorative.

---

# 6. Memory Doctrine

## Purpose

Defines how organizational memory is captured, preserved, updated, and invalidated.

## Required Questions

- What gets remembered?
- What is temporary?
- What is canonical?
- What is inferred?
- What expires?
- What requires explicit archival?
- What is private?
- What can be shared across personas?
- How are contradictions resolved?
- How is stale memory detected?

## Required Concepts

- canonical memory
- working memory
- inferred memory
- archived memory
- stale memory
- memory conflict
- retention rule
- privacy boundary

## Priority

High.

This is essential for Carmilla.

---

# 7. Identity Doctrine

## Purpose

Defines what a persona is and how persona stability is preserved.

## Required Questions

- What defines a persona?
- Which traits are immutable?
- Which traits are stylistic?
- Which traits are operational?
- May professions change persona behavior?
- How does a persona avoid drift?
- When can a persona be revised?
- What is the relationship between persona, profession, and doctrine?

## Required Concepts

- persona core
- temperament
- speech doctrine
- operational identity
- stylistic identity
- drift detection
- revision gate

## Priority

High.

Without identity doctrine, personas decay into generic assistant behavior.

---

# 8. Recovery Doctrine

## Purpose

Defines how the system resumes after interruption, failure, or incomplete execution.

## Required Questions

- What happens after failure?
- What is resumable?
- What is terminal?
- What state must be preserved?
- How is an interrupted operation resumed?
- How is partial work reported?
- How are failed assumptions corrected?
- What is the restoration procedure after tool failure?

## Required Concepts

- recovery point
- resumable state
- terminal failure
- partial artifact
- restoration procedure
- failure report
- rollback requirement

## Priority

High.

Recovery doctrine gives the civilization resilience.

---

# 9. Anti-Delusion Doctrine

## Purpose

Defines how the system avoids hallucinated certainty, false coherence, and unsupported claims.

## Required Questions

- When must confidence degrade?
- When must assumptions be labeled?
- When must research be performed?
- When must the system admit uncertainty?
- What claims are forbidden without evidence?
- How are contradictions surfaced?
- How does Blackquill enforce anti-delusion behavior?

## Required Concepts

- assumption label
- confidence degradation
- unsupported claim
- uncertainty elevation
- contradiction surfacing
- hallucination risk

## Priority

High.

This is one of the core defenses against synthetic nonsense.

---

# 10. Operational Economy Doctrine

## Purpose

Defines when orchestration is justified and when direct execution is preferable.

## Required Questions

- When is a specialist needed?
- When is a full mission topology overkill?
- When should the Foundry answer directly?
- How are cognitive costs controlled?
- How is profession proliferation prevented?
- How are reusable specialists preferred over new ones?

## Required Concepts

- orchestration threshold
- cognitive cost
- direct handling
- topology overhead
- profession proliferation
- mission complexity score

## Priority

Medium.

This prevents orchestration bloat.

---

# Recommended Doctrine File Structure

```text
docs/foundry/doctrine/
    missing-doctrine-categories.md
    delegation-doctrine.md
    execution-authority-doctrine.md
    evidence-doctrine.md
    escalation-doctrine.md
    critique-doctrine.md
    memory-doctrine.md
    identity-doctrine.md
    recovery-doctrine.md
    anti-delusion-doctrine.md
    operational-economy-doctrine.md
```

---

# Recommended Development Order

## Phase 1 — Spine

1. Delegation Doctrine
2. Execution Authority Doctrine
3. Escalation Doctrine

These define control, authority, and state transitions.

## Phase 2 — Trust

4. Evidence Doctrine
5. Critique Doctrine
6. Anti-Delusion Doctrine

These define truth, review, and confidence.

## Phase 3 — Continuity

7. Memory Doctrine
8. Recovery Doctrine
9. Identity Doctrine

These define persistence, resilience, and persona stability.

## Phase 4 — Efficiency

10. Operational Economy Doctrine

This prevents unnecessary complexity.

---

# Doctrine Completion Standard

A doctrine category is not complete merely because it has prose.

Each doctrine file should eventually define:

- purpose
- scope
- entities governed
- allowed behaviors
- forbidden behaviors
- state transitions
- required inputs
- required outputs
- escalation triggers
- examples
- failure modes
- review criteria

Doctrine becomes useful only when it constrains behavior.

---

# Governing Principle

The Foundry is not a prompt pile.

It is a cognitive assembly system.

Its doctrine layer must therefore function as constitutional law for synthetic operations.
