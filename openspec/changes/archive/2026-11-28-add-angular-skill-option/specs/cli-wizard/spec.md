# Spec Delta

## ADDED Requirements

### Requirement: Optional official Angular skill
The CLI SHALL offer, for both the public website and the backoffice, to install the official Angular agent skill `angular-developer` (from https://github.com/angular/skills) into the generated project. The offer SHALL be skippable, and the skill MUST NOT be bundled in the templates.

#### Scenario: Accept in the wizard
- **WHEN** the user answers yes to the Angular skill question
- **THEN** the skill is installed in the generated project's `.claude/skills/`
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

### Requirement: Skill installation never breaks generation
A failure installing the Angular skill SHALL NOT fail the generation: the project MUST be kept, the step SHALL report a warning, and the final summary SHALL show the command to install the skill later.

#### Scenario: Installation fails
- **WHEN** the skill installation fails, for example without network access
- **THEN** the generated project is kept and the CLI exits successfully
- **AND** the summary shows `npx skills add https://github.com/angular/skills`

### Requirement: Project rules take precedence over the Angular skill
The generated project's guidance SHALL state that the project's own `CLAUDE.md` rules take precedence over the generic Angular skill.

#### Scenario: Precedence documented
- **WHEN** a project is generated from either template
- **THEN** its `CLAUDE.md` states that its conventions override the Angular skill where they differ
