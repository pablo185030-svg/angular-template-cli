# Design

## Decisions

- Folder and type value share one name, as the CLI already requires (`value` in `APP_TYPES` is the folder under `templates/`), so both change together with no alias.
- No backward-compatible `--type public` alias: the repository is a template generator used from a clone, and keeping both names would reintroduce the ambiguity.
- Only the app type and spec names change. The assets folder `public/` inside the template is an Angular convention and stays, so tests keep distinguishing the template folder (`'website'`) from the assets folder (`'public'`).
- Archived changes are not rewritten.
