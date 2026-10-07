import * as THREE from "three";

function trouserMaterial(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
}

function createLeg(side: number, material: THREE.Material) {
  const geometry = new THREE.CapsuleGeometry(0.29, 1.7, 8, 18);
  const leg = new THREE.Mesh(geometry, material);
  leg.name = side < 0 ? "trousers.leftLeg" : "trousers.rightLeg";
  leg.position.set(side * 0.34, 1.85, 0);
  leg.scale.set(1, 1, 0.9);
  leg.castShadow = true;
  leg.receiveShadow = true;
  return leg;
}

export function createTrousers(color = "#334155") {
  const garment = new THREE.Group();
  garment.name = "trousers";
  const material = trouserMaterial(color);

  const waistband = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.68, 0.32, 32), material);
  waistband.name = "trousers.waistband";
  waistband.position.y = 3.35;
  waistband.scale.z = 0.78;
  waistband.castShadow = true;
  waistband.receiveShadow = true;
  garment.add(waistband, createLeg(-1, material), createLeg(1, material));

  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.55, 0.035), material);
  seam.name = "trousers.frontSeam";
  seam.position.set(0, 2.55, 0.29);
  seam.castShadow = true;
  garment.add(seam);

  garment.userData.garmentType = "trousers";
  garment.userData.material = "denim-template";
  garment.userData.source = "Original project geometry";
  return garment;
}

export function disposeTrousers(garment: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  garment.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
    }
  });
  materials.forEach((material) => material.dispose());
}
