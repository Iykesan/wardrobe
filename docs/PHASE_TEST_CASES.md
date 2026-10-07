# End-to-end roadmap test cases

## Scope and status

This catalogue covers the nine phases of the end-game roadmap. It complements [the current goals](GOALS_AND_TEST_PLAN.md) and [the avatar and 3D plan](AVATAR_AND_3D_WARDROBE_PLAN.md). These are actionable acceptance cases, not executable tests for features that do not exist yet.

**Default status: planned / not run.** Only the existing automated cases explicitly identified below have prior passing evidence. Re-run them for each release candidate; past success does not certify a later commit.

Phase mapping: roadmap phases 3–7 correspond to avatar-plan stages 0–4. Roadmap phases 8 and 9 separate the account and research work grouped in avatar-plan stage 5.

## Execution rules

- Use synthetic wardrobes, isolated browser profiles, and test accounts. Never clear a real wardrobe or upload a real person's measurements or photographs for testing without consent.
- Every run records case ID, commit, environment, fixture/asset versions, steps, expected and actual results, pass/fail/blocked status, and evidence link. A blocked test is not a pass.
- For each implemented feature, convert suitable cases into unit, integration, or Playwright tests. Human visual review and physical fit studies remain separate evidence.
- Do not add empty passing tests for future features. Keep planned cases here until there is a real implementation to exercise.
- Release gates require passing evidence for all applicable cases. Any deferred case needs an explicit scope decision; do not silently remove the requirement.

### Shared fixtures

| Fixture | Contents |
| --- | --- |
| W0 | Empty browser storage. |
| W1 | Two categories with subcategories; three owned items; a two-item outfit and a one-item outfit; one planned date for each outfit. Use stable IDs. |
| W500 | 500 synthetic items, 50 outfits, and 30 plans, including long names and notes. |
| WLegacy | A valid export of the pre-versioned `wardrope-store` shape, including optional fields and favorites. |
| WInvalid | Separate payloads with malformed JSON, wrong field types, duplicate IDs, missing references, unsupported future version, and oversized content. |
| A1 | Versioned neutral avatar and approved minimum/default/maximum body configurations; representative skin tones and hair variants. |
| G1 | Licensed top, bottom, and shoes plus missing, corrupt, incompatible, and oversized asset variants. |
| U2 | Two independent test users, A and B, with distinct wardrobes, profiles, and private assets. |

Store fixture definitions alongside executable tests when implemented. Device lists, numeric rendering budgets, supported ranges, conversion tolerances, and fit-accuracy thresholds must be approved and recorded before tests depending on them can pass.

## Phase 1 — Dependable wardrobe and recovery

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P1-01 / browser | Start with W0; complete category setup; add clothing with only required fields; edit it; filter/search; favorite and reload. | No clothes are seeded. Entered data and favorites persist; optional details are not invented. Existing partial coverage: `tests/e2e/workflows.spec.ts`, manual clothing test. |
| P1-02 / unit + browser | Use W1; remove one piece from the two-item outfit, then its last piece; separately remove its entire category. | Remaining pieces survive; empty outfits and their plans disappear; unrelated records stay unchanged. Store and Chromium item/category-deletion coverage exists; see the Phase 1 acceptance evidence. |
| P1-03 / unit | Attempt to save items with nonexistent/mismatched categories, outfits with missing/duplicate item IDs, and plans with nonexistent outfits. | Invalid writes are rejected with actionable errors; the prior state and persisted payload remain unchanged. |
| P1-04 / unit + browser | Create and rename categories/subcategories to whitespace-only and case/whitespace variants of existing names; include duplicate setup drafts. | Empty/duplicate names are rejected consistently; renaming to the same valid name is safe; failed edits preserve the draft for correction. |
| P1-05 / unit + browser | Schedule `2035-06-15` in UTC, America/Los_Angeles, and Asia/Tokyo; include valid leap day, invalid leap day, and an empty date. | Valid dates retain the same calendar day; invalid dates cannot be saved. Explicitly settle whether today/past dates are allowed, then test that policy. |
| P1-06 / browser | Save today's plan, reload directly on the planner, select another date, edit notes, and leave the page open across midnight using a controlled clock. | Editor and calendar agree after loading; unsaved drafts are not silently overwritten; today/upcoming dates refresh correctly. |
| P1-07 / integration | Load WLegacy, migrate it, reload twice, then attempt each WInvalid payload. | Migration preserves IDs, relationships and optional fields and is repeatable; invalid or newer unsupported data is not silently replaced. Show recovery/export options and retain original bytes where possible. |
| P1-08 / browser | Simulate blocked reads, denied writes and quota exhaustion; attempt create/edit/delete/favorite actions and reload. | No false saved confirmation; show persistent recovery guidance. Failed writes follow a documented rollback or explicit unsaved-state policy; existing saved data remains recoverable. |
| P1-09 / integration + browser | Export W1, restore into W0, compare all records; then import into a populated wardrobe and cancel confirmation. | Round-trip preserves data. Restore previews its effect and follows an explicit replace/merge policy; cancellation and invalid imports leave data unchanged. |
| P1-10 / browser | Open the same wardrobe in two tabs; edit different records, then the same record; refresh both. | No silent loss from stale whole-state writes. Synchronize safely or warn/block conflicts according to a documented policy. |
| P1-11 / performance | Load W500; measure cold load, filter/search, save, and reload on a recorded device/browser. | Meet the agreed targets; report timings and payload sizes. Verify a 501st item against an explicitly chosen limit policy rather than assuming the unused constant is enforced. |
| P1-12 / accessibility | Complete item/outfit forms using keyboard only; exercise errors, Tab/Shift+Tab, Escape and focus return. | Controls and errors have accessible names; focus stays in an open dialog and returns on close. Existing item-dialog coverage is partial, not a full accessibility audit. |

**Gate:** ordinary writes, date rules, invariants, migration, storage failure behavior, and backup/restore pass. No known silent-data-loss defect remains within the supported usage model.

## Phase 2 — Verified releases

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P2-01 / CI | On a clean runner, install from the lockfile, run lint/typecheck/unit/browser tests and build; deliberately submit a failing test on a disposable branch. | Valid candidate passes; failing candidate is blocked from the normal merge path. Record commit and run URL. |
| P2-02 / deployment | Deploy the accepted commit to a preview; verify build identity, setup, item creation, reload, outfit and planner flows. | Served version matches the intended commit; workflows pass on that origin. Local success alone is insufficient. |
| P2-03 / HTTP | Request retired bootstrap and mutation routes on the deployment using GET and former mutation methods. | Endpoints are absent and cannot read/write remote data. Existing tests cover local GET bootstrap and POST mutation paths only. |
| P2-04 / operational | Scan tracked files/build artifacts for secrets; review dependency advisories; rehearse rollback in a preview using a persisted-data fixture. | No exposed credentials; security findings have documented dispositions. Rollback does not destroy data written by a newer schema; incompatible downgrades fail safely. |

**Gate:** passing hosted checks, traceable deployment, smoke-test evidence, and a safe rollback procedure. GitHub authentication or hosting failures mean blocked, not complete.

## Phase 3 — 3D feasibility prototype (avatar stage 0)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P3-01 / visual + integration | Load A1 with G1 top/bottom/shoes; view front, back and sides at each supported body configuration. | Correct scale/orientation and attachments; documented clipping/deformation limits; each asset has a license and reproducible export recipe. |
| P3-02 / performance | Measure cold/warm loads, frame times and memory on named target devices; repeat 30 outfit switches and unload the viewer. | Record results and resource cleanup; use evidence to approve numeric budgets before production work. Unset budgets cannot produce a performance pass. |
| P3-03 / browser | Disable graphics support, interrupt model loading, and trigger graphics-context loss. | Visible fallback/retry; no blank blocking screen; ordinary wardrobe and planner remain usable. |
| P3-04 / network + product review | Open wardrobe without opening the viewer; inspect requests. Open the prototype and inspect its fidelity labels. | Heavy 3D assets are not loaded unnecessarily; prototype is labeled approximate and does not claim universal coverage or accurate fit. |

**Gate:** asset sourcing, supported body range and measured performance are feasible; limitations and production budgets are approved.

## Phase 4 — Avatar editor (avatar stage 1)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P4-01 / browser + visual | Change skin tone, hair style/texture/color, height and each supported proportion independently; save and reload. | Preview and saved configuration agree; changing one control does not reset unrelated attributes. Include bald/shaved options. |
| P4-02 / unit | Enter minimum, maximum, out-of-range, missing and nonnumeric values; convert cm to feet/inches and back repeatedly. | Supported boundaries work; invalid values are rejected; conversions stay within a predeclared tolerance with canonical storage units. Unspecified values are not represented as measured facts. |
| P4-03 / integration | Export/restore a profile; migrate an older model version; remove an asset; reset and delete the avatar. | Supported migrations preserve settings; incompatibility is explained; deletion leaves wardrobe/outfits intact and cleans dependent preview settings. |
| P4-04 / accessibility + privacy | Use the editor without photos, weight, gender or ethnicity fields; operate by keyboard; inspect network requests. | Optional personal details remain optional; independent controls are accessible; no measurements or likeness data are uploaded without consent. |

**Gate:** profile editing, validation, recovery and privacy checks pass across the supported model range.

## Phase 5 — Clothing representations (avatar stage 2)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P5-01 / browser + unit | Map a W1 item to a template; customize color/pattern/material and supported construction details; reload and remove the mapping. | Item ID/count and outfit membership do not change; representation settings persist and can be removed independently. |
| P5-02 / browser | Test generic, customized and item-specific representations; leave another item unmapped. | Fidelity labels remain accurate; ordinary entry/editing/planning works without a representation. Size labels are not shown as measured dimensions. |
| P5-03 / integration | Use missing/corrupt/incompatible G1 variants; retry after restoring an asset; upgrade its manifest version. | Clear errors and fallback; no lost item data; cache/version compatibility is handled deliberately, not by silently applying invalid parameters. |
| P5-04 / asset review | Inspect every accepted model's units, orientation, textures, body compatibility, provenance and export settings. | Manifest is complete; incompatible or unlicensed assets cannot enter the supported library. No binaries/textures are serialized into `localStorage`. |

**Gate:** mappings are optional, versioned and reversible; the supported template library passes asset review.

## Phase 6 — Outfit preview (avatar stage 3)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P6-01 / browser | Preview W1 outfits, change composition, then remove a referenced item while the viewer is open. | Viewer resolves current item IDs; no copied inventory or stale ghost clothing. Every current item is rendered or explicitly listed as unsupported. |
| P6-02 / visual + unit | Try supported and conflicting base/outer layers, hair with collars/hats, shoes and accessories at body-range boundaries. | Supported combinations meet the approved visual criteria; unsupported combinations receive specific feedback rather than silently intersecting or disappearing. |
| P6-03 / browser + accessibility | Rotate/zoom, choose front/side/back, reset, save/reload preview settings and use keyboard alternatives. | Predictable camera behavior; saved preview does not mutate outfit inventory; text item list and accessible controls remain available outside the canvas. |
| P6-04 / resilience + performance | Switch outfits 30 times, navigate away/back, interrupt assets and lose graphics context. | Meets Phase 3 budgets, disposes unused resources, and recovers without losing wardrobe data. No need to clear storage to reopen ordinary pages. |

**Gate:** correct inventory references, explicit compatibility feedback, usable controls, resilient loading, and agreed rendering budgets.

## Phase 7 — Coverage expansion (avatar stage 4)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P7-01 / asset matrix | For every new garment family, run minimum/default/maximum bodies through neutral front/side/back views and all declared supported layer combinations. | Each advertised combination has evidence; known conflicts are unsupported until fixed. A single successful screenshot does not establish family-wide support. |
| P7-02 / visual regression | Re-render approved scenes with fixed lighting/camera/pose after an asset or renderer update. | Review meaningful differences against versioned baselines; do not automatically accept new screenshots to hide regressions. |
| P7-03 / coverage audit | Preview a fixture containing at least one mapped and one unsupported example in each target family. | Report rendered/unsupported counts and reasons; denominator includes all outfit items. No blanket “all clothes supported” claim without corresponding evidence. |
| P7-04 / performance | Run the most complex supported layered outfit on target devices and slow-network settings. | Fits approved budgets or uses an explicit lower-detail/fallback mode; expanding assets does not degrade standard wardrobe pages. |

**Gate:** every newly advertised family passes the compatibility matrix and performance checks; unsupported coverage remains visible.

## Phase 8 — Accounts and synchronization (avatar stage 5, accounts)

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P8-01 / security integration | With U2, have B request A's item/profile/asset IDs through reads, writes, deletes and asset URLs; repeat unauthenticated and with expired sessions. | Server denies access independent of client-supplied IDs. Signed/private asset access cannot bypass ownership checks. |
| P8-02 / browser + security | Sign in/out, recover an account, expire a session mid-edit, then sign in as the other user in the same browser. | Correct recovery/error handling; cached private data does not leak between accounts; unfinished work is handled explicitly. |
| P8-03 / migration integration | Migrate WLegacy/W1 into an account; interrupt and retry; cancel before confirmation. | Existing local backup remains available; retries do not duplicate records; cancellation changes neither source nor destination unexpectedly. |
| P8-04 / multi-client integration | Edit from two devices, work offline and reconnect, and delete an item concurrently with an outfit edit. | Documented conflict policy preserves graph validity; deletions are not silently resurrected; conflicts are surfaced or resolved predictably. |
| P8-05 / operational + privacy | Export account data, delete account/assets, restore a server backup in a test environment and verify database migration failure/rollback. | Export is complete; deletion and backup retention match published policy; migrations do not expose data or leave partial ownership rules. |

**Gate:** authorization and account isolation pass before cloud profiles or uploads are released. Backup, migration and conflict behavior have integration evidence.

## Phase 9 — Higher-fidelity models and fit research

| ID / method | Setup and steps | Expected result |
| --- | --- | --- |
| P9-01 / security + resilience | If imports are implemented, submit valid models and files with wrong types, malformed structures, excessive textures/geometry and unapproved external references. | Enforce file/resource limits; reject unsafe inputs without executing content or fetching arbitrary resources; preserve user data. |
| P9-02 / research | Compare photo-assisted output with consented reference garments, including occluded surfaces, patterns and unusual cuts. | Report visible resemblance and unknown geometry separately; do not fabricate measured dimensions or assert exact reconstruction. |
| P9-03 / research benchmark | Use consented real body/garment measurements; predeclare fit metrics and thresholds; evaluate held-out body/garment combinations rather than only tuning examples. | Report errors, subgroup coverage and failure cases. Accurate-fit claims are blocked if thresholds or representative evidence are missing. |
| P9-04 / physical + visual benchmark | Compare simulated drape across measured fabrics and approved poses against physical references; stress simulation stability. | Report numerical/visual error and unsupported conditions; visually plausible rendering alone cannot pass a physical-accuracy claim. |
| P9-05 / privacy + product review | Exercise consent withdrawal, export/delete, and messaging for unavailable measurements or uncertain predictions. | Sensitive inputs follow published handling rules; uncertainty and approximate results are visible; no health or identity inference is presented as fact. |

**Gate:** enable each research capability separately. Fit prediction requires validated physical evidence; a graphics feature can ship as approximate without passing a fit-accuracy benchmark, provided its claims remain limited.

## Existing automated evidence

Phase 3 now has a procedural desktop silhouette studio for shirt, trousers and shoes. It supports front/side/back views and local color controls without changing wardrobe storage. It does not establish 3D model rendering, asset compatibility, mobile behavior, performance budgets, or fit claims.

Run existing checks with `npm run check` and `npm run test:e2e`. The browser command builds and starts the production app on its isolated test port. Install its browser with `npx playwright install chromium` first. Documentation-only changes do not require rerunning the application suite.

## Run record template

```text
Case ID:
Candidate commit:
Runner and date:
Browser/OS/device or service environment:
Fixture, model and asset versions:
Preconditions and approved limits:
Steps executed:
Expected result:
Actual result:
Status: pass | fail | blocked | not run
Evidence (test log, trace, screenshot or benchmark):
Defect or follow-up reference:
```
