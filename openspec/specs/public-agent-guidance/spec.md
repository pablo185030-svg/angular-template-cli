# public-agent-guidance Specification

## Purpose

Ensures AI coding agents working in a project generated from the public template follow its SEO, GEO and web-quality rules, through concise project instructions and an on-demand audit skill that ship with every generated project.

## Requirements

### Requirement: Agent instructions for web quality
The template's `CLAUDE.md` SHALL contain an SEO, GEO and web-quality section with a per-page checklist covering route title and description, sitemap entry, a single `h1`, semantic landmarks, image rules, structured data and accessibility. It SHALL tell agents to use the SEO service instead of touching the document directly, and to run the audit skill before finishing a UI change.

#### Scenario: Checklist present
- **WHEN** a project is generated from the public template
- **THEN** its `CLAUDE.md` contains the web-quality section with the per-page checklist

#### Scenario: Instructions stay in sync
- **WHEN** a rule in that section refers to a file, script or service
- **THEN** the referenced item exists in the template

### Requirement: Web quality review skill
The template SHALL ship a `web-quality-review` skill under `.claude/skills/` that audits the site against the checklist and reports findings by severity. It SHALL work without extra project dependencies, treat Lighthouse as optional and run on demand, and adapt to the project's rendering mode (SSR, SSG or SPA).

#### Scenario: Skill is generated
- **WHEN** a project is generated with the wizard
- **THEN** the project contains `.claude/skills/web-quality-review/SKILL.md`

#### Scenario: Audit without Lighthouse
- **WHEN** the skill runs and Lighthouse is not available
- **THEN** it still audits the checklist items from the source and the built output, and says which checks were skipped

### Requirement: Guardrails are executable
Every checklist rule that can be checked mechanically SHALL be enforced by a unit test, an end-to-end test or a lint rule that runs in the regular commands, so that agent compliance does not depend on the instructions alone.

#### Scenario: Rule violated
- **WHEN** a change adds a route without a description, a sitemap entry, or an accessible name
- **THEN** a test or lint command fails
