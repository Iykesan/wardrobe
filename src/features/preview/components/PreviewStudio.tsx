"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type View = "front" | "side" | "back";

const viewAngles: Record<View, number> = { front: 0, side: Math.PI / 2, back: Math.PI };

function capsule(radius: number, length: number, color: string, garment?: string) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 8, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.userData.garment = garment;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function skinSphere(radius: number, color: string) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 14),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 }),
  );
  mesh.userData.garment = "skin";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function taperedBody(color: string, profile: Array<[number, number]>, garment: string) {
  const geometry = new THREE.LatheGeometry(
    profile.map(([radius, height]) => new THREE.Vector2(radius, height)),
    24,
  );
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.userData.garment = garment;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createOutfit(shirtColor: string, trouserColor: string, shoeColor: string) {
  const outfit = new THREE.Group();
  const skin = "#c99578";

  const head = skinSphere(0.4, skin);
  head.position.y = 4.12;
  head.scale.set(0.86, 1.12, 0.86);
  outfit.add(head);

  const neck = capsule(0.18, 0.16, skin, "skin");
  neck.position.y = 3.57;
  outfit.add(neck);

  // The clothing overlaps a simple body form so the figure reads as one mannequin.
  const shirt = taperedBody(
    shirtColor,
    [[0.48, -0.7], [0.58, -0.58], [0.62, -0.38], [0.64, 0.05], [0.78, 0.45], [0.72, 0.68], [0.5, 0.78]],
    "shirt",
  );
  shirt.position.y = 2.72;
  shirt.scale.z = 0.72;
  outfit.add(shirt);

  const pelvis = taperedBody(
    trouserColor,
    [[0.42, -0.32], [0.58, -0.18], [0.62, 0.08], [0.58, 0.28], [0.42, 0.36]],
    "trousers",
  );
  pelvis.position.y = 1.55;
  pelvis.scale.z = 0.78;
  outfit.add(pelvis);

  for (const side of [-1, 1]) {
    const upperArm = capsule(0.18, 0.68, shirtColor, "shirt");
    upperArm.position.set(side * 0.86, 2.72, 0);
    upperArm.rotation.z = side * -0.12;
    outfit.add(upperArm);

    const forearm = capsule(0.15, 0.58, skin, "skin");
    forearm.position.set(side * 0.91, 1.9, 0);
    forearm.rotation.z = side * -0.05;
    outfit.add(forearm);

    const hand = skinSphere(0.17, skin);
    hand.position.set(side * 0.91, 1.43, 0);
    hand.scale.set(0.8, 1.15, 0.7);
    outfit.add(hand);

    const leg = capsule(0.24, 1.18, trouserColor, "trousers");
    leg.position.set(side * 0.3, 0.58, 0);
    outfit.add(leg);

    const shoe = skinSphere(0.5, shoeColor);
    shoe.userData.garment = "shoes";
    shoe.position.set(side * 0.3, -0.2, 0.22);
    shoe.scale.set(0.62, 0.34, 1.05);
  }

  return outfit;
}

export default function PreviewStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ outfit: THREE.Group; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; scene: THREE.Scene } | null>(null);
  const [view, setView] = useState<View>("front");
  const [shirtColor, setShirtColor] = useState("#4f6d7a");
  const [trouserColor, setTrouserColor] = useState("#334155");
  const [shoeColor, setShoeColor] = useState("#20242b");
  const colorsRef = useRef({ shirtColor, trouserColor, shoeColor });
  useEffect(() => {
    colorsRef.current = { shirtColor, trouserColor, shoeColor };
  }, [shirtColor, trouserColor, shoeColor]);
  const [graphicsAvailable, setGraphicsAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.shadowMap.enabled = true;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#e7edef");
      const camera = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.set(0, 2.05, 10.5);
      camera.lookAt(0, 2.05, 0);
      scene.add(new THREE.HemisphereLight("#ffffff", "#9aa7ad", 2.2));
      const key = new THREE.DirectionalLight("#ffffff", 2.4);
      key.position.set(4, 7, 6);
      key.castShadow = true;
      scene.add(key);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(4.5, 48), new THREE.MeshStandardMaterial({ color: "#f7f4ed", roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.35;
      floor.receiveShadow = true;
      scene.add(floor);
      const outfit = createOutfit(colorsRef.current.shirtColor, colorsRef.current.trouserColor, colorsRef.current.shoeColor);
      scene.add(outfit);
      sceneRef.current = { outfit, camera, renderer, scene };
      const render = () => renderer.render(scene, camera);
      render();
      const resize = () => {
        if (!canvas.clientWidth || !canvas.clientHeight) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        render();
      };
      window.addEventListener("resize", resize);
      return () => { window.removeEventListener("resize", resize); renderer.dispose(); scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose()); else object.material.dispose(); } }); sceneRef.current = null; };
    } catch {
      window.setTimeout(() => setGraphicsAvailable(false), 0);
    }
  }, []);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    current.outfit.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
      if (object.userData.garment === "shirt") object.material.color.set(shirtColor);
      else if (object.userData.garment === "trousers") object.material.color.set(trouserColor);
      else if (object.userData.garment === "shoes") object.material.color.set(shoeColor);
    });
    current.renderer.render(current.scene, current.camera);
  }, [shirtColor, trouserColor, shoeColor]);

  useEffect(() => {
    const current = sceneRef.current;
    if (current) {
      current.outfit.rotation.y = viewAngles[view];
      current.renderer.render(current.scene, current.camera);
    }
  }, [view]);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="studio-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 id="studio-heading" className="text-2xl font-semibold text-ink">3D silhouette studio</h2><p className="mt-1 text-sm text-muted">Procedural shirt, trousers, and shoe geometry. Preview only; no fit claim.</p></div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Approximate 3D preview</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[var(--radius-card)] border border-border bg-[#eef1f2] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-ink" aria-live="polite">{view[0].toUpperCase() + view.slice(1)} view</p><div className="flex gap-2" role="group" aria-label="Preview angle">{(["front", "side", "back"] as View[]).map((option) => <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${view === option ? "bg-accent text-white" : "bg-white text-ink hover:bg-surface"}`}>{option}</button>)}</div></div>
          <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-b from-[#dfe8ea] to-[#f7f4ed]"><canvas ref={canvasRef} className="h-[30rem] w-full" aria-label="Approximate 3D mannequin wearing a shirt, trousers, and shoes" role="img" />{!graphicsAvailable && <div className="p-8 text-center text-sm text-muted">3D graphics are unavailable in this browser. Your wardrobe and planner remain usable.</div>}</div>
          <p className="mt-3 text-xs text-muted">Procedural geometry demonstrates color and silhouette only. It does not represent garment measurements, construction, or real-world fit.</p>
        </div>
        <aside className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface/80 p-5" aria-label="Preview controls"><div><h3 className="font-semibold text-ink">Colors</h3><p className="mt-1 text-xs leading-5 text-muted">Changes affect only this preview.</p></div>{[["Shirt", shirtColor, setShirtColor], ["Trousers", trouserColor, setTrouserColor], ["Shoes", shoeColor, setShoeColor]].map(([label, value, setter]) => <label key={label as string} className="flex items-center justify-between gap-3 text-sm text-ink">{label as string}<input type="color" aria-label={`${label as string} color`} value={value as string} onChange={(event) => (setter as (color: string) => void)(event.target.value)} className="h-9 w-12 cursor-pointer rounded border border-border bg-white p-1" /></label>)}<div className="border-t border-border pt-4 text-xs leading-5 text-muted"><strong className="text-ink">Supported now:</strong> one static desktop procedural model with front, side, and back views. Animation, body customization, model files, and mobile budgets are not included.</div></aside>
      </div>
    </section>
  );
}
