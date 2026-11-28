## MODIFIED Requirements

### Requirement: Agent instructions for web quality
The template's `AGENTS.md` SHALL contain an SEO, GEO and web-quality section with a per-page checklist covering route title and description, sitemap entry, a single `h1`, semantic landmarks, image rules, structured data and accessibility. It SHALL tell agents to use the SEO service instead of touching the document directly, and to run the audit skill before finishing a UI change. The template's `CLAUDE.md` SHALL only import `AGENTS.md`, so Claude Code reads the same instructions.

#### Scenario: Checklist present
- **WHEN** a project is generated from the website template
- **THEN** its `AGENTS.md` contains the web-quality section with the per-page checklist

#### Scenario: Claude Code reads the same instructions
- **WHEN** a project is generated from the website template
- **THEN** its `CLAUDE.md` contains an import of `AGENTS.md` and no instructions of its own

#### Scenario: Instructions stay in sync
- **WHEN** a rule in that section refers to a file, script or service
- **THEN** the referenced item exists in the template

### Requirement: Web quality review skill
The template SHALL ship a `web-quality-review` skill under `.agents/skills/` that audits the site against the checklist and reports findings by severity. It SHALL work without extra project dependencies, treat Lighthouse as optional and run on demand, and adapt to the project's rendering mode (SSR, SSG or SPA). `AGENTS.md` SHALL state that agents without skill support can read its `SKILL.md` as a plain audit guide.

#### Scenario: Skill is generated
- **WHEN** a project is generated with the wizard
- **THEN** the project contains `.agents/skills/web-quality-review/SKILL.md`
- **AND** `.claude/skills/web-quality-review/SKILL.md` resolves to the same content

#### Scenario: Audit without Lighthouse
- **WHEN** the skill runs and Lighthouse is not available
- **THEN** it still audits the checklist items from the source and the built output, and says which checks were skipped
