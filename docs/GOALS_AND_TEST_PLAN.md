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
| 3. Verify user workflows | Complete setup, item editing, outfits, favorites, and planning with mouse and keyboard. | Browser checks below, ideally automated with Playwright. | Pending browser validation. |
| 4. Improve local reliability | Handle unavailable/full storage visibly; validate persisted data; support a deliberate backup and restore workflow. | Tests for malformed data, quota failures, backups, and reloads. No silent data loss. | Planned, not implemented. |
| 5. Release deliberately | Run checks in GitHub, review changes, and verify the deployed app before calling the release complete. | Passing GitHub Actions run and deployment smoke checks. | Blocked on GitHub authentication and push; deployment not verified. |

## Automated checks

Run `npm ci`, `npm run check`, and `npm run build` from the repository root. GitHub Actions runs the same checks on Node.js 22.

`tests/wardrobe-store.test.ts` covers:

- Category defaults create no clothing or outfits.
- Manually added/edited clothing and item favorites survive rehydration.
- Removing a category removes plans for outfits whose multiple pieces were all removed.
- Item deletion preserves partially populated outfits and removes empty ones and their plans.
- Removing the last subcategory creates a replacement and reassigns clothing.
- Outfit favorites are persisted, scheduling twice on one date replaces the assignment, and outfit deletion removes its plans without deleting clothes.

These tests use an in-memory implementation of browser storage. They do not establish browser rendering, keyboard accessibility, storage-quota handling, or 500-item performance.

## Browser acceptance checklist

Use a separate browser profile or test origin. Do not clear a real wardrobe to run tests.

- [ ] First visit redirects to setup. Choose defaults and confirm the wardrobe is empty.
- [ ] Add an item with only name, category, and subcategory. Optional fields remain blank unless entered.
- [ ] Edit its name/details, filter by category and subcategory, and search by name/color/notes.
- [ ] Reload and confirm clothing and favorites remain.
- [ ] Create and edit an outfit using existing items. Confirm the clothing count never increases.
- [ ] Favorite an outfit, reload, and confirm the selection remains.
- [ ] Schedule an outfit, replace the same day's assignment, and remove it.
- [ ] Delete items/categories and confirm no orphaned plans or empty outfits remain.
- [ ] Navigate forms and dialogs using only the keyboard; check focus placement, trapping, restoration, and Escape. The existing modal needs an accessibility review before this can pass.
- [ ] Verify empty/invalid date handling and date display in positive and negative UTC offsets. Date validation and date-only parsing need follow-up work.
- [ ] Populate 500 items in an isolated test profile and measure listing, filtering, and saving. Record device/browser and timings; the original performance targets are not yet verified.
- [ ] On the deployed build, confirm retired `/api/bootstrap` and mutation routes no longer exist. Removing them locally does not secure an older deployment.

## Follow-up priorities

1. Finish browser automation for the critical workflows before expanding features.
2. Fix date-only parsing, invalid date submission, dialog accessibility, duplicate category naming, and error feedback with reproducing tests.
3. Design explicit backup/restore before claiming local storage is a durable backup.
4. Review dependency audit findings and update compatible packages in a dedicated change, with the same checks. The initial install reported vulnerabilities; a passing build is not a security audit.
5. Consider authenticated cloud sync only as a separate project: verified user sessions, versioned database migrations, ownership constraints, transactional writes, and cross-user denial tests must come before deployment. Never trust a user ID supplied by the browser as authentication.

## Working with agents and Git

Use small changes with explicit acceptance checks. Record what changed, which checks passed, and what is still untested. Commit source and tests together with descriptive messages; do not mark unchecked milestones complete. Keep secrets and generated session files out of Git. Use a pull request for review and require checks on the protected branch once GitHub access is restored.

This workflow is informed by Anthropic's [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): incremental work, persistent progress context, descriptive commits, and end-to-end verification. The article describes an approach, not a mandatory folder structure or proof that unit tests are enough.
