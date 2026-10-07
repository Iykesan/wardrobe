"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type View = "front" | "side" | "back";

const viewAngles: Record<View, number> = { front: 0, side: Math.PI / 2, back: Math.PI };

function roundedBox(width: number, height: number, depth: number, color: string) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createOutfit(shirtColor: string, trouserColor: string, shoeColor: string) {
  const outfit = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: "#c99578", roughness: 0.9 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 16), skin);
  head.position.y = 3.65;
  head.scale.set(0.88, 1.1, 0.88);
  outfit.add(head);

  const shirt = roundedBox(1.65, 1.55, 0.82, shirtColor);
  shirt.position.y = 2.35;
  shirt.geometry.translate(0, 0.04, 0);
  outfit.add(shirt);

  for (const side of [-1, 1]) {
    const arm = roundedBox(0.42, 1.35, 0.46, shirtColor);
    arm.position.set(side * 1.08, 2.38, 0);
    arm.rotation.z = side * -0.12;
    outfit.add(arm);

    const leg = roundedBox(0.62, 1.65, 0.62, trouserColor);
    leg.position.set(side * 0.43, 0.82, 0);
    outfit.add(leg);

    const shoe = roundedBox(0.72, 0.32, 1.12, shoeColor);
    shoe.position.set(side * 0.43, -0.18, 0.18);
    outfit.add(shoe);
  }

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.28, 16), skin);
  neck.position.y = 3.04;
  outfit.add(neck);
  return outfit;
}

export default function PreviewStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ outfit: THREE.Group; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer } | null>(null);
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
      camera.position.set(0, 2, 9);
      camera.lookAt(0, 1.8, 0);
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
      sceneRef.current = { outfit, camera, renderer };
      const resize = () => {
        if (!canvas.clientWidth || !canvas.clientHeight) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      };
      window.addEventListener("resize", resize);
      let frame = 0;
      const render = () => { frame = requestAnimationFrame(render); renderer.render(scene, camera); };
      render();
      return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); renderer.dispose(); scene.traverse((object) => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose()); else object.material.dispose(); } }); sceneRef.current = null; };
    } catch {
      window.setTimeout(() => setGraphicsAvailable(false), 0);
    }
  }, []);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    current.outfit.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
      if (object.position.y > 1.6 && object.position.y < 3.1) object.material.color.set(shirtColor);
      else if (object.position.y >= 0.5 && object.position.y < 1.6) object.material.color.set(trouserColor);
      else if (object.position.y < 0.5 && object.position.x !== 0) object.material.color.set(shoeColor);
    });
  }, [shirtColor, trouserColor, shoeColor]);

  useEffect(() => {
    const current = sceneRef.current;
    if (current) current.outfit.rotation.y = viewAngles[view];
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
