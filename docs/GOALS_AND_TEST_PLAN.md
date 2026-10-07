# Goals and test plan

## Agreed direction

Deliver a local-only, single-user wardrobe that mirrors clothes the user actually owns. Users enter clothing manually, combine existing items into outfits, and plan outfits by date. Category defaults are allowed; automatic creation of clothing and generated outfits is not.

This plan supersedes conflicting scope in the original `wardrobe_app_all_documentation.md`, which remains as historical product context. Do not implement every future idea in that document as part of this refactor.

## Starting point

The last pre-refactor commit is `5f374c8`. It follows the feature-folder reorganization in `e482d52`. Core screens existed, but there were no tracked tests or database migrations. Remote routes trusted caller-supplied user IDs while using a service-role client. Local and remote writes could diverge. The current refactor removes that remote path rather than presenting it as secure or complete.

Keep the existing Next.js feature-oriented structure. Route files should compose screens; feature components should own their UI; the store should own cross-feature data operations. Extract shared code only when there is a concrete consumer or testability benefit.

## Milestones and acceptance criteria

| Milestone | Goal | Acceptance evidence | Status |
| --- | --- | --- | --- |
| 1. Reduce scope | Remove Supabase APIs, clients, dependency, and auto-add suggestions; preserve saved browser data. | No remote or suggestion imports in runtime source; production build succeeds; hydration regression passes with `wardrope-store`. | Implemented in this refactor; verify with the commands below. |
| 2. Protect data relationships | Category/item deletion must not leave empty outfits or plans pointing to removed outfits. Removing the last subcategory must reassign its items. | Automated store regression tests, including removal of a category containing multiple pieces of one outfit. | Automated coverage added. |
| 3. Verify user workflows | Complete setup, item editing, outfits, favorites, and planning with mouse and keyboard. | Browser checks below, ideally automated with Playwright. | Chromium coverage added for core flows and item-dialog keyboard behavior; remaining checks listed below. |
| 4. Improve local reliability | Handle unavailable/full storage visibly; validate persisted data; support a deliberate backup and restore workflow. | Tests for malformed data, quota failures, backups, and reloads. No silent data loss. | Implemented and locally verified; see the Phase 1 acceptance audit below for evidence and remaining limits. |
| 5. Release deliberately | Run checks in GitHub, review changes, and verify the deployed app before calling the release complete. | Passing GitHub Actions run and deployment smoke checks. | Blocked on GitHub authentication and push; deployment not verified. |

## Automated checks

[The phase-by-phase test catalogue](PHASE_TEST_CASES.md) defines cases and release gates for all nine roadmap phases, including the future avatar, 3D clothing, accounts, and fit-research work. Planned cases are not executable or passing evidence; the catalogue maps existing coverage separately.

Run `npm ci`, `npm run check`, and `npm run test:e2e` from the repository root. Install Chromium first with `npx playwright install chromium` (use `--with-deps` on Linux). The browser suite builds the production app before starting its isolated server. GitHub Actions runs these checks on Node.js 22.

The workflow covers P2-01 on GitHub when a push or pull request runs it. For local verification, use `npm run check` and `npm run test:e2e`. `npm run release:preflight` additionally runs both dependency audits and a tracked-secret pattern scan. A passing local preflight does not establish hosted checks, deployment identity, retired-route behavior on the deployment, or rollback safety.

`tests/wardrobe-store.test.ts` covers:

- Category defaults create no clothing or outfits.
- Manually added/edited clothing and item favorites survive rehydration.
- Removing a category removes plans for outfits whose multiple pieces were all removed.
- Item deletion preserves partially populated outfits and removes empty ones and their plans.
- Removing the last subcategory creates a replacement and reassigns clothing.
- Outfit favorites are persisted, scheduling twice on one date replaces the assignment, and outfit deletion removes its plans without deleting clothes.

These store tests use an in-memory implementation of browser storage. Separate persistence and browser suites cover storage failures and recovery; see the acceptance evidence for browser, accessibility and performance limits.

## Browser acceptance checklist

Use a separate browser profile or test origin. Do not clear a real wardrobe to run tests.

- [x] First visit redirects to setup. Choose defaults and confirm the wardrobe is empty.
- [x] Add an item with only name, category, and subcategory. Verify color is absent from saved data.
- [x] Edit its name/details, filter by category and subcategory, and search by name/color/notes.
- [x] Reload and confirm clothing and favorites remain.
- [x] Create and rename an outfit using existing items. Confirm the clothing count never increases.
- [x] Favorite an outfit, reload, and confirm the selection remains.
- [x] Schedule an outfit, update the same day's assignment, and remove it.
- [x] Delete items and confirm no orphaned plans or empty outfits remain.
- [x] Verify item-dialog initial focus, Tab containment, Escape, and focus restoration in Chromium. The shared modal now uses a native dialog with explicit Tab wrapping.
- [x] Exercise category deletion and changing outfit composition in Chromium.
- [x] Complete keyboard-only item/outfit form submission and automated error-association checks in Chromium.
- [ ] Verify actual screen-reader output and dialog behavior in other browsers.
- [x] Verify empty/invalid date handling and date display in UTC, America/Los_Angeles and Asia/Tokyo.
- [x] Collect isolated W500 fixture load/search/save observations and browser event-to-write samples; see the acceptance evidence.
- [ ] Approve load/search budgets and verify full interaction/render latency across the supported devices and browsers.
- [ ] On the deployed build, confirm retired `/api/bootstrap` and mutation routes no longer exist. Removing them locally does not secure an older deployment.

## Phase 1 implementation progress

First increment: domain writes now validate references, duplicate IDs, category/subcategory name uniqueness, nonempty outfits, unique outfit pieces, and one plan per valid calendar date. New additions are limited to 500 items; this is not a measured performance result. Calendar-date display uses local date-only parsing rather than UTC timestamp parsing. Today and past dates are permitted so historical plans remain editable. Forms retain drafts when these validations reject writes.

Verification for this increment: `npm run check` passed 11 unit/store tests plus lint and TypeScript; `npm run test:e2e` passed the four existing Chromium cases against a production build. New tests cover rejected invalid relationships/dates with unchanged saved bytes, duplicate renames, the 501st item, leap dates, and formatting in UTC, America/Los_Angeles and Asia/Tokyo. This is partial P1-03/P1-04/P1-05/P1-11 coverage, not full Phase 1 acceptance.

Planner follow-up: saved fields are derived from hydrated plan data until the user edits a draft; the upcoming calendar refreshes at midnight and on focus/visibility changes without replacing draft text. Added three browser cases for UTC, America/Los_Angeles and Asia/Tokyo covering saved fields, date labels, empty-date rejection, midnight refresh, and unsaved-draft preservation. Verification now passes 11 unit/store tests and seven Chromium tests.

Persistence increment: version 1 envelopes preserve the `wardrope-store` key; validated legacy data upgrades on its next write. Writes use Web Locks and exact loaded-byte comparison, and publish state only after persistence succeeds. Unsupported locking disables saving. Recovery preserves invalid/future-version bytes and provides their download. Setup offers JSON export, validated import preview, explicit replacement and cancellation. Imports are limited to 5 MiB. Recovery/reset also checks for concurrent changes. This protects cooperating current-version tabs, not older deployed code that ignores the lock protocol.

Verification: 32 unit/store tests and 13 Chromium tests passed, including malformed/future data, quota failures, blocked reads, backup round-trip/cancellation and stale-tab rejection. Full Phase 1 acceptance still needs the remaining mutation failure/browser cases, measured 500-item performance, and dependency review. Existing invalid legacy graphs are not auto-repaired; their original bytes remain available for recovery.

## Phase 1 acceptance audit

See [the acceptance evidence](PHASE_1_ACCEPTANCE.md) for P1-01 through P1-12 coverage, limits, dependency review and W500 measurements. Integrated verification of `cc674d3` passes 32 unit/store and 26 Chromium cases, lint, TypeScript and the production build. Precise browser event-to-write measurements do not confirm the earlier suspected persistence bottleneck: six W500 favorite saves were 5.8–202.6 ms, with an outfit save at 79.9 ms. These are not full render or cross-device latency measurements. Form error associations and announcement semantics now have automated coverage. Full phase/release acceptance remains qualified: screen-reader and cross-browser checks, load/search budgets and broader device coverage remain open. Production audit reports zero findings; five development-only upstream lint-tool advisories remain unresolved. See [dependency review](DEPENDENCY_REVIEW.md).

## Follow-up priorities

1. Complete actual screen-reader and cross-browser verification without repeating completed Chromium semantics checks as new implementation work.
2. Agree on load/search budgets and supported devices, then collect the missing performance evidence. Existing event-to-write measurements do not prove full render latency.
3. Preserve dependency audit Task #15 as paused and unresolved. Updates in `72a7d57` are complete; the last recorded blocker is five high development-tool findings on the braces chain. Check fresh advisory evidence before deciding whether further implementation is needed; do not force a lint-tool downgrade or waive findings silently.
4. Obtain user approval before pushing or deploying, then record GitHub and deployment evidence. The earlier authentication blocker has not been rechecked.
5. Consider authenticated cloud sync only as a separate project: verified user sessions, versioned database migrations, ownership constraints, transactional writes, and cross-user denial tests must come before deployment. Never trust a user ID supplied by the browser as authentication.

The fresh audit follow-up after `e0c2e1e` fixed an additional source-map-js advisory with a lockfile-only 1.2.2 update. Lint, TypeScript, 32 unit/store tests, the production build and 26 Chromium tests passed again; production audit returned to zero findings. The five high braces-chain findings persist, with latest braces still 3.0.3. Task #15 remains paused for that specific blocker, not for completed updates. See [dependency review](DEPENDENCY_REVIEW.md).

### Task-history reconciliation at `da65d11`

Saved task history in `.pi/tasks/` records Task #15 as in progress and paused after the dependency update; Task #16 (save timing and accessible errors, `cc674d3`) and Task #17 (integrated verification and evidence, `da65d11`) are completed. The unfinished status of Task #15 does not mean its completed dependency updates should be repeated. The audit results are historical, not a fresh registry check. No advisory waiver or full Phase 1/release approval is recorded. Keep the saved history local rather than creating a duplicate implementation plan.

## Planned expansion: personalized avatars and 3D clothing

See [the avatar and 3D wardrobe feature plan](AVATAR_AND_3D_WARDROBE_PLAN.md). The goal is a customizable avatar for each user, including skin tone, hair, height, and body proportions, with 3D representations of their clothing that can be combined into outfit previews.

The first Phase 3 increment adds a `/preview` entry point that intentionally loads no rendering engine or 3D assets. It documents the feasibility boundaries and links back to the existing wardrobe and outfit flows. This is a product-safety shell, not evidence that 3D rendering is implemented or that any fit claim is supported.

## Working with agents and Git

Use small changes with explicit acceptance checks. Record what changed, which checks passed, and what is still untested. Commit source and tests together with descriptive messages; do not mark unchecked milestones complete. Keep secrets and generated session files out of Git. Use a pull request for review and require checks on the protected branch once GitHub access is restored.

This workflow is informed by Anthropic's [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): incremental work, persistent progress context, descriptive commits, and end-to-end verification. The article describes an approach, not a mandatory folder structure or proof that unit tests are enough.
