# Structured Operational Runtime — Skeleton

## Purpose

This document defines the missing runtime infrastructure required for The Foundry to transition from conceptual civilization architecture into governed operational software.

The current state of The Foundry is:

```text
Pre-runtime civilization architecture
```

The current ecosystem already possesses:
- operational philosophy
- governance concepts
- profession ontology
- critique philosophy
- markdown artifact workflows
- orchestration habits
- Blackquill methodologies
- Foundry assembly concepts

However, these currently exist primarily as:
- human cognition
- procedural habits
- prompt structures
- markdown conventions

The next stage is:

```text
Structured Operational Runtime
```

---

# Runtime Philosophy

The runtime layer must NOT become:
- uncontrolled autonomy
- swarm chaos
- giant prompts
- unrestricted agent execution
- opaque orchestration

The runtime layer exists to:
- operationalize doctrine
- enforce governance
- structure delegation
- preserve continuity
- constrain execution
- formalize topology
- track state
- attach critique
- preserve operational clarity

---

# Missing Runtime Infrastructure

---

# 1. Profession Runtime Model

## Purpose

Transforms professions from conceptual archetypes into executable operational entities.

## Current State

Professions currently exist only as conceptual doctrine.

Example:

```text
Knowledge Architect
Observer
Strategic Operator
Correspondence Steward
```

But they do not yet possess runtime structure.

---

## Required Runtime Structure

Each profession eventually requires:

```text
Profession
    identity
    purpose
    authority
    inputs
    outputs
    dependencies
    escalation rules
    execution semantics
    review requirements
    runtime constraints
```

---

## Proposed Runtime Manifest

```yaml
profession:
  id: knowledge-architect
  class: architect

  authority:
    level: propose_only

  accepts:
    - memory-topology-request
    - taxonomy-request

  outputs:
    - memory-map
    - taxonomy-plan

  escalation:
    - underconstrained
    - needs-human-decision

  review:
    required:
      - blackquill
```

---

## Proposed Directory

```text
src/runtime/professions/
```

---

# 2. Delegation Engine

## Purpose

Operationalize governed delegation.

---

## Required Capabilities

- delegation packets
- parent-child execution tracking
- dependency mapping
- recursive delegation control
- handoff semantics
- return/resume semantics
- escalation propagation

---

## Proposed Delegation Packet

```yaml
delegation:
  id: del-001

  parent:
    operator: strategic-operator

  child:
    operator: knowledge-architect

  objective:
    Design memory topology.

  constraints:
    - markdown-first
    - doctrine-compliant

  return_conditions:
    - success
    - blocked
    - needs-human-decision
```

---

## Proposed Directory

```text
src/runtime/delegation/
```

---

# 3. Persistent Operational Memory

## Purpose

Create continuity beyond individual execution sessions.

---

## Current State

Operational continuity currently exists primarily through:
- markdown artifacts
- GitHub repositories
- human memory
- conversational continuity

---

## Required Capabilities

- indexed retrieval
- canonical memory
- memory linkage
- project relationships
- memory conflict handling
- semantic retrieval
- operational observations
- archival management

---

## Proposed Layers

```text
working memory
canonical memory
archival memory
inferred memory
observational memory
```

---

## Proposed Directory

```text
src/runtime/memory/
```

---

# 4. Execution Boundary System

## Purpose

Constrain runtime authority.

---

## Required Capabilities

- permission scopes
- execution boundaries
- approval gates
- environment restrictions
- read-only enforcement
- draft-only enforcement
- mutable environment separation

---

## Proposed Authority Classes

```text
READ_ONLY
DRAFT_ONLY
PROPOSE_ONLY
EXECUTE_WITH_APPROVAL
EXECUTE_WITHIN_SCOPE
FORBIDDEN
```

---

## Proposed Directory

```text
src/runtime/authority/
```

---

# 5. Topology Runtime

## Purpose

Represent missions as governed operational graphs.

---

## Required Capabilities

- mission topology
- operator relationships
- dependency graphs
- execution sequencing
- review gate attachment
- runtime orchestration
- topology persistence

---

## Proposed Mission Graph

```text
Strategic Operator
    ↓
Knowledge Architect
    ↓
Blackquill Critic
    ↓
Disposition
```

---

## Proposed Directory

```text
src/runtime/topology/
```

---

# 6. Review Gate Runtime

## Purpose

Operationalize critique and governance enforcement.

---

## Required Capabilities

- mandatory review gates
- confidence degradation
- critique escalation
- contradiction detection
- approval semantics
- revision requirements

---

## Example

```yaml
review_gate:
  required:
    - blackquill

  pass_conditions:
    contradiction_count: 0
    evidence_grade: acceptable

  failure_action:
    request_revision
```

---

## Proposed Directory

```text
src/runtime/review/
```

---

# 7. Operational State Persistence

## Purpose

Preserve mission continuity across interruption and recovery.

---

## Required Capabilities

- mission state
- resumability
- restoration points
- execution snapshots
- partial completion tracking
- interruption handling
- recovery procedures

---

## Proposed State Model

```text
initialized
active
blocked
waiting-review
needs-human-decision
partial
completed
failed
archived
```

---

## Proposed Directory

```text
src/runtime/state/
```

---

# Structured Operational Runtime

## Runtime Goal

The runtime exists to transform:

```text
Conceptual governance
    ↓
Governed execution
```

The runtime is NOT intended to replace doctrine.

Doctrine remains:
- constitutional law
- governance source
- operational philosophy
- behavioral constraint system

The runtime merely operationalizes doctrine.

---

# Proposed Runtime Root Structure

```text
src/runtime/
    professions/
    delegation/
    memory/
    authority/
    topology/
    review/
    state/
```

---

# Recommended Initial Runtime Order

## Phase 1 — Control Spine

1. authority/
2. delegation/
3. state/

These define:
- who may act
- how work moves
- how continuity persists

---

## Phase 2 — Mission Structure

4. topology/
5. professions/

These define:
- operational assembly
- execution structure
- specialist runtime behavior

---

## Phase 3 — Governance Enforcement

6. review/

This operationalizes:
- Blackquill
- critique
- contradiction detection
- review gates

---

## Phase 4 — Continuity Engine

7. memory/

This becomes the foundation for:
- Carmilla
- institutional continuity
- organizational cognition

---

# Governing Principle

The Foundry runtime must remain:

```text
governed
constrained
observable
recoverable
reviewable
```

The goal is not unrestricted autonomy.

The goal is:
> governed synthetic operations.
