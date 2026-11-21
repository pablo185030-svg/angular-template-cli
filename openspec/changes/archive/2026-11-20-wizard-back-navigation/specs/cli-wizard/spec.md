## ADDED Requirements

### Requirement: Back navigation in the guided flow
In an interactive terminal the wizard SHALL let the user press Esc to return to the previous question and change its answer, and SHALL keep Ctrl+C as the way to exit. Going back SHALL skip questions that were not asked (answered by a flag or not applicable to the chosen app type) and SHALL offer the previous answer as the initial value. Pressing Esc on the first question SHALL leave the wizard on that question. The wizard SHALL tell the user which keys go back and which exit.

#### Scenario: Go back and change an answer
- **WHEN** the user answers the project name, then the location, and presses Esc on the next question
- **THEN** the location question is shown again with the previous answer as its initial value
- **AND** changing it and continuing uses the new value

#### Scenario: Back skips questions that were not asked
- **WHEN** the user generates a public website and presses Esc on the first question after the dark mode question
- **THEN** the dark mode question is shown, not the Keycloak or mock API questions

#### Scenario: Back over flag-provided answers
- **WHEN** the project name was given as a flag and the user presses Esc on the first asked question
- **THEN** the wizard stays on that question

#### Scenario: Ctrl+C still exits
- **WHEN** the user presses Ctrl+C on any question, including after going back
- **THEN** the CLI exits with a cancellation message and status 130 and writes nothing

#### Scenario: Keys hint
- **WHEN** a question is shown in the guided flow
- **THEN** a hint says that Esc goes back and Ctrl+C exits

#### Scenario: No change without a terminal
- **WHEN** the wizard runs without a terminal or with `--yes`
- **THEN** no question is asked and the resulting options are the same as before this requirement

### Requirement: Readable questions
In an interactive terminal the wizard SHALL wrap every question to the terminal width so that no part of its text is cut off, keeping the text of the question itself unchanged.

#### Scenario: Long question
- **WHEN** a question is longer than the terminal width
- **THEN** it is shown over several lines and all of its text is visible
