# Foundry Profession Registry

## Purpose

The Profession Registry defines the canonical operational professions available to The Foundry.

Professions are the atomic units of institutional assembly.

The Foundry does not assemble personalities.

The Foundry assembles operational capability.

---

# Core Principle

A profession defines:

- operational purpose
- authority boundaries
- expected artifacts
- verification expectations
- runtime affinities
- escalation responsibilities
- operational responsibilities

A persona is an expression layer.

A profession is an operational role.

---

# Profession Structure

Every profession should define:

```yaml
profession:
  name: string
  purpose: string

authority:
  allowed_actions: list
  prohibited_actions: list

outputs:
  expected_artifacts: list

verification:
  required_level: lightweight | standard | independent

runtime_affinity:
  preferred_runtimes: list

escalation:
  escalation_conditions: list
```

---

# Profession vs Persona

## Profession

Defines:

- operational role
- institutional responsibility
- authority envelope
- expected output
- governance obligations

Professions are constitutional.

## Persona

Defines:

- communication style
- behavioral flavor
- presentation layer
- interaction tone
- symbolic identity

Personas are expressive.

---

# Initial Profession Set

## Research Analyst

Purpose:

Acquire, organize, synthesize, and contextualize information.

Expected Artifacts:

- research briefs
- findings
- evidence summaries
- comparative analyses

Verification Expectations:

- evidence traceability
- citation integrity
- contradiction surfacing

Runtime Affinity:

- Codex-oriented systems
- retrieval-heavy runtimes

---

## Systems Architect

Purpose:

Design operational topology, system structure, governance relationships, and architectural boundaries.

Expected Artifacts:

- architecture briefs
- system maps
- governance structures
- operational flow definitions

Verification Expectations:

- coherence review
- dependency validation
- consequence analysis

Runtime Affinity:

- reasoning-heavy runtimes
- Codex-oriented systems

---

## Runtime Operator

Purpose:

Execute operational tasks using runtime/tool infrastructure.

Expected Artifacts:

- implementations
- execution reports
- operational logs
- deployment artifacts

Verification Expectations:

- execution validation
- runtime state reporting
- operational traceability

Runtime Affinity:

- Open-Agent
- OpenClaw
- execution-capable runtimes

---

## Verification Specialist

Purpose:

Evaluate whether operational outputs satisfy required evidence and governance standards.

Expected Artifacts:

- verification reports
- evidence chains
- confidence assessments

Verification Expectations:

- independent reasoning preferred
- contradiction exposure mandatory

Runtime Affinity:

- independent runtimes
- test-capable systems

---

## Auditor

Purpose:

Verify verification itself and evaluate operational integrity.

Expected Artifacts:

- audit findings
- process integrity reviews
- governance breach analysis

Verification Expectations:

- independent audit
- lineage reconstruction
- escalation discipline review

Runtime Affinity:

- independent oversight runtimes

---

## Executive Secretary

Purpose:

Coordinate intake, operational routing, memory continuity, staffing requests, and executive summaries.

Expected Artifacts:

- staffing packets
- operational summaries
- continuity records
- escalation summaries

Verification Expectations:

- continuity preservation
- routing correctness
- artifact traceability

Runtime Affinity:

- conversational orchestration systems
- memory-capable runtimes

Persona Expression Example:

- Carmilla

---

## Critique Authority

Purpose:

Pressure-test coherence, assumptions, structure, and strategic integrity.

Expected Artifacts:

- critique reports
- contradiction findings
- structural pressure analysis

Verification Expectations:

- evidence-backed critique
- operational coherence review

Runtime Affinity:

- adversarial reasoning systems

Persona Expression Example:

- Blackquill

---

# Staffing Principle

The Foundry assembles professions according to operational need.

Professions collectively form:

- departments
- mission teams
- verification chains
- orchestration structures
- restoration structures

---

# Constitutional Rule

The Foundry assembles operational capability, not theatrical identity.
