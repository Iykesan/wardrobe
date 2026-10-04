# Wardrobe.app

A single-user digital wardrobe for manually cataloging clothes, saving outfits, and planning what to wear. Data stays in this browser's local storage; there is no account, server database, or cross-device sync.

## Run locally

Use Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000/setup. No environment variables or Supabase credentials are needed. The existing deployment URL is https://wardrope-five.vercel.app/setup; it does not reflect local changes until redeployed.

## Data and scope

- Setup creates categories and subcategories, not clothing inventory.
- Add clothes manually, then select owned items to create outfits.
- Existing data uses the `wardrope-store` local-storage key. Its spelling is retained for compatibility.
- Existing items, including previously generated items, are not deleted by this refactor. Review and delete unwanted items yourself.
- Clearing browser/site data removes your wardrobe. Private browsing and browser storage limits can affect persistence. There is no export or recovery feature yet.
- Supabase API routes and automatic clothing/outfit generation have been removed. Data stored only in a remote database is not migrated by this change. Retain any existing database until you have backed up its data.

## Structure

- `src/app`: Next.js route entrypoints and root layout.
- `src/features`: wardrobe, outfits, planner, and setup screens, components, and hooks.
- `src/features/wardrobe/store`: shared persisted application state and data operations.
- `src/shared`: reusable UI, configuration, types, styles, and utilities.
- `tests`: automated store regression tests.
- `docs`: goals, acceptance criteria, and test plan.

See [the goals and test plan](docs/GOALS_AND_TEST_PLAN.md) for the active scope. `wardrobe_app_all_documentation.md` preserves the original product proposal; its Supabase and suggestion-related sections are not the current implementation contract.

## Checks

```bash
npm run check   # lint, route type generation, TypeScript, and regression tests
npm run build   # production build
npm run start   # serve the production build
```

Store tests are complemented by Chromium workflow tests:

```bash
npx playwright install chromium
npm run test:e2e
```

The browser suite builds and serves the production app on port 3100 with isolated browser contexts. It covers setup, manual clothing entry/editing/filtering, favorites and reloads, outfit editing, plan replacement/removal, deletion cleanup, keyboard dialog behavior, and retired API responses. It does not use your normal browser profile. Date edge cases, other browsers, storage failures, and 500-item performance remain unverified.

## Git and GitHub

Commit source, tests, documentation, configuration, and `package-lock.json`. Do not commit `.env.local`, `.pi/`, `node_modules/`, or `.next/`. The GitHub Actions workflow runs the checks and production build on pushes and pull requests. Local commits must still be pushed with working GitHub credentials before GitHub can run them.
