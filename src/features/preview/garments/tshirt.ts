import * as THREE from "three";

type Ring = { y: number; width: number; depth: number };

function appendSurface(
  positions: number[],
  indices: number[],
  rings: Ring[],
  columns: number,
  point: (ring: Ring, angle: number, row: number) => [number, number, number],
) {
  const start = positions.length / 3;
  rings.forEach((ring, row) => {
    for (let column = 0; column < columns; column++) {
      positions.push(...point(ring, column / columns * Math.PI * 2, row));
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
    { y: 3.42, width: 0.64, depth: 0.45 }, // hem, slight ease over hips
    { y: 3.5, width: 0.72, depth: 0.49 },
    { y: 3.82, width: 0.75, depth: 0.51 },
    { y: 4.18, width: 0.74, depth: 0.5 },
    { y: 4.55, width: 0.73, depth: 0.49 },
    { y: 4.92, width: 0.76, depth: 0.5 },
    { y: 5.25, width: 0.84, depth: 0.51 },
    { y: 5.48, width: 0.91, depth: 0.47 },
    { y: 5.66, width: 0.84, depth: 0.41 },
    { y: 5.78, width: 0.59, depth: 0.32 },
  ];
  appendSurface(positions, indices, torso, 48, (ring, angle, row) => {
    const shoulder = row >= 7 ? Math.sin(angle) * 0.025 : 0;
    // A little more room at the chest than the waist is characteristic of a
    // regular-fit tee; the front remains gently convex, not spherical.
    const front = Math.sin(angle) > 0 ? 0.018 : 0;
    return [Math.cos(angle) * ring.width, ring.y + shoulder, Math.sin(angle) * ring.depth + front];
  });

  const sleeveRings = [
    { distance: 0, radius: 0.29 },
    { distance: 0.12, radius: 0.31 },
    { distance: 0.31, radius: 0.285 },
    { distance: 0.5, radius: 0.255 },
    { distance: 0.58, radius: 0.24 },
  ];
  for (const side of [-1, 1]) {
    // The sleeve starts at the shoulder line and ends above the elbow. Its
    // first ring is deliberately buried in the torso/armhole transition;
    // the visible cuff is the only open edge.
    const start = positions.length / 3;
    const axis = new THREE.Vector3(side * 0.48, -0.24, 0).normalize();
    const radial = new THREE.Vector3(-axis.y * side, axis.x * side, 0).normalize();
    const origin = new THREE.Vector3(side * 0.72, 5.5, 0);
    sleeveRings.forEach(({ distance, radius }) => {
      const center = origin.clone().addScaledVector(axis, distance);
      for (let column = 0; column < 24; column++) {
        const angle = column / 24 * Math.PI * 2;
        const p = center.clone()
          .addScaledVector(radial, Math.cos(angle) * radius)
          .add(new THREE.Vector3(0, 0, Math.sin(angle) * radius * 0.92));
        positions.push(p.x, p.y, p.z);
      }
    });
    for (let row = 0; row < sleeveRings.length - 1; row++) {
      for (let column = 0; column < 24; column++) {
        const next = (column + 1) % 24;
        const a = start + row * 24 + column;
        const b = start + row * 24 + next;
        const c = start + (row + 1) * 24 + column;
        const d = start + (row + 1) * 24 + next;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function garmentMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
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
  const rib = new THREE.MeshStandardMaterial({ color: 0xe1e4e6, roughness: 0.72, side: THREE.DoubleSide });
  // Closed cuffs prevent the mannequin from showing through the sleeve opening.
  for (const side of [-1, 1]) {
    const cuff = new THREE.Mesh(new THREE.CircleGeometry(0.235, 24), rib);
    cuff.name = `tshirt.${side < 0 ? "left" : "right"}SleeveOpening`;
    cuff.position.set(side * 0.72 + side * 0.48, 5.5 - 0.24, 0);
    cuff.rotation.set(0, side * Math.PI / 2.68, 0);
    cuff.castShadow = true;
    garment.add(cuff);
  }

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.052, 12, 40), rib);
  collar.name = "tshirt.ribbedCrewNeck";
  collar.position.set(0, 5.82, 0);
  collar.rotation.x = Math.PI / 2;
  collar.scale.z = 0.76;
  collar.castShadow = true;
  garment.add(collar);

  // Subtle raised hems communicate construction without a physics simulation.
  const hem = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.018, 6, 48), rib);
  hem.name = "tshirt.bottomHemDetail";
  hem.position.set(0, 3.43, 0);
  hem.scale.z = 0.64;
  hem.castShadow = true;
  garment.add(hem);

  garment.userData.garmentType = "tshirt";
  garment.userData.material = "white-cotton";
  garment.userData.source = "original-authored-connected-garment-surface";
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
