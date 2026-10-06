# Phase 1 acceptance evidence

## Latest integrated verification

Candidate `cc674d3` (including dependency update `72a7d57`): `npm run check` passed lint, TypeScript and 32 unit/store tests; `npm run test:e2e` built production and passed all 26 Chromium tests. `npm audit --omit=dev` again reported zero findings. No deployed or GitHub run is implied.

The integrated W500 event-to-write samples were 202.6, 43.3, 21.0, 32.9, 5.8 and 37.7 ms (median 35.3 ms); outfit save was 79.9 ms. These corroborate the focused observations below without proving full render latency or performance on other devices. Automated form associations, selection semantics and live-region checks pass. Actual screen-reader output and other browsers remain unverified.

**Acceptance disposition:** core local reliability and the implemented automated cases pass. Do not mark the entire roadmap or release complete: five high development-tool advisories remain unresolved upstream, load/search budgets and broader device coverage are not approved, and GitHub/deployment verification is still pending. The earlier audit and timing sections below are historical baseline evidence; use this section and `DEPENDENCY_REVIEW.md` for the latest status.

## Candidate and scope

Persistence implementation baseline: `c303d5b`. Parent verification ran `npm run check` and `npm run test:e2e`: lint and TypeScript passed, 32 unit/store tests passed, and 22 Chromium tests passed against the production build. This report is an acceptance audit, not a claim of production readiness. Full Phase 1 acceptance remains open for performance validation, remaining accessibility checks and dependency remediation.

## Acceptance matrix

| Cases | Evidence | Limits |
| --- | --- | --- |
| P1-01 | Existing manual-entry, search, favorites/reload workflow | Chromium desktop only. |
| P1-02 | Store cascades and new browser category deletion preserving unrelated records | Tested fixture combinations, not all possible graphs. |
| P1-03 | Store invalid-reference, duplicate outfit item, invalid plan and unchanged-byte tests | Validation is exercised directly at the store boundary. |
| P1-04 | Setup duplicates, blank/duplicate renames and retained drafts in browser | Existing same-name update is a safe UI no-op. |
| P1-05–06 | Unit leap-date/timezone tests and browser UTC/Los_Angeles/Tokyo hydration, midnight and draft tests | Historical dates deliberately allowed. |
| P1-07 | Legacy migration, malformed/future-version, invalid graph and raw-byte preservation tests | No automatic repair of invalid historical graphs. |
| P1-08 | Browser quota failures for create/edit/delete/favorite/restore, blocked reads; unit missing-lock and compare-before-write tests | No guarantee against older tabs running code that ignores Web Locks. |
| P1-09 | Export/restore round trip, explicit preview, invalid import and cancellation tests | Replacement, not merge; maximum import is 5 MiB. |
| P1-10 | Different-record and same-record stale-tab tests preserve the winning write | Conflict policy blocks/reloads; it does not merge edits. |
| P1-11 | W500 browser fixture and 501st-item rejection | Measurement collected; performance acceptance not established. |
| P1-12 | Keyboard item/outfit submission, required-field errors, Tab/Shift+Tab and item Escape/focus return | Automated error associations and announcement semantics pass; actual screen-reader output and cross-browser checks remain unverified. |

Executable evidence is in `tests/wardrobe-store.test.ts`, `tests/wardrobe-persistence.test.ts`, `tests/dates.test.ts`, and `tests/e2e/{workflows,planner,persistence,acceptance}.spec.ts`. Shared W1/W500 fixtures are in `tests/e2e/fixtures/wardrobe-fixtures.ts`.

## W500 measurement

Parent run: Chromium 153.0.8010.12, MacIntel platform, 1280×720 viewport, DPR 1, four reported logical processors, America/New_York timezone, two test workers. The emulated Desktop Chrome user-agent says Windows; this is not evidence of a Windows host. Fixture: 500 items, 50 outfits, 30 plans, approximately 132 KB serialized data.

| Operation | Observed wall-clock duration |
| --- | ---: |
| Cold route load to rendered count | 1,392 ms |
| Search to rendered result | 477 ms |
| Favorite click to observed persisted state | 2,262 ms |
| Reload to rendered count | 1,207 ms |

These are single-run end-to-end timings including Playwright actionability/polling and concurrent test load. They are not isolated storage timings or percentile measurements. The save observation exceeds one second, so it cannot substantiate the original save-latency goal. The test records measurements without a performance assertion; its green status only certifies the functional steps. Follow up with browser-side event-to-persistence instrumentation, repeated isolated runs, and separately approved load/search budgets before granting P1-11 acceptance.

## Follow-up: browser-side latency and error semantics

After the framework update in `72a7d57`, browser-side instrumentation measures from the actual input event timestamp to completion of `localStorage.setItem`, excluding Playwright actionability and polling. Parent focused verification on Chromium 153.0.8010.12 with W500 recorded six favorite-save samples: 150.3, 17.1, 37.4, 37.3, 5.8 and 5.7 ms (median 27.2 ms). One outfit save took 78.4 ms. Storage-write calls themselves took 0.3–0.7 ms for those item samples. These observations do not confirm a persistence bottleneck, so no speculative store optimization was applied.

This narrows the earlier 2.26-second observation: it was not a measurement of application persistence alone. Event-to-write completion does not measure subsequent rendering, full interaction readiness, item creation or performance on other devices. Load/search budgets and broader device measurements remain open.

Input errors now expose `aria-invalid` and `aria-describedby`; outfit selection has a named group, associated error and pressed states; notices use alert/status semantics. Four focused browser tests pass after review, alongside 32 unit/store tests and lint/TypeScript. The integrated suite passed 26 Chromium cases before the final small caller-ARIA/UTF-8-byte-count corrections; the affected four cases were rerun afterward. This verifies DOM semantics and keyboard behavior, not actual screen-reader output or every browser.

See [the dependency follow-up](DEPENDENCY_REVIEW.md) for the updated audit: zero reported production findings and five unresolved development-tool findings.

## Dependency review

`npm audit --json` on the baseline reports 19 vulnerable packages: 1 critical, 14 high, 3 moderate, and 1 low. These are registry advisory matches, not proof that each exploit is reachable in this application.

- `next` is pinned to 16.1.1. Audit proposes 16.3.8 as a fix; it must be checked for compatibility with React, deployment and the build pipeline before adoption.
- `postcss` and `sharp` are also reported high-severity through the Next.js dependency graph.
- Development tooling findings include `eslint-config-next`, glob/matching libraries, YAML parsing and other transitive dependencies. Audit proposes a major-version downgrade for some lint-tooling paths; do not apply `npm audit fix --force` blindly.
- The app has no custom rewrites, account middleware, Server Actions or image-upload workflow in its current source, which limits applicability of some listed advisories. It still runs a Next.js server; absence of these app features is not a blanket security clearance.

Recommended disposition: a separate coordinated framework/lint dependency update, followed by a fresh audit, clean installation, full tests, production build and deployment smoke checks. Keep the release blocked on resolving or explicitly accepting each applicable advisory.

Representative primary advisory references from the registry report:

- [Next.js HTTP deserialization denial of service](https://github.com/advisories/GHSA-h25m-26qc-wcjf)
- [Next.js Windows-hosted server remote code execution](https://github.com/advisories/GHSA-p293-qw3h-jr36)
- [Next.js AVIF image optimization remote code execution](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)
- [PostCSS source-map file disclosure](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)
- [sharp inherited image-library vulnerabilities](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)

No dependency versions were changed by this review.
