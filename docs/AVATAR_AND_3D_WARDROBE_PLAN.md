# Personalized avatars and 3D wardrobe plan

## Status and goal

**Status: planned, not implemented.** This is a future product milestone, not a replacement for the local-only reliability work in [the goals and test plan](GOALS_AND_TEST_PLAN.md).

Give each user a customizable avatar and a 3D representation of their clothing, so they can assemble outfits and inspect how colors, shapes, proportions, and layers look together on their avatar. The long-term goal is coverage of every clothing item in their wardrobe, including footwear and accessories.

The first release will provide an **approximate visual preview**, not a promise of real-world sizing, comfort, or fit. Accurate fit and fabric drape require garment dimensions, construction details, fabric properties, and validated body measurements. A generic model recolored to resemble an item must not be presented as an exact reconstruction.

## User experience

1. Create or customize an avatar. Start with a neutral default; personal attributes are optional and editable.
2. Add clothing through the existing manual-entry flow. Adding an item must not require creating a 3D model.
3. Optionally choose a matching garment template and customize its appearance. Show whether the representation is a generic template, a customized template, or an item-specific model.
4. Open an existing outfit in a 3D preview. Dress the avatar using references to existing wardrobe items, never by creating additional inventory records.
5. Rotate and zoom the view, switch between front/side/back views, and inspect supported layers. Keep a text list of selected items available outside the canvas.
6. Save the outfit and its preview configuration. Continue to use the outfit in the planner without requiring 3D rendering.
7. If a garment has no compatible representation, explain the limitation and keep the item in the outfit. Do not silently omit it or block ordinary wardrobe use.

## Avatar customization

Use independent controls rather than requiring a gender or ethnicity category to select body features. Do not infer race, health, or other sensitive attributes from appearance.

| Area | Proposed controls | Notes |
| --- | --- | --- |
| Skin | Skin tone/color and optional undertone | Provide a broad range and a neutral lighting preview; display appearance is not color-accurate across devices. |
| Hair | Style, texture/curl pattern, length, color, bald/shaved option | Test long hair with collars, hats, and outerwear. |
| Face | Optional face shape, eye color, eyebrows, facial hair | Lower priority than body proportions and clothing coverage. Photorealistic likeness is not required for the first release. |
| Stature | Height, with centimetre and feet/inch input | Store one canonical unit and test conversions. |
| Body proportions | Shoulder width, chest/bust, waist, hips, torso length, arm length, inseam | Start with editable presets and a limited supported range; add measurements only where the model can use them meaningfully. |
| Feet | Foot length and optional width | Shoe size labels vary by sizing system and are not sufficient for reliable fit prediction. |
| Presentation | Neutral pose, camera view, optional headwear and eyewear | Use a neutral pose first; animation is a later milestone. |

Do not require weight, photos, scans, or detailed measurements to use the wardrobe. Values the user does not provide should remain unspecified rather than being saved as measured facts. Show the supported range of each control instead of accepting values the model cannot represent.

## Clothing representation and coverage

The full goal covers tops, bottoms, dresses and other one-piece garments, outerwear, footwear, and accessories. Coverage must be tracked by supported garment family and body configuration, not just by the number of model files.

Each wardrobe item may have an optional representation with:

- A garment asset ID and version.
- A template family, such as T-shirt, trousers, skirt, dress, jacket, or shoe.
- Color, material preset, pattern/texture, and supported construction options such as sleeve length or neckline.
- Compatible avatar model versions and supported body-shape ranges.
- Wearable location and layer rules, such as base top, outerwear, feet, head, or accessory attachment.
- Representation fidelity: generic template, customized template, or item-specific model.
- Optional measured garment dimensions, explicitly distinguished from a size label or visual scaling choice.

### How models will be obtained

| Approach | Benefit | Limitation and proposed use |
| --- | --- | --- |
| Curated, editable templates | A manageable starting library; consistent compatibility | Approximate silhouette, not the exact owned garment. Recommended first implementation. |
| Licensed or custom-authored item models | Can represent specific details accurately | Requires asset creation, licensing checks, optimization, and compatibility testing. Add for priority garment families. |
| User-imported models | Supports advanced users and unusual items | File validation, scale, texture references, licensing, and avatar compatibility make arbitrary uploads unsuitable for the first release. |
| Photo-based reconstruction | Could reduce manual model creation later | A photograph does not establish hidden geometry, dimensions, or fabric behavior. Research separately; do not promise automatic accurate reconstruction. |

A model is not ready merely because it loads. Asset acceptance includes scale/orientation, texture quality, attachment or deformation behavior, body compatibility, layer compatibility, file size, and license provenance. Keep source assets and export instructions so assets can be repaired and regenerated.

## Technical direction to validate

Retain Next.js, the feature-oriented application structure, and the existing outfit/item identifiers. Prototype a client-only 3D viewer using Three.js with React Three Fiber; this is a candidate, not a committed dependency choice. Evaluate glTF/GLB, common formats for transmitting 3D scenes and models, for runtime assets.

A possible structure, to create only when implementation begins:

```text
src/features/avatar/       # Profile editor and avatar configuration
src/features/try-on/       # Viewer, dressing controls, compatibility feedback
src/shared/3d/             # Reused model loading and rendering utilities
public/models/            # Small curated runtime assets, if suitable
```

Avoid putting rendering objects, model binaries, or image textures in the Zustand wardrobe state. Keep serializable profile data and asset references separate from the rendering engine. The existing wardrobe and planner must continue working if the 3D code fails to load.

### Proposed records

- `AvatarProfile`: ID, optional owner ID for a future account system, avatar model/version, appearance settings, optional body measurements, and measurement units.
- `GarmentRepresentation`: wardrobe item ID, asset ID/version, appearance parameters, fidelity label, supported avatar range, and layer/attachment metadata.
- `OutfitPreview`: outfit ID, avatar profile ID, preview pose, and supported layer overrides. Resolve clothing from the existing outfit rather than copying item data.
- `AssetManifest`: asset location, version, license/source, compatible models, loading budget, and fallback behavior.

Version these records and provide migrations before storing real user profiles. Preserve existing wardrobe records that have no avatar or representation.

### Storage and accounts

The current app has one local wardrobe, not authenticated users. Start with one local avatar profile associated with that wardrobe. The future per-user version requires real accounts and ownership checks; a local profile ID is not authentication.

Store small configuration records through the versioned persistence layer. For larger assets, evaluate IndexedDB, the browser's asynchronous structured storage, or a managed asset service. Do not put model binaries or base64 textures in `localStorage`. Browser asset storage still needs quota handling and is not a backup.

For curated assets, evaluate ordinary repository storage against Git Large File Storage or versioned object storage before adding large files. Track manifests, licensing, versions, and build/export steps in Git even when binaries live elsewhere.

## What will be difficult

| Challenge | Why it matters | Proposed response |
| --- | --- | --- |
| Clothing adaptation to body shape | Scaling a whole garment does not reproduce shoulder, waist, and limb changes | Prototype a common skeleton for posing and authored shape adjustments for a limited body range. Reject unsupported combinations visibly. |
| Layering and clipping | Shirts, jackets, hair, and accessories can intersect each other or the body | Define supported layer combinations, garment clearances, attachment rules, and selective hiding of covered body surfaces. Test a compatibility matrix. |
| Realistic drape and fit | Appearance depends on fabric mechanics and garment construction, not just skin tone and height | Defer physical simulation; label first-release results as approximate. Establish separate accuracy benchmarks before making fit claims. |
| Complete clothing coverage | Custom cuts and unusual garments may not map to templates | Use explicit coverage statuses and a template backlog. Preserve the item and show an unsupported-preview message. |
| Rendering performance | Several textured models can consume substantial memory and graphics resources | Load the viewer only when requested, reuse assets, limit texture/model complexity, and define measured budgets for target devices. |
| Portability and privacy | Body measurements and likeness data are personal; local storage can be lost | Make attributes optional, support export/delete, and require explicit consent before any upload or sharing. |

## Delivery stages and acceptance gates

### Stage 0 — Prototype and decide feasibility

Build a disposable technical prototype with one configurable avatar, one top, one bottom, and one pair of shoes. Compare the candidate rendering stack and asset sources.

Acceptance: record the supported body range, clipping limitations, asset licenses, load time, frame rate, memory observations, and device/browser used. Set explicit performance budgets from these measurements before approving the production viewer. Do not call this prototype full wardrobe coverage.

### Stage 1 — Local avatar editor

Implement skin tone, hair, height, and a limited set of body proportions. Provide reset, save, reload, and deletion. Keep detailed face controls optional for a later iteration.

Acceptance: configurations survive reload and validated backup/restore; unit conversions round-trip; all controls have labels and keyboard access; unsupported values are rejected without damaging saved data.

### Stage 2 — Manual clothing-to-template mapping

Add optional representation configuration to existing items, beginning with the prototype families. Maintain an explicit supported/unsupported list and fidelity labels.

Acceptance: mapping or removing a representation never creates/deletes a wardrobe item; changing item metadata preserves its identity; items without models remain fully usable; missing or invalid assets have a visible fallback.

### Stage 3 — Outfit preview

Dress the avatar from saved outfit item IDs. Add camera controls and supported layer rules. Start with a static neutral pose, not animated cloth simulation.

Acceptance: every outfit item is either rendered or listed with a reason it cannot be previewed; camera controls work with keyboard alternatives; previewing does not alter inventory; model-loading failures do not break wardrobe or planner pages.

### Stage 4 — Expand coverage and validate quality

Add dresses, skirts, outerwear, headwear, bags, jewelry, and other requested garment families in batches. Test body and layer combinations for each batch.

Acceptance: each supported asset passes the compatibility checklist and agreed performance budgets; unsupported combinations remain clearly identified. Track coverage of actual wardrobe items rather than claiming that all clothes are supported prematurely.

### Stage 5 — Per-user accounts and higher-fidelity research

After the local product is stable, consider authenticated avatar/profile ownership, optional cross-device asset storage, user uploads, photo-based model creation, and physical cloth simulation as separately scoped projects.

Acceptance: account data isolation tests and deletion/export flows pass before uploads are enabled. Accurate-fit claims require a documented comparison against real garments and measurements, not screenshots alone.

## Test strategy

- **Domain tests:** profile validation, units, version migrations, item/asset references, duplicate IDs, supported body ranges, and layer rules.
- **Persistence tests:** old wardrobes without profiles, missing assets, malformed imports, quota errors, backup/restore, and deletion without orphaned configuration.
- **Browser tests:** customize/save/reload an avatar; map a manually entered item; preview an existing outfit; rotate/reset the view; handle unsupported items and loading failures; continue using the app without graphics support.
- **Visual checks:** fixed camera, pose, lighting, and deterministic assets for representative skin tones, hair styles, body proportions, and layer combinations. Screenshot comparisons help catch regressions but cannot prove real-world fit.
- **Performance checks:** cold/warm loading and repeated outfit changes on agreed desktop and lower-powered devices; monitor memory growth and graphics-context loss.
- **Accessibility checks:** keyboard controls, text alternatives to the canvas, visible focus, contrast, reduced motion, and clear status/error announcements.
- **Privacy/security checks:** no uploads without consent; validate files and resource limits if imports are introduced; test ownership isolation before enabling account-backed profiles.

## Decisions before implementation

Resolve these during Stage 0 rather than guessing in production code:

1. Stylized versus realistic avatar appearance and the initial body-proportion range.
2. Whether the first preview should prioritize color/silhouette matching or measured garment dimensions.
3. Initial supported clothing families and template options.
4. Asset creation/licensing budget and who will maintain the models.
5. Target browsers/devices and measured loading/rendering budgets.
6. Whether account-backed profiles are needed immediately after the local prototype or can remain deferred.

No model library, cloud service, paid asset purchase, user upload, or real-world fit guarantee is approved by this plan alone.
