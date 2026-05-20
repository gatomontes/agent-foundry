# Delegation Doctrine

## Purpose

Delegation Doctrine defines how operational work moves through The Foundry.

It governs:
- operational transfer
- execution responsibility
- delegation authority
- recursive delegation
- escalation propagation
- resumption semantics
- operational continuity
- delegation constraints

Delegation is the spine of governed synthetic operations.

Without lawful delegation:
- topology collapses
- accountability dissolves
- recursion becomes chaotic
- orchestration drifts
- escalation becomes ambiguous

---

# Governing Principle

```text
Delegation transfers execution.
Delegation does NOT transfer accountability.
```

The parent operator remains responsible for:
- mission continuity
- doctrinal compliance
- topology integrity
- delegation appropriateness
- review attachment
- final disposition

The child operator becomes responsible for:
- execution within scope
- respecting constraints
- reporting status honestly
- escalating appropriately
- returning operational state

---

# Delegation Philosophy

Delegation exists to:
- decompose complexity
- isolate specialization
- preserve operational clarity
- constrain execution
- structure topology
- maintain governable cognition

Delegation must NOT become:
- uncontrolled recursion
- responsibility dumping
- orchestration theater
- synthetic bureaucracy
- arbitrary agent spawning

---

# Delegation Authority

Not all operational entities may delegate.

Delegation authority must be explicitly defined.

---

# Example Authority Model

```text
Observer:
    cannot delegate

Blackquill Critic:
    may request review escalation
    may not operationally delegate

Strategic Operator:
    may delegate operational work

Knowledge Architect:
    may delegate specialized sub-analysis
    within approved scope
```

---

# Delegation Conditions

Delegation should occur only when:

- specialization is required
- complexity exceeds direct handling
- operational decomposition improves clarity
- governance requires separation of concerns
- critique or verification independence is required

Delegation should NOT occur when:

- direct handling is sufficient
- decomposition increases confusion
- orchestration cost exceeds value
- recursive fragmentation is likely
- authority boundaries are unclear

---

# Delegation Package

The Delegation Package is the fundamental unit of operational transfer.

Every delegation event should eventually produce a structured package.

---

# Delegation Package Structure

```yaml
delegation:
  id:

  parent:
    operator:
    mission:

  child:
    operator:

  objective:

  context:

  constraints:

  authority:

  review:

  escalation_conditions:

  return_conditions:
```

---

# Required Delegation Components

## Parent

Defines:
- who delegated
- originating mission
- accountability owner

---

## Child

Defines:
- execution recipient
- operational role
- specialization target

---

## Objective

Defines:
- the desired outcome
- operational expectations
- completion criteria

Objectives must remain:
- explicit
- bounded
- operationally meaningful

---

## Context

Provides:
- supporting information
- dependencies
- relevant artifacts
- operational history

Context should prevent:
- redundant rediscovery
- hallucinated assumptions
- topology blindness

---

## Constraints

Defines:
- doctrinal limits
- runtime restrictions
- behavioral constraints
- execution boundaries

Example:

```yaml
constraints:
  - markdown-first
  - no-external-execution
  - doctrine-compliant
  - review-required
```

---

## Authority

Defines:
- execution permissions
- environment access
- operational scope
- approval requirements

Authority must never be inferred implicitly.

---

## Review

Defines:
- mandatory review gates
- critique attachment
- approval semantics

Example:

```yaml
review:
  required:
    - blackquill
```

---

## Escalation Conditions

Defines:
- when execution halts
- when uncertainty elevates
- when human intervention is required
- when recursion terminates

---

## Return Conditions

Defines:
- acceptable completion states
- resumption semantics
- parent continuation triggers

---

# Delegation Lifecycle

```text
Mission Intake
    ↓
Operational Decomposition
    ↓
Delegation Package Construction
    ↓
Delegation Dispatch
    ↓
Child Execution
    ↓
Escalation or Completion
    ↓
Return Package
    ↓
Parent Resumption
    ↓
Review Gates
    ↓
Disposition
```

---

# Responsibility Semantics

Delegation does not eliminate responsibility.

The parent operator remains accountable for:
- selecting the correct specialist
- delegation appropriateness
- mission continuity
- governance attachment
- review enforcement
- final synthesis

The child operator remains accountable for:
- execution integrity
- scope discipline
- honest reporting
- escalation correctness
- doctrinal compliance

---

# Recursive Delegation

Recursive delegation is permitted only under governed conditions.

Recursive delegation exists to:
- isolate sub-specialization
- reduce ambiguity
- preserve clarity

Recursive delegation must NOT become:
- infinite orchestration
- delegation cascades
- synthetic bureaucracy
- recursive fragmentation

---

# Recursive Delegation Rules

## Rule 1 — Explicit Permission

Child operators may delegate only if:
- delegation authority exists
- runtime scope permits it
- doctrine allows it

---

## Rule 2 — Accountability Retention

Each operator remains accountable for:
- delegation appropriateness
- child selection
- operational continuity

Responsibility chains must remain traceable.

---

## Rule 3 — Recursion Limits

The runtime should eventually enforce:
- delegation depth limits
- topology complexity limits
- orchestration thresholds

---

## Rule 4 — Escalation Preference

When recursion would increase confusion:

Prefer:
```text
escalation
```

over:

```text
additional delegation
```

---

# Resumption Semantics

After child completion, control returns to the parent operator.

The returning package should eventually include:

```yaml
return:
  status:
  outputs:
  unresolved:
  assumptions:
  escalation:
  confidence:
```

---

# Resumption Rule

The parent operator must:
- interpret results
- reconcile unresolved dependencies
- determine continuation
- attach review gates
- determine final disposition

Child operators do not finalize missions unless explicitly authorized.

---

# Delegation Statuses

Delegation outcomes should align with Escalation Doctrine.

---

# Standard Return States

```text
SUCCESS
BLOCKED
UNDERCONSTRAINED
NEEDS_HUMAN_DECISION
PARTIAL
FAILED
RECURSIVE
```

---

# Delegation Constraints

Delegation packages should support operational constraints.

Constraints may include:

```text
no-external-execution
markdown-first
read-only
review-required
restricted-scope
human-approval-required
```

Constraints must remain:
- explicit
- enforceable
- reviewable

---

# Delegation Review Attachment

Delegation should support mandatory governance attachment.

Example:

```yaml
review:
  required:
    - blackquill
```

Review requirements may include:
- critique
- evidence verification
- contradiction analysis
- approval gates
- security review

---

# Delegation Failure Modes

## Failure: Blind Delegation

Delegating without:
- context
- scope
- constraints
- review

Produces:
- hallucinated execution
- topology drift
- operational incoherence

---

## Failure: Delegation Cascades

Excessive recursive delegation creates:
- orchestration bloat
- accountability collapse
- mission fragmentation

---

## Failure: Hidden Authority Expansion

Delegation must never silently expand authority.

Authority expansion requires:
- explicit declaration
- governance approval
- runtime visibility

---

## Failure: Synthetic Bureaucracy

Delegation exists to improve clarity.

If delegation increases complexity without improving operational outcomes:

```text
direct handling is preferred
```

---

# Runtime Implications

Delegation Doctrine eventually enables:

- mission manifests
- governed topology graphs
- runtime orchestration
- state persistence
- resumable operations
- authority enforcement
- review gate attachment
- escalation propagation

---

# Future Runtime Mapping

This doctrine eventually maps into:

```text
src/runtime/delegation/
```

Potential runtime components:

```text
DelegationPacket
DelegationAuthority
DelegationLifecycle
DelegationState
DelegationReviewAttachment
DelegationConstraintResolver
```

---

# Governing Principle

The Foundry does not delegate to create the illusion of intelligence.

It delegates to:
- preserve operational clarity
- isolate specialization
- constrain execution
- maintain governance
- structure cognition lawfully

Delegation is therefore:
> governed operational motion.
