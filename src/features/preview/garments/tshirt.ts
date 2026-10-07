import * as THREE from "three";

type Ring = { y: number; width: number; depth: number };

function appendRingSurface(
  positions: number[],
  indices: number[],
  rings: Ring[],
  columns: number,
  transform: (ring: Ring, angle: number, row: number) => [number, number, number],
) {
  const start = positions.length / 3;
  rings.forEach((ring, row) => {
    for (let column = 0; column < columns; column++) {
      const angle = column / columns * Math.PI * 2;
      positions.push(...transform(ring, angle, row));
    }
  });
  for (let row = 0; row < rings.length - 1; row++) {
    for (let column = 0; column < columns; column++) {
      const next = (column + 1) % columns;
      const a = start + row * columns + column;
      const b = start + row * columns + next;
      const c = start + (row + 1) * columns + column;
      const d = start + (row + 1) * columns + next;
      indices.push(a, c, b, b, c, d);
    }
  }
}

function createGarmentGeometry() {
  const positions: number[] = [];
  const indices: number[] = [];
  const torso: Ring[] = [
    { y: 3.42, width: 0.58, depth: 0.42 },
    { y: 3.58, width: 0.75, depth: 0.5 },
    { y: 3.9, width: 0.8, depth: 0.52 },
    { y: 4.25, width: 0.79, depth: 0.51 },
    { y: 4.58, width: 0.76, depth: 0.48 },
    { y: 4.9, width: 0.79, depth: 0.5 },
    { y: 5.2, width: 0.86, depth: 0.52 },
    { y: 5.48, width: 0.95, depth: 0.5 },
    { y: 5.7, width: 0.9, depth: 0.43 },
    { y: 5.84, width: 0.7, depth: 0.35 },
  ];
  appendRingSurface(positions, indices, torso, 40, (ring, angle, row) => {
    const shoulderLift = row === torso.length - 1 ? Math.sin(angle) * 0.035 : 0;
    return [Math.cos(angle) * ring.width, ring.y + shoulderLift, Math.sin(angle) * ring.depth];
  });

  const sleeve: Ring[] = [
    { y: 0, width: 0.36, depth: 0.34 },
    { y: 0.16, width: 0.34, depth: 0.33 },
    { y: 0.38, width: 0.27, depth: 0.28 },
    { y: 0.58, width: 0.21, depth: 0.24 },
  ];
  for (const side of [-1, 1]) {
    appendRingSurface(positions, indices, sleeve, 20, (ring, angle) => {
      const axisT = ring.y / 0.56;
      const centerX = side * (0.58 + axisT * 0.4);
      const centerY = 5.58 - axisT * 0.3;
      const along = new THREE.Vector3(side * 0.34, -0.3, 0).normalize();
      const widthAxis = new THREE.Vector3(-along.y * side, along.x * side, 0);
      const around = widthAxis.multiplyScalar(Math.cos(angle) * ring.width);
      const depth = new THREE.Vector3(0, 0, Math.sin(angle) * ring.depth);
      return [centerX + around.x + depth.x, centerY + around.y + depth.y, around.z + depth.z];
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function garmentMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

export function createTShirt() {
  const garment = new THREE.Group();
  garment.name = "tshirt";
  const material = garmentMaterial();
  const mesh = new THREE.Mesh(createGarmentGeometry(), material);
  mesh.name = "tshirt.connectedGarmentMesh";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  garment.add(mesh);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 10, 32), material);
  collar.name = "tshirt.crewNeck";
  collar.position.set(0, 5.82, 0);
  collar.rotation.x = Math.PI / 2;
  collar.scale.z = 0.76;
  collar.castShadow = true;
  garment.add(collar);

  garment.userData.garmentType = "tshirt";
  garment.userData.material = "white-cotton";
  garment.userData.source = "custom-connected-garment-mesh";
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
