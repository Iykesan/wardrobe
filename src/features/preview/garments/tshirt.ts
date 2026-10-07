import * as THREE from "three";

const WHITE = 0xf7f7f2;

function cottonMaterial() {
  return new THREE.MeshStandardMaterial({
    color: WHITE,
    roughness: 0.94,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function taperedSleeve(side: number, material: THREE.Material) {
  const geometry = new THREE.CylinderGeometry(0.27, 0.21, 0.64, 24, 4, false);
  const sleeve = new THREE.Mesh(geometry, material);
  sleeve.name = side < 0 ? "tshirt.leftSleeve" : "tshirt.rightSleeve";
  sleeve.position.set(side * 0.91, 5.25, 0);
  sleeve.rotation.z = side * -Math.PI / 12;
  sleeve.castShadow = true;
  sleeve.receiveShadow = true;
  return sleeve;
}

export function createTShirt() {
  const garment = new THREE.Group();
  garment.name = "tshirt";
  const material = cottonMaterial();

  // A smooth shell follows the mannequin's chest, waist, and upper hip profile.
  // The small radial clearance prevents the garment from intersecting the body.
  const torso = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.52, 3.42),
      new THREE.Vector2(0.72, 3.58),
      new THREE.Vector2(0.76, 3.86),
      new THREE.Vector2(0.78, 4.18),
      new THREE.Vector2(0.70, 4.48),
      new THREE.Vector2(0.66, 4.78),
      new THREE.Vector2(0.72, 5.08),
      new THREE.Vector2(0.82, 5.38),
      new THREE.Vector2(0.88, 5.62),
      new THREE.Vector2(0.72, 5.82),
      new THREE.Vector2(0.38, 5.94),
    ], 32),
    material,
  );
  torso.name = "tshirt.torso";
  torso.scale.z = 0.58;
  torso.castShadow = true;
  torso.receiveShadow = true;
  garment.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.065, 10, 32), material);
  collar.name = "tshirt.collar";
  collar.position.y = 5.98;
  collar.rotation.x = Math.PI / 2;
  collar.scale.z = 0.72;
  collar.castShadow = true;
  garment.add(collar);

  garment.add(taperedSleeve(-1, material), taperedSleeve(1, material));
  garment.userData.garmentType = "tshirt";
  garment.userData.material = "white-cotton";
  return garment;
}

export function disposeTShirt(garment: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  garment.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
    }
  });
  materials.forEach((material) => material.dispose());
}
