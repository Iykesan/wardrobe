# Dependency review follow-up

## Fresh audit after status reconciliation

Starting from `e0c2e1e`, a fresh audit reported six high findings: the five existing lint-tool findings plus `source-map-js@1.2.1` ([indexed source-map denial of service](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)). The new finding also appeared in `npm audit --omit=dev`.

Updated only the lockfile resolution for `source-map-js` from 1.2.1 to 1.2.2 using `npm update source-map-js --ignore-scripts`. No direct dependency versions or lint configuration changed. Fresh verification passed lint, TypeScript, 32 unit/store tests, the production build and all 26 Chromium tests. The post-update production audit reports zero findings; the full audit still reports five high findings on the braces chain.

`npm view braces version` still returns 3.0.3, which the audit marks affected. npm still proposes the breaking eslint-config-next downgrade described below. Historical Task #15 remains paused and unresolved for that upstream blocker; its completed framework update must not be repeated. No waiver, push, deployment or credential change was performed.

## Earlier framework update

The Phase 1 follow-up updates Next.js and eslint-config-next together from 16.1.1 to 16.3.8, and React/react-dom from 19.2.3 to 19.3.0. Compatible transitive fixes were applied with `npm audit fix`, without `--force`.

## Verification

After the update, `npm run check` passed lint, TypeScript and all 32 unit/store tests. `npm run test:e2e` built the production app and passed all 26 Chromium cases in the working tree (including concurrent accessibility/performance additions). `npm ci --ignore-scripts` also reproduced the lockfile installation; that command does not certify dependency lifecycle scripts. GitHub and deployed checks have not run.

## Audit outcome

- `npm audit --omit=dev`: **0 reported vulnerabilities** after the update.
- Full audit: **5 high-severity development dependency findings** remain on one chain: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`.
- Root advisory: [braces stack-exhaustion denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The registry marks all available braces versions affected in this audit.
- npm proposes downgrading eslint-config-next to 14.2.35 as a force-fix. That would desynchronize the framework and its lint configuration; it has not been applied.

The residual chain is used by development lint tooling, not installed by a production-only dependency install. Treat untrusted lint patterns and repository content as a development/CI risk. The findings are **unresolved**, not waived or fixed. Monitor upstream tooling patches; do not remove security checks, suppress audit output, or invent a patched version to obtain a green report.

A clean production audit is evidence about dependency advisories at the time of the run, not a comprehensive application-security assessment. Deployment smoke tests and GitHub verification remain separate release requirements.
