# Blender asset pipeline

Blender is installed through Homebrew and is available as `blender` (4.5.14 LTS).
The tested invocation is:

```sh
blender -b --python scripts/asset-pipeline/export_glb.py -- \
  --input path/to/source.obj --output public/models/asset.glb
```

The script supports `.blend`, `.obj`, `.fbx`, `.gltf`, and `.glb` input. It resets the scene for imported mesh formats, imports the source, applies rotation and scale, and exports a Y-up GLB with UVs, normals, and exported materials. It does not download files or assert licensing; provenance must be verified before conversion.

A temporary cube source was converted successfully to a valid glTF binary v2 file. Temporary test output is not part of the repository.

## Current T-shirt blocker

The verified candidate is [Sketchfab T Shirt](https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba), model `c1a3e5eb9b5445f4b7d4be82f1127eba`, by `funlab117`. The official API reports downloadable GLB/GLTF, CC BY 4.0, commercial use allowed with attribution, 120,973 vertices, and 237,938 faces.

The official download endpoint returned HTTP 401 and requires authentication. No source file was obtained, so no external GLB has been added, fitted, or integrated. Do not replace it with an unverified mirror or bypass the download restriction. The next step requires an authenticated, legitimately downloaded source file or another openly downloadable candidate with equivalent provenance.
