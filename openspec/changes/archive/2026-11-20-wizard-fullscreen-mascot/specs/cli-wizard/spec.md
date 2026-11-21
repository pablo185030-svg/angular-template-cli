## MODIFIED Requirements

### Requirement: Polished interactive experience
In an interactive terminal the CLI SHALL open full screen (alternate screen buffer) and restore the terminal when it ends, whatever the reason. It SHALL present a branded header with an animated pixel mascot, guided prompts with a selectable list for the app type, inline validation of the project name, a progress indicator for each generation step, and a styled final summary. The final summary SHALL remain visible in the terminal after the CLI exits.

#### Scenario: Guided flow
- **WHEN** the user runs the CLI in an interactive terminal without flags
- **THEN** the screen switches to full screen and a header with the mascot is shown, followed by the app type selection and the project name prompt
- **AND** each generation step shows progress and a success or failure state

#### Scenario: Animated mascot
- **WHEN** the CLI starts and while the generation steps run
- **THEN** the mascot is animated (for example blinking and moving its legs)

#### Scenario: Terminal restored
- **WHEN** the CLI finishes, fails, is cancelled or receives Ctrl+C
- **THEN** the terminal leaves full screen, the cursor is visible again and the previous terminal content is back

#### Scenario: Summary kept
- **WHEN** generation completes
- **THEN** the final summary with the next steps is printed in the normal terminal after leaving full screen

#### Scenario: Inline validation
- **WHEN** the user types an invalid project name at the prompt
- **THEN** the prompt shows why it is invalid and lets the user correct it without restarting

#### Scenario: Cancellation
- **WHEN** the user cancels a prompt with Ctrl+C
- **THEN** the CLI exits with a cancellation message and writes nothing

### Requirement: Mock API clarified as a mock
The wizard's mock API question SHALL state that it is only a mock and not a real API, and that the products ABM it supports is only a sample for testing. For a backoffice, the final summary SHALL also state that the products ABM is only a sample.

#### Scenario: Explanation
- **WHEN** the wizard asks whether to include the mock API
- **THEN** the question says it is only a mock, not a real API, that simulates the products API with sample data
- **AND** it says the products ABM is only a sample for testing

#### Scenario: Summary note
- **WHEN** a backoffice is generated
- **THEN** the final summary says the products ABM is only a sample that can be removed or replaced
