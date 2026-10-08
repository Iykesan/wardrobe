## Session 2 — outfit preview integration

- Added original procedural trousers template `wardrope.trousers` with waistband, joined legs and front seam. It is a generic silhouette, not a denim-fit claim.
- Expanded validated representation template IDs to T-shirt and trousers. Existing items can select either supported template without changing item IDs or inventory counts.
- Preview now loads saved outfits by their original outfit IDs, resolves top/bottom representations, displays both supported garments together, applies saved colors, and preserves front/side/back, orbit, zoom, reset, and visibility controls.
- Missing, unsupported, unmapped, and conflicting outfit items appear as visible preview notes instead of disappearing silently.
- Added browser coverage for saved top+trousers outfit preview and storage immutability.
- Visual checks: front/side/back preview screenshots are covered by the existing Chromium workflow; the saved combined outfit workflow passed. Formal visual-quality review of trousers fit remains approximate.
- Verification: `npm run check` passes 45 unit/store tests; full `npm run test:e2e` passes 38 Chromium tests. W500 measurements remain single-run upper bounds and are not FPS/memory evidence.
- Commits: `98eac49` trousers template; pending combined viewer integration commit.

## Remaining Session 2 priorities

- Improve the current trousers silhouette after screenshot review if clipping or proportion issues are found.
- Add explicit camera regression commit from the reviewed camera changes.
- Do not claim shoes, additional garments, avatar customization, or complete Phase 3/4 acceptance until implemented and visually verified.

## Session 2 — outfit resolution foundation

Starting checkpoint: `776abb4`, clean working tree. Added `src/features/preview/outfit-preview.ts` and `tests/outfit-preview.test.ts`.

- Resolves existing outfit and item IDs without writes or inventory duplication; preserves source record references.
- Reports missing outfits/items, unmapped items, unsupported templates, and same-slot conflicts. For conflicts, selects the first supported item in saved outfit order and reports every conflicting ID.
- Only templates in the caller's support list are eligible. Planned template names do not imply implemented geometry or tested compatibility.
- Twelve resolver cases pass, including deterministic resolution over 500 synthetic items. This is functional coverage, not a rendering benchmark.
- Parent verification: `npm run check` passed 45 tests plus lint/TypeScript; `npm run test:e2e` built production and passed 37 Chromium tests, including the separate pending camera correction.
- Added the first bottom template (`wardrope.trousers`) as original procedural geometry with a waistband, joined legs, front seam, neutral denim material, and manifest metadata.
- Default resolver support now includes T-shirt and trousers; other planned families remain unsupported until implemented.
- Verification: `npm run check` passes 45 unit/store tests. Full browser verification is pending after outfit UI integration.

## Session start

- Repository: Wardrope, local-only Next.js wardrobe with direct Three.js preview.
- Starting commit: `3b54166` (`fix: rebuild tshirt as connected garment mesh`), with the working tree containing an uncommitted cloth-simulation experiment in `src/features/preview/garments/tshirt.ts`, `src/features/preview/components/PreviewStudio.tsx`, and related browser tests.
- No push, deploy, destructive Git command, or credential change performed.
- Existing dependency: `three@0.186.1`; no React Three Fiber or physics engine.
- Existing mannequin: modular geometry in `src/features/preview/mannequin.ts`, with named body regions and unchanged geometry requirement.
- Existing viewer: direct Three.js canvas in `PreviewStudio.tsx`, orthographic camera, front/side/back presets, static render-on-change architecture.
- Existing local verification: `npm run check` and `npm run test:e2e`; 32 unit/store tests and 28 Chromium tests were recorded before this session.

## Plan

1. Replace the uncommitted cloth experiment with one static, connected T-shirt garment. Do not add physics.
2. Add reusable garment metadata/registry and lifecycle helpers without storing assets in wardrobe localStorage.
3. Add viewer camera orbit/zoom/reset and preserve front/side/back and show/hide controls.
4. Add optional wardrobe-item representation mapping only after the viewer/garment foundation is verified.
5. Run full checks and update roadmap evidence honestly. Continue only into independently supported roadmap work; do not invent assets, fit evidence, accounts, or research data.

## Current gaps found

- The committed T-shirt has no GLB/GLTF asset pipeline or license record, so no external asset is incorporated without source/license evidence.
- The uncommitted cloth prototype conflicts with the current static-shirt scope and must be replaced, not layered on top.
- No reusable garment manifest/registry exists.
- The viewer has preset rotation but no pointer orbit, zoom, or reset camera controls.
- No wardrobe-item-to-garment representation exists.
- Screen-reader/cross-browser checks, approved performance budgets, hosted release verification, and five development-only dependency advisories remain open from earlier work.

## Priority 1 — static T-shirt rebuild

- Replaced the previous lathed torso plus disconnected primitive pieces with a custom connected garment mesh in `src/features/preview/garments/tshirt.ts`.
- Kept the mannequin unchanged and preserved front/side/back and show/hide behavior.
- Removed the out-of-scope cloth experiment; no physics remains.
- Added integrated torso rings, hem, crew-neck opening, shoulder transition and angled sleeve geometry.
- Visual checks: Chromium front/side/back screenshot test passed. Latest screenshot review shows a continuous white garment with no obvious torso clipping; sleeve/neckline quality remains approximate and is not equivalent to a professionally authored GLB asset.
- Verification: `npm run check` passed (lint, TypeScript, 32 unit/store tests); focused T-shirt browser test passed. Full `npm run test:e2e` is still required before the milestone commit.
- Current changes are uncommitted pending full-suite verification.

## Priority 2 — garment manifest foundation

- Added `src/features/preview/garments/manifest.ts` with typed garment family, fidelity, source/license, avatar compatibility, supported views, and loading-budget metadata.
- Registered the original procedural T-shirt as `wardrope.tshirt`; no GLB/GLTF asset is claimed or loaded.
- Preview validates the shirt manifest against `wardrope-fashion-mannequin-v1` before attaching it.
- Added `tests/garments.test.ts`; total unit/store tests now pass: 33.
- No garment object, mesh, or binary is written to wardrobe localStorage.

## Priority 3 — viewer controls

- Added pointer drag orbit with bounded elevation and wheel zoom limited to 0.75–1.5.
- Preserved front/side/back presets and added a reset-camera control.
- Kept static render-on-change behavior; ordinary wardrobe pages do not initialize the viewer.
- Added browser coverage for orbit, zoom, reset, garment visibility, and wardrobe-state preservation.
- Verification: `npm run check` passes with 33 unit/store tests; focused viewer/browser checks pass.

## Priority 4 — optional wardrobe representation mapping

- Added optional `WardrobeItem.representation` metadata with a validated T-shirt template ID, fidelity, and preview color.
- Added an item-form control to add/remove the generic T-shirt representation.
- Existing wardrobe item IDs and inventory counts remain unchanged; representation metadata travels through the existing validated persistence and backup data.
- No Three.js objects, mesh data, binaries, or uploads are stored in localStorage.
- Added browser regression coverage for adding the representation and preserving one inventory item.
- Verification: `npm run check` passes with 33 unit/store tests; full `npm run test:e2e` passes 30 Chromium tests.

## Remaining autonomous work

- Preview now reads existing supported T-shirt representations by wardrobe item ID and applies saved color metadata without modifying storage. Added browser regression coverage for this workflow.
- Verification: full `npm run check` passes with 33 unit/store tests; full `npm run test:e2e` passes 31 Chromium tests.

## Remaining autonomous work

- Add explicit garment disposal/compatibility tests and update roadmap evidence.
- Outfit preview, avatar profiles, asset uploads, accounts, AI reconstruction, and cloth physics remain intentionally out of scope for this session.
