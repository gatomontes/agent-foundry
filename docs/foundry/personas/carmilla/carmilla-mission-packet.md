# Carmilla Mission Packet

## Purpose

The Carmilla Mission Packet defines the canonical structure used when assigning operational work to Carmilla.

The packet exists to:
- constrain ambiguity
- preserve operational clarity
- attach authority
- define expectations
- preserve continuity
- standardize repository and organizational work

Without a mission packet:
- work becomes conversational drift
- authority becomes ambiguous
- repo operations become unsafe
- escalation becomes inconsistent

---

# Governing Principle

```text
Carmilla operates through governed mission context.
```

Tasks involving:
- repositories
- persistent documentation
- operational memory
- external visibility
- organizational continuity

should eventually be mission-bound.

---

# Mission Packet Structure

```yaml
mission:
  id:

  objective:

  assigned_persona:
    Carmilla

  operational_role:

  repository:

  scope:

  authority:
    class:
    boundaries:

  constraints:

  expected_outputs:

  review:

  escalation_conditions:

  completion_requirements:
```

---

# Mission Components

## Objective

Defines:
- the operational goal
- expected outcome
- success condition

Objectives should remain:
- explicit
- bounded
- operationally meaningful

---

## Operational Role

Defines which Carmilla role is active.

Examples:

```text
Repository Steward
Correspondence Steward
Memory Steward
Operational Observer
```

---

## Repository

Defines:
- target repository
- operational location
- branch expectations
- repo scope

Example:

```yaml
repository:
  name: agent-foundry
  branch: main
  scope: docs-only
```

---

## Scope

Defines:
- what Carmilla may touch
- what is protected
- acceptable operational boundaries

Example:

```yaml
scope:
  allowed:
    - docs/foundry/

  forbidden:
    - src/runtime/
    - destructive-deletion
```

---

## Authority

Defines runtime authority.

Example:

```yaml
authority:
  class: execute-within-scope

  boundaries:
    - documentation-only
    - non-destructive
```

---

## Constraints

Operational constraints preserve doctrinal discipline.

Example:

```yaml
constraints:
  - markdown-first
  - inspect-repo-before-action
  - escalate-ambiguity
  - preserve-existing-structure
```

---

## Expected Outputs

Defines what Carmilla must return.

Example:

```yaml
expected_outputs:
  - created-files
  - updated-files
  - commit-hash
  - operational-summary
```

---

## Review

Defines review attachment.

Example:

```yaml
review:
  required:
    - blackquill-if-structural
```

---

## Escalation Conditions

Defines when Carmilla must halt and escalate.

Example:

```yaml
escalation_conditions:
  - ambiguous-file-placement
  - destructive-operation
  - conflicting-docs
  - insufficient-authority
```

---

## Completion Requirements

Defines mission completion conditions.

Example:

```yaml
completion_requirements:
  - push-successful
  - commit-reported
  - files-verified
```

---

# Example Mission Packet

```yaml
mission:
  id: foundry-doc-001

  objective:
    Create Carmilla repository stewardship protocol.

  assigned_persona:
    Carmilla

  operational_role:
    Repository Steward

  repository:
    name: agent-foundry
    branch: main
    scope: docs-only

  authority:
    class: execute-within-scope

  constraints:
    - markdown-first
    - preserve-existing-structure
    - escalate-ambiguity

  expected_outputs:
    - created-file
    - commit-hash

  review:
    required:
      - blackquill-if-structural

  escalation_conditions:
    - conflicting-existing-files
    - uncertain-location

  completion_requirements:
    - push-successful
```

---

# Governing Principle

The mission packet exists to transform:

```text
informal request
```

into:

```text
governed operational work
```
