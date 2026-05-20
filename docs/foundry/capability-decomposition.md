# Capability Decomposition

## Purpose

Capability decomposition transforms raw intent into operational requirements.

Example:

```txt
User intent:
"Build a SaaS landing page."
```

The Foundry must infer:
- required specialists,
- operational phases,
- governance requirements,
- review gates,
- consequence tier.

## Core Flow

```txt
Intent
  -> Clarify Objective
    -> Infer Required Capabilities
      -> Select Specialists
        -> Build Operational Graph
          -> Attach Governance
            -> Execute
```

## Specialist Selection

Example decomposition:

```txt
Objective:
Launch SaaS homepage

Required specialists:
- Market Researcher
- Conversion Strategist
- UX Architect
- Visual Designer
- Frontend Builder
- Copy Reviewer
- Blackquill Conversion Audit
```

## Consequence Tiers

The Foundry must determine:

```txt
critical
important
routine
trivial
```

Higher tiers require:
- stronger verification,
- stronger review gates,
- independent reasoning paths,
- escalation sensitivity.

## Governance Attachment

The Foundry must determine:
- which AFW contracts apply,
- which review gates are required,
- which restoration semantics activate,
- which final dispositions are valid.

## Key Principle

The Foundry does not merely summon agents.

It constructs governed operational cognition.
