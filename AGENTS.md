# Working in this repository (for AI coding tools)

This is an unofficial pre-check for the Alberta Child and Adult Health Benefits. Read `README.md` first.

## Rules

- **Every rule comes from alberta.ca.** Income limits, the income formula, conditions and documents are copied from the two program pages linked in `src/lib/health-benefits.ts`. Never invent or estimate a figure or a requirement. If a page changes, update the value and `CHECKED_ON` together, and say which page and section it came from in the pull request.
- **Use the pages' own wording** for anything a person reads about the rules. If wording is ours, keep it plain and don't add conditions the pages don't state.
- **Rules stay framework-neutral.** `src/lib` and each section's `rules.ts` never import React, the router or the design system (`src/lib/framework-neutral.test.ts` enforces it). Pages render; rules decide.
- **Nothing leaves the browser.** No analytics, no backend calls, no AI or other API keys. Answers are personal information.
- **Use the GoA Design System** (`@abgov/react-components`) for UI, not custom components or CSS beyond the layout rules in `src/index.css`.
- **Tests with every change to a rule.** Test the edges (exactly at a limit, the smallest case that triggers a rule), then break the code on purpose to confirm a test fails. Restore from a copy of the file, not `git checkout`, so uncommitted work isn't lost.
- **One issue, one branch, one pull request.** `main` is protected and merges only when CI (`npm test` and `npm run build`) is green. Never force-push or rewrite `main`.
- **Keep the README true.** `scripts/readme.test.ts` fails when a file it names stops existing.

## Before you open a pull request

```bash
npm test
npm run build
```

Check the change in the browser (`npm run dev`), including keyboard-only use.
