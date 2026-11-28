import { defineConfig } from 'vitest/config';

// @coto-dev/ui-kit has historically been consumed via package managers/dependency
// types (a Yarn symlink to a sibling repo, an npm git dependency) that could
// resolve to a second, physically distinct copy of @angular/* instead of this
// app's own copy. Angular's DI/injection-context tracking lives in module-scoped
// state, so a duplicate copy fails `assertInInjectionContext` checks (NG0203)
// even though the component code is correct. `resolve.dedupe` forces Vite to
// always resolve these packages to the single copy in this project's
// node_modules, regardless of how the library is installed (currently the
// Nexus registry — see CLAUDE.md's "Design-system dependency" section — which
// npm extracts as a plain copy, not a symlink).
export default defineConfig({
  resolve: {
    dedupe: [
      '@angular/core',
      '@angular/common',
      '@angular/compiler',
      '@angular/platform-browser',
      '@angular/animations',
      '@angular/cdk',
      '@angular/material',
    ],
  },
});
