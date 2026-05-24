# Foundry Output Layer

This directory is the canonical output root for mission-specific production artifacts.

Expected pattern:

```text
./output/{project-slug}/
```

Inside each project directory, artifacts should live directly in the root with stage-prefixed filenames such as:

```text
./output/{project-slug}/00-intake-mission.md
./output/{project-slug}/05-critique-critique-report.md
./output/{project-slug}/09-scribe-output-manifest.sha256
```

The precise artifact set inside each project directory is proposed by Carmilla and should reflect:

- mission objective
- production template
- continuity requirements
- verification needs
- review and archive expectations

This root exists to keep output artifacts separate from:

- doctrine in `./docs`
- runtime code in `./src`
- staffing or mission blueprints in their source directories

The goal is orderly operational memory for produced work.
