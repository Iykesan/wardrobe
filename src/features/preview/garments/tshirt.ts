import * as THREE from "three";

const WHITE = 0xf7f7f2;

function garmentMaterial() {
  return new THREE.MeshStandardMaterial({
    color: WHITE,
    roughness: 0.94,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function sleeveBetween(side: number, material: THREE.Material) {
  const start = new THREE.Vector3(side * 0.66, 5.56, 0);
  const end = new THREE.Vector3(side * 1.04, 5.22, 0);
  const axis = end.clone().sub(start);
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.20, axis.length() + 0.12, 24, 3, false),
    material,
  );
  sleeve.name = side < 0 ? "tshirt.leftSleeve" : "tshirt.rightSleeve";
  sleeve.position.copy(start).add(end).multiplyScalar(0.5);
  sleeve.position.x -= side * 0.04;
  sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  sleeve.castShadow = true;
  sleeve.receiveShadow = true;
  return sleeve;
}

function torsoMesh(material: THREE.Material) {
  const ringCount = 40;
  const profile = [
    [3.42, 0.56, 0.40], [3.58, 0.74, 0.48], [3.9, 0.79, 0.50],
    [4.25, 0.78, 0.49], [4.58, 0.74, 0.46], [4.9, 0.77, 0.48],
    [5.2, 0.84, 0.50], [5.48, 0.93, 0.48], [5.68, 0.88, 0.42],
    [5.82, 0.72, 0.34], [5.9, 0.48, 0.28],
  ] as const;
  const positions: number[] = [];
  const indices: number[] = [];
  profile.forEach(([y, width, depth]) => {
    for (let column = 0; column < ringCount; column++) {
      const angle = column / ringCount * Math.PI * 2;
      positions.push(Math.cos(angle) * width, y, Math.sin(angle) * depth);
    }
  });
  for (let row = 0; row < profile.length - 1; row++) {
    for (let column = 0; column < ringCount; column++) {
      const next = (column + 1) % ringCount;
      const a = row * ringCount + column;
      const b = row * ringCount + next;
      const c = (row + 1) * ringCount + column;
      const d = (row + 1) * ringCount + next;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "tshirt.torso";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createCollar(material: THREE.Material) {
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.065, 10, 32), material);
  collar.name = "tshirt.crewNeck";
  collar.position.set(0, 5.86, 0);
  collar.rotation.x = Math.PI / 2;
  collar.scale.z = 0.76;
  collar.castShadow = true;
  return collar;
}

export function createTShirt() {
  const garment = new THREE.Group();
  garment.name = "tshirt";
  const material = garmentMaterial();
  garment.add(torsoMesh(material), createCollar(material), sleeveBetween(-1, material), sleeveBetween(1, material));
  garment.userData.garmentType = "tshirt";
  garment.userData.material = "white-cotton";
  garment.userData.source = "custom-garment-mesh";
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
