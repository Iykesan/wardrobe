"""Headless Blender source-mesh to GLB conversion.

Usage:
  blender -b --python scripts/asset-pipeline/export_glb.py -- \
    --input source.obj --output public/models/tshirt.glb

The script intentionally does not download assets. Confirm provenance and
redistribution rights before running it on a source mesh.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

import bpy


def parse_args() -> argparse.Namespace:
    try:
        values = sys.argv[sys.argv.index("--") + 1 :]
    except ValueError:
        values = []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args(values)


def import_mesh(path: Path) -> None:
    suffix = path.suffix.lower()
    if suffix == ".blend":
        bpy.ops.wm.open_mainfile(filepath=str(path))
    elif suffix == ".obj":
        bpy.ops.wm.obj_import(filepath=str(path))
    elif suffix in {".fbx"}:
        bpy.ops.import_scene.fbx(filepath=str(path))
    elif suffix in {".gltf", ".glb"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        raise ValueError(f"Unsupported input format: {suffix}")


def main() -> None:
    args = parse_args()
    if not args.input.is_file():
        raise FileNotFoundError(args.input)
    args.output.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    import_mesh(args.input)
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("The source did not contain a mesh object")

    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(args.output),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    print(f"WARDROPE_GLTF_EXPORTED {args.output}")


if __name__ == "__main__":
    main()
