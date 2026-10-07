import * as THREE from "three";

// Model units are head heights. Floor to crown = 7.5 units.
// Each ring is [height, half width, half depth, forward offset].
type Ring = [number, number, number, number];
export function sectionGeometry(rings: Ring[], steps = 40) {
  const shape = new THREE.CatmullRomCurve3(rings.map((r) => new THREE.Vector3(r[1], r[2], r[3])), false, "catmullrom", 0.3);
  const positions: number[] = [];
  const indices: number[] = [];
  const sides = 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const at = t * (rings.length - 1);
    const lo = Math.min(Math.floor(at), rings.length - 2);
    const y = THREE.MathUtils.lerp(rings[lo][0], rings[lo + 1][0], at - lo);
    const p = shape.getPoint(t);
    for (let j = 0; j <= sides; j++) {
      const a = j / sides * Math.PI * 2;
      positions.push(Math.cos(a) * Math.max(0, p.x), y, Math.sin(a) * Math.max(0, p.y) + p.z);
      if (i < steps && j < sides) {
        const n = i * (sides + 1) + j;
        indices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createMannequin() {
  const model = new THREE.Group();
  model.name = "fashion-mannequin";
  const material = new THREE.MeshStandardMaterial({ color: "#e6e3dc", roughness: 0.72 });
  const regions: Record<string, THREE.Object3D> = {};
  function part(name: string, rings: Ring[], parent: THREE.Object3D = model) {
    const mesh = new THREE.Mesh(sectionGeometry(rings), material);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    regions[name] = mesh;
    return mesh;
  }
  part("torso", [
    [3.35,0,0,0], [3.55,.5,.33,0], [3.82,.65,.39,-.03],
    [4.08,.68,.4,-.03], [4.4,.62,.34,0], [4.68,.59,.31,0],
    [4.98,.63,.35,.015], [5.3,.72,.39,.025], [5.6,.79,.36,0],
    [5.83,.84,.29,0], [6.02,.7,.245,0], [6.17,.3,.21,0],
    [6.3,.21,.19,0], [6.58,.21,.19,0], [6.63,0,0,0],
  ]);
  const pelvis = new THREE.Object3D();
  pelvis.name = "pelvis";
  pelvis.position.y = 3.9;
  model.add(pelvis);
  regions.pelvis = pelvis; // Attachment marker; torso surface includes the pelvis.
  part("head", [
    [6.5,0,0,.02], [6.55,.15,.2,.045], [6.68,.25,.28,.015],
    [6.9,.32,.32,0], [7.18,.34,.33,-.025], [7.38,.27,.27,-.03], [7.5,0,0,-.03],
  ], model);
  for (const side of [-1, 1]) {
    const label = side < 0 ? "left" : "right";
    const arm = new THREE.Group();
    arm.position.set(side * .79,5.78,0);
    arm.rotation.z = side * Math.PI / 12;
    model.add(arm);
    part(`${label}.upperArm`, [
      [-1.25,.155,.16,0],[-1.05,.185,.19,0],[-.65,.245,.24,0],[-.2,.29,.28,0],[.05,.25,.25,0],[.23,0,0,0],
    ], arm);
    part(`${label}.forearm`, [
      [-2.35,.105,.115,0],[-2.12,.13,.135,0],[-1.75,.195,.18,.015],[-1.45,.19,.185,0],[-1.24,.155,.16,0],
    ], arm);
    part(`${label}.hand`, [
      [-2.98,0,0,.015],[-2.9,.125,.07,.015],[-2.68,.16,.085,.015],[-2.47,.145,.09,0],[-2.34,.105,.115,0],
    ], arm);
    const thigh = part(`${label}.thigh`, [
      [1.98,.205,.22,.03],[2.2,.22,.225,.02],[2.55,.27,.28,0],
      [3.05,.32,.36,-.035],[3.48,.34,.37,-.03],[3.78,.3,.32,-.03],[3.94,0,0,0],
    ]);
    thigh.position.x = side * .37;
    const lower = part(`${label}.lowerLeg`, [
      [.35,.14,.16,0],[.65,.15,.17,-.02],[1,.18,.205,-.055],
      [1.4,.22,.24,-.075],[1.7,.22,.235,-.03],[1.98,.205,.22,.03],
    ]);
    lower.position.x = side * .37;
    const foot = part(`${label}.foot`, [
      [.025,0,0,.19],[.04,.17,.43,.19],[.13,.18,.45,.2],
      [.24,.165,.37,.16],[.34,.13,.22,.055],[.48,.115,.145,0],
    ]);
    foot.position.x = side * .37;
  }
  model.userData.regions = regions;
  return model;
}

export function disposeMannequin(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) => materials.add(m));
    }
  });
  materials.forEach((m) => m.dispose());
}
