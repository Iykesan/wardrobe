# Clothing asset audit — 2026-03-10

## Approved runtime assets

| Template | Asset | License/source | Status |
|---|---|---|---|
| Regular T-shirt | `wardrope-authored-tshirt@1.0.0` | Original project geometry in `src/features/preview/garments/tshirt.ts` | Runtime-ready procedural template |
| Basic trousers | `wardrope-authored-trousers@1.0.0` | Original project geometry in `src/features/preview/garments/trousers.ts` | Runtime-ready procedural template |

These are reusable project-authored templates, not exact reconstructions of owned garments.

## Unapproved planned assets

The first reusable library milestone also calls for straight-leg jeans and low-top sneakers. No suitable redistributable candidates were approved during the audit:

- [Poly Haven apparel category](https://polyhaven.com/models/apparel-personal-items) and [license](https://polyhaven.com/license): the license is CC0 and permits commercial use and redistribution without required attribution, but the inspected category did not provide a regular T-shirt, jeans, or low-top sneakers suitable for this mannequin. It contains accessories, boots, hats, and workwear instead.
- [Sketchfab downloadable T-shirt search](https://sketchfab.com/search?type=models&q=t-shirt&features=downloadable): individual author/license/redistribution terms could not be verified from the extracted search result, so no asset was downloaded.
- [CGTrader terms](https://www.cgtrader.com/pages/terms-and-conditions): marketplace licenses are seller/asset-specific. A generic marketplace listing is not evidence that redistribution inside this application is permitted.
- [BlenderKit licenses](https://www.blenderkit.com/docs/licenses/): commercial use is available, but the royalty-free license prohibits reselling the model in the same form; each candidate requires individual review. No candidate was approved.

No gated download was bypassed, and no binary was added without source/license and topology evidence. Blender and glTF conversion tools are not installed locally.

## Required approval record before adding a binary

For each future GLB, record the author, exact source URL, license text/link, commercial-use and redistribution permission, attribution requirement, source format, modified/exported version, vertex/texture budget, mannequin compatibility review, and front/side/back screenshots. Keep binaries in the public asset directory, never in wardrobe localStorage.
