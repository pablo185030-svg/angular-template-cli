## ADDED Requirements

### Requirement: Agent-neutral project guidance
Every generated project SHALL carry its agent instructions in `AGENTS.md`, a `CLAUDE.md` that only imports it, and its skills under `.agents/skills/`, each also exposed under `.claude/skills/`. The CLI SHALL NOT ask for the agent in use and SHALL NOT generate other tool-specific instruction files.

#### Scenario: Neutral layout
- **WHEN** a project is generated from either template
- **THEN** it contains `AGENTS.md` and a `CLAUDE.md` that imports it
- **AND** each skill under `.agents/skills/` is reachable under `.claude/skills/`

#### Scenario: Symlinks unavailable
- **WHEN** the file system does not allow creating the `.claude/skills/` links
- **THEN** the skill folder is copied there instead and generation succeeds

## MODIFIED Requirements

### Requirement: Optional official Angular skill
The CLI SHALL offer, for both the public website and the backoffice, to install the official Angular agent skill `angular-developer` (from https://github.com/angular/skills) into the generated project. The offer SHALL be skippable, and the skill MUST NOT be bundled in the templates.

#### Scenario: Accept in the wizard
- **WHEN** the user answers yes to the Angular skill question
- **THEN** the skill is installed in the generated project's `.agents/skills/` and exposed under `.claude/skills/`
- **AND** the generation step shows its progress and success

#### Scenario: Decline in the wizard
- **WHEN** the user answers no
- **THEN** nothing is downloaded and the generated project has no Angular skill

#### Scenario: Flags without a terminal
- **WHEN** the CLI runs with `--angular-skill` and no terminal
- **THEN** no question is asked and the skill is installed
- **AND** without the flag, or with `--no-angular-skill`, it is not installed

#### Scenario: Conflicting flags
- **WHEN** both `--angular-skill` and `--no-angular-skill` are given
- **THEN** the CLI exits with a non-zero status and writes nothing

### Requirement: Project rules take precedence over the Angular skill
The generated project's guidance SHALL state that the project's own `AGENTS.md` rules take precedence over the generic Angular skill.

#### Scenario: Precedence documented
- **WHEN** a project is generated from either template
- **THEN** its `AGENTS.md` states that its conventions override the Angular skill where they differ
