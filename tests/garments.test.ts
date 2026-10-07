import test from "node:test";
import assert from "node:assert/strict";
import { getGarmentManifest, isManifestCompatible, TSHIRT_MANIFEST } from "../src/features/preview/garments/manifest";

test("the T-shirt manifest describes an original compatible generic template", () => {
  assert.equal(getGarmentManifest("wardrope.tshirt"), TSHIRT_MANIFEST);
  assert.equal(TSHIRT_MANIFEST.assetType, "procedural");
  assert.equal(TSHIRT_MANIFEST.license, "Original project geometry");
  assert.equal(TSHIRT_MANIFEST.fidelity, "generic-template");
  assert.equal(isManifestCompatible(TSHIRT_MANIFEST, "wardrope-fashion-mannequin-v1"), true);
  assert.equal(isManifestCompatible(TSHIRT_MANIFEST, "unknown-avatar"), false);
});
