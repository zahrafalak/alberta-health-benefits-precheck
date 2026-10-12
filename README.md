# Alberta Health Benefits pre-check

An unofficial pre-check for the Alberta Child Health Benefit and the Alberta Adult Health Benefit. Answer a few questions and see, in plain language, whether you may qualify, why, and exactly what to send if you apply.

**Live:** https://alberta-health-benefits-precheck.vercel.app

[![CI](https://github.com/zahrafalak/alberta-health-benefits-precheck/actions/workflows/ci.yml/badge.svg)](https://github.com/zahrafalak/alberta-health-benefits-precheck/actions/workflows/ci.yml)

> This is a personal project, not a Government of Alberta service. It doesn't apply for you, and it never sends your answers anywhere. Always check the official program pages.

## The problem

In July 2024 the Alberta Ombudsman published [Programs Adrift](https://www.ombudsman.ab.ca/programs-adrift/), an investigation into these two programs. The summary report found that "there is no online version of the programs" and that "program technology is obsolete and ineffective", and recommended the programs "explain that ongoing costs are deducted from household income" and "give reasons for denying benefits".

Today you still apply with a fillable PDF (form AEHB3931) sent by email, mail or fax. To know whether it's worth applying, you have to read two long pages, find the right row in an income table, and work out your "calculated income" by hand.

## What it does

1. **Screener:** lives in Alberta, citizen or permanent resident, and not getting health benefits from Income Support, AISH or the federal Non-Insured Health Benefits program. Anyone who doesn't meet one sees why, with links to the program pages.
2. **Your household:** partner or not, number of children, and the conditions the Adult benefit requires (pregnant, high ongoing prescription drug needs, or leaving Income Support or AISH).
3. **Your income:** the amounts the programs use, with help text saying which tax line to find them on.
4. **Your result:** for each program, "You may qualify" or "You may not qualify" with the reason, for example "Your family income of $22,500 is within the limit of $26,023 for a single adult with 1 child." Then a checklist of what to send, built from the answers, and the contact centre's details.

What it doesn't do: decide anything (the program decides, using income the Canada Revenue Agency confirms), submit an application, or store answers anywhere but this browser. **Clear my answers** in the header removes them.

## Where the rules come from

Every rule is copied from the two program pages on alberta.ca, checked on the date in `CHECKED_ON`:

- [Alberta Child Health Benefit](https://www.alberta.ca/alberta-child-health-benefit)
- [Alberta Adult Health Benefit](https://www.alberta.ca/alberta-adult-health-benefit)

The income limits by family size, $4,973 for each child beyond four, the five-step income formula, the Adult conditions and the documents to send all live in `src/lib/health-benefits.ts`, with no React in it. When the pages change, update the numbers and `CHECKED_ON` together; the tests show what moved.

## How it's built

It starts from the Government of Alberta's [public form template](https://github.com/GovAlta/goa-public-form-playground) and uses the GoA Design System (`@abgov/react-components`), React, TypeScript and Vite.

```
src/
  lib/          The benefit rules (health-benefits.ts), the section registry, the
                application's state and validation. No React, the router or the
                design system in here or in a section's rules, and a test enforces it.
  sections/     One folder per section: eligibility, about-you (shown as "Your
                household") and income. Each has its rules, pages and summary.
  components/   Shared pieces the pages are built from: layout, form set, summaries,
                error summary, and the result page shell.
  routes/       Pages that span sections: the task list, review, result and guards.
  store/        Holds the answers and saves them in this browser.
e2e/            Browser smoke tests (Playwright).
scripts/        Checks that keep this README honest.
```

Changes from the template: the service is ours (name, questions, rules), the template's submit and reference-number confirmation are gone because nothing is submitted, and the result page (`src/routes/result-page.tsx`) works the answer out in the browser. Answers are saved only in this browser, by `src/store/persistence.ts`, so someone can close the tab and come back.

## Tests and CI

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright)
npm run build        # type-checks, then builds
```

- **Rules** (`src/lib/health-benefits.test.ts`): every row of both income tables, the extra-child amount, each step of the income formula, at / $1 below / $1 above the limit, every path through the result, and the document checklist. Breaking the code on purpose (for example `<=` to `<`) makes a test fail.
- **Questions** (`src/sections/eligibility/rules.test.ts`, `src/sections/about-you/rules.test.ts`, `src/sections/income/rules.test.ts`): the screener's branching, the household and Adult-condition answers, and amount parsing ("$18,500" becomes 18500).
- **Shape** (`src/lib/framework-neutral.test.ts`): the rules never import React or the design system.
- **README** (`scripts/readme.test.ts`): every file named here exists, and the page title matches the service name.

`.github/workflows/ci.yml` runs the tests and the build on every push and pull request. `main` is protected: a pull request merges only when CI is green. Vercel builds a preview for every pull request and deploys `main` to production; `vercel.json` sends every path to the app so deep links work on refresh. Each piece of work was a GitHub issue with acceptance criteria and its own branch and pull request.

## Accessibility

The design system components carry their own accessibility work. On top of that:

- **Keyboard only** (checked in Chrome): the tab order follows the page (logo, Clear my answers, tasks, buttons, footer links); a task opens with Enter; an answer is chosen with Space and Continue works with Enter.
- **Errors:** continuing without an answer shows "There is a problem" with what to fix, and moves focus to it so a screen reader announces it.
- **Plain language** throughout, and every amount says which tax line to find it on.

## How AI was used

I used Claude Code as a co-developer. I planned the work as GitHub issues, and for each one I reviewed the code, ran it in the browser, and wrote key tests myself: the boundary tests at the income limit, the screener tests, the test that a couple with two children at $40,000 may not qualify, and the document checklist tests. Every rule was checked against the alberta.ca pages, and nothing in this app calls an AI service. `AGENTS.md` sets the rules AI tools follow in this repository.

## Credits

Built on the Government of Alberta's public form template and design system, both public on GitHub. The template's own design notes are kept in `docs/design-notes.md`.
