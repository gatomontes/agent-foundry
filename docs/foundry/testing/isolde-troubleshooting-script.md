# Isolde Troubleshooting Scripts

Use these scripts manually with:

```powershell
npm.cmd run foundry
```

The current interactive shell behaves best when used directly in the terminal rather than through piped stdin.

## Script A: Force Clarification First

This script is designed to trigger Citadel clarification in the current stubbed chain and then allow production to continue after answers are supplied.

### Initial Task

```text
Help me start a SaaS system, but I have not decided the first capability yet.
```

### Initial Notes

```text
Scope is still exploratory. I want the smallest coherent first implementation slice.
```

### Expected Clarification Questions

The current chain should ask for:

```text
What is the first concrete SaaS capability that should be implemented?
Should the first runtime pass optimize for rapid prototype or verification-heavy flow?
```

### Recommended Answers

```text
Runtime shell scaffolding with Isolde -> Foundry Rook -> Citadel handoff preserved.
rapid prototype
```

### Expected Behavior

- Isolde welcomes the operator.
- Isolde forwards the request into the chain.
- Citadel returns a clarification request.
- Isolde surfaces the questions.
- After answers are given, Citadel returns a production order.
- Isolde reports mission activation and ordered topology.

## Script B: Go Straight To Production

This script is designed to skip clarification and trigger direct production initiation.

### Initial Task

```text
Build the initial governed SaaS runtime shell.
```

### Initial Notes

```text
Keep the first pass minimal and preserve artifact lineage.
```

### Expected Behavior

- Isolde welcomes the operator.
- Isolde forwards the request into the chain.
- Citadel returns a governed production order immediately.
- Isolde reports mission activation and ordered topology.

## Why These Work

The current `CitadelStub` issues clarification when the operator task indicates the first capability is still undecided.

Once Isolde captures answers labeled as:

- `First concrete capability: ...`
- `Preferred flow: ...`

the stub treats the clarification as satisfied and returns a production order.
