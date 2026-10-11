# Public form template

A complete, working government form you can fork and own. Built with the Government of Alberta Design System.

Somebody starts at a task list, answers an eligibility screener, works through three sections of questions, checks their answers, and submits. They get a reference number. If they close the tab partway through, their answers are still there when they come back. If they submit and then try to edit, the application is closed to them.

It is a real service in every way except three, which `docs/design-notes.md` explains: nothing is ever sent anywhere, uploaded files are kept by name and size only, and nobody is authenticated.

## Use this template

Click **Use this template** at the top of this repository. That gives you a fresh repository with no shared history: from that moment the code is yours, and nothing here will change under you.

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

```bash
npm run build        # type-checks, then builds
npm test             # unit tests
npm run test:e2e     # browser tests
```

## Where this template starts and stops

```
  Guidance page on alberta.ca                        NOT this template
  What the service is, who can apply, what
  you need, and a "Start now" button
                 |
                 v
  Sign in                                            NOT this template
                 |
                 v
  My applications                                    NOT this template, not built yet
  Continue one, or start a new one. Only
  needed if somebody can have more than one
                 |
                 v
  +---------------------------------------+
  |  Task list                            |          THIS TEMPLATE
  |  Eligibility screener                 |
  |  Question sections, each one ending   |
  |    on its own check answers page      |
  |  Check your answers, for the whole    |
  |    application                        |
  |  Submit, and the confirmation         |
  +---------------------------------------+
```

The guidance page lives on alberta.ca. Sign in is a platform concern, and nothing here authenticates anybody. My applications is yours to build, before the task list, if somebody can have more than one application in flight. Everything from the task list onward is the part that is the same shape in every service, and the hardest to get right.

## What is in here

```
src/
  sections/     One folder per section of the service: its rules (question
                order, branching, completeness, validation), its pages, and
                its summary for the review. Copy one to add a section.
  lib/          What the sections share and the service's shape: the section
                registry, the application's state, validation, formatting.
                Nothing in here or in a section's rules imports React, the
                router, or the design system, and a test enforces that.
  components/   Shared pieces the pages are built from: the page layout, the
                form set, the summary trio, the error summary, the item list,
                and the shell every task's check answers page is built on.
  routes/       The pages that span sections: the task list, the review and
                confirmation pages, and the route guards.
  store/        State, and the two seams a real service replaces.
e2e/            Browser tests. Yours to delete.
scripts/        Checks that keep this README honest.
```

The rules (`src/lib`, and each section's rules file) hold what the service *is*, and it would be the same service in Angular or Vue. Everything above them is one way of rendering that. When a rule seems to live in a page, it is usually in the wrong place.

## Adding a section

1. Copy a section folder, `src/sections/about-you` say, and rename it: its rules, its pages, and the summary shown on the review.
2. Add its answers to the application in `src/lib/form-state.ts`: a type, a field on the state, and a reducer action that saves it.
3. Register it in `src/lib/sections.ts`, which puts it on the task list and decides when it is unlocked and when it is complete.
4. Add its routes in `src/index.tsx`, inside the guards, and its summary to `src/routes/review-page.tsx`.

The compiler finds the rest.

## The first things to change

The service's identity ships as a placeholder and its substance ships realistic. The questions, branching, validation and review page are real, because that is what makes the template worth reading; the parts that name the service are bracketed, so nobody can deploy it by accident and have it look like a real government service. A plausible name survives into production. A bracket cannot.

| What | Where | Ships as |
| --- | --- | --- |
| The service name | `src/lib/service.ts` and the `<title>` in `index.html` | `[Service name]` |
| Contact details on the result pages | `src/components/results-page.tsx` | Bracketed placeholders |
| The declaration above the submit button | `src/routes/review-page.tsx` | A bracketed placeholder |
| The reference number prefix | `src/store/submission.ts` | `ABC` |

The reference number is generated in the browser so the confirmation page has something real on it. In your service it comes back from your backend.

## Starting empty, and clearing answers

A new visitor starts on an empty form. Answers are saved only in this browser as they are entered, so somebody can close the tab and come back. **Clear my answers** in the header removes them, for example on a shared computer.

## The two seams

`src/store/persistence.ts` holds part-finished applications and `src/store/submission.ts` is the moment the application leaves the browser. Both are `async`, so a backend fits as they are. Neither handles failure, and a real service must: surface a failed save, and put the catch for a failed submit in `src/routes/review-page.tsx`, because what somebody sees then is a design decision about your service. Local storage is a stand-in, not a recommendation: a part-finished application is personal information, and where it lives is for your service and your privacy reviewers to decide.

## Deploying

This fork deploys on Vercel, which is connected to the GitHub repository: every pull request gets its own preview URL, and merging to `main` deploys production. `.github/workflows/ci.yml` runs the unit tests and the type-checked build on every push and pull request, and `main` only accepts pull requests whose CI check is green.

The app is served from the root, so `VITE_BASE_PATH` is left unset. `vercel.json` rewrites unknown paths to `index.html`, so deep links load on refresh with a normal 200 status.

## Tests

Unit tests sit beside what they test in `src/lib`, `src/sections` and `src/store`. The browser suite, `e2e/smoke.spec.ts`, is one file covering the wiring bugs a template ships while its unit tests are green: answers leaking between pages, a draft lost on refresh, an error summary that does not take focus, routes a submitted application can still reach. It is yours to delete, with `playwright.config.ts` and the `test:e2e` script. Tests here assert the contract a fork keeps, never a value a fork changes: the reference number tests check the shape, not the `ABC` prefix.

## Custom CSS

The component library allows no custom CSS. A service needs some, for layout, rhythm and states like `:hover` that a style attribute cannot express. The rule, in `src/index.css`: GoA custom properties for values, your own class names for scope, and never a component's internals.

## Keeping dependencies current

The `@abgov` packages are on caret ranges with a committed lockfile, so `npm update` stays on stable within the current majors. Versions live in `package.json` and are not repeated here, because a version in a README goes stale silently.

## How this README is kept honest

`scripts/readme.test.ts` runs with `npm test` and fails when the files and folders named here stop existing, a folder under `src/` goes unmentioned, or the `<title>` in `index.html` stops matching `SERVICE_NAME`. It checks names, not sentences, so somebody still has to read this.
