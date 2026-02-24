# AGENTS.md

## Cursor Cloud specific instructions

This is a **Raycast Extension** (TypeScript/React) for browsing Bhagavad Gita quotes. It uses the `@raycast/api` framework and the `ray` CLI for building/linting.

### Key commands

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Build | `npm run build` (runs `ray build -e dist`) |
| Lint | `npm run lint` (runs `ray lint`) |
| Fix lint | `npm run fix-lint` (runs `ray lint --fix`) |
| TypeScript check | `npx tsc --noEmit` |
| Dev (macOS only) | `npm run dev` (runs `ray develop`) |

### Non-obvious caveats

- **Raycast is macOS-only**: The `npm run dev` command (`ray develop`) requires the Raycast desktop app on macOS. On Linux VMs, you can only build, lint, and type-check — not run the extension interactively.
- **ESLint config missing**: The repo does not include an `.eslintrc.json`. The `ray lint` command will fail on the ESLint step. ESLint requires a config like `{ "root": true, "extends": ["@raycast"] }` referencing the `@raycast/eslint-config` devDependency.
- **No automated test suite**: There are no test files or test scripts. Validation is limited to `npm run build` and `npx tsc --noEmit`.
- **External API dependency**: The extension fetches data from `https://vedicscriptures.github.io/` (free, no auth). An optional RapidAPI source requires an API key configured in Raycast preferences.
- **Single source file**: All extension logic lives in `src/index.tsx`.
