## ADDED Requirements

### Requirement: Spanish user-facing text
The public template SHALL render all user-visible text in Spanish, including navigation, page titles and bodies, the footer, the not-found page and accessible labels, and SHALL declare `lang="es"` on the document. Code, identifiers, routes and `data-testid` values SHALL remain in English.

#### Scenario: Spanish navigation and pages
- **WHEN** the user opens the home, about or an unknown page
- **THEN** the header links, headings, body text, footer and not-found page are displayed in Spanish

#### Scenario: Document language
- **WHEN** the application HTML is served
- **THEN** the `html` element has `lang="es"`
