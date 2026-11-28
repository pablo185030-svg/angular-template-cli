# Proposal

## Why

The production domain question is a free-text prompt where pressing Enter on an empty value skips it. Nothing on screen offers "skip" as a choice, so users do not notice they can skip it.

## What Changes

- The wizard first asks, as a selectable list, whether to enter the domain now or skip it for now.
- Only when the user chooses to enter it, the text prompt for the domain is shown (validation unchanged).
- Leaving the text prompt empty still skips it.
- No flag, non-interactive or generated-project behavior changes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `cli-wizard`: the production domain question gains an explicit skip option; its wording requirement changes accordingly.

## Impact

- `cli/src/wizard.js`: new select step before the `siteUrl` text step.
- `cli/test/`: prompt lists gain one answer for the website flow; new test for the skip option.
