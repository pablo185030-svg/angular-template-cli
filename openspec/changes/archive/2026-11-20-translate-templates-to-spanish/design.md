## Context

Both templates hardcode English strings in HTML templates and a few TypeScript files (validation and error messages, dialog titles, the demo user name). Tests match on those strings. The ui-kit is Angular Material based, so `currency` and date pipes depend on the app locale.

## Goals / Non-Goals

**Goals:**
- Spanish UI text everywhere a user can see it, with a natural supermarket sample for the ABM.
- Keep the templates simple: no i18n framework.

**Non-Goals:**
- Multi-language support or runtime language switching.
- Translating code, comments, docs, routes or `data-testid`s.

## Decisions

- **Plain Spanish strings inline, no `@angular/localize`.** Templates are starting points; adding an i18n pipeline contradicts "templates must stay simple". Teams needing multiple languages can add it later.
- **Locale `es-AR`** registered via `registerLocaleData` and `{ provide: LOCALE_ID, useValue: 'es-AR' }` in `app.config.ts`, so `| currency` renders `$ 1.234,50`. The `currency` pipe is given `'ARS'` and `'symbol-narrow'` explicitly so the symbol is `$`. In the public template the locale is only needed if it formats values; skip it there if nothing is formatted.
- **Neutral Rioplatense-friendly wording** using impersonal or "vos"-free forms (e.g. "Nuevo producto", "Guardar") to stay natural without regional slang.
- **Sample products** (name, price in ARS, stock): Leche entera 1L, Pan lactal 400g, Yerba mate 1kg, Arroz largo fino 1kg, Aceite de girasol 900ml, Fideos tallarín 500g, Azúcar 1kg, Café molido 250g. Prices are plain illustrative numbers.
- **Demo user** name changes to a Spanish one ("Usuario demo"); the badge reads "Modo demo".
- **Mock API errors** (`Invalid product`, `Not found`) become Spanish since the form may surface them to the user.

## Risks / Trade-offs

- Tests are tied to literal strings → update them in the same change and run them per template.
- `es-AR` currency output uses a non-breaking space; assertions on prices must use a regex or `toContain` on the number rather than an exact string.
- The CLI replaces `coto-angular-template` in generated projects; Spanish copy that includes the placeholder (home title, footer) must keep the exact placeholder token.
