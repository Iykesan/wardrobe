"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createMannequin, disposeMannequin } from "../mannequin";
import { createTShirt, disposeTShirt } from "../garments/tshirt";

type View = "front" | "side" | "back";
const angles = { front: 0, side: Math.PI / 2, back: Math.PI };

type SceneState = { model: THREE.Group; shirt: THREE.Group; render: () => void };

export default function PreviewStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const [view, setView] = useState<View>("front");
  const [shirtVisible, setShirtVisible] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch {
      const timer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(timer);
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e1e5e7");
    const camera = new THREE.OrthographicCamera(-3, 3, 4.4, -4.4, 0.1, 50);
    camera.position.set(0, 4.25, 16);
    camera.lookAt(0, 3.75, 0);
    scene.add(new THREE.HemisphereLight("#ffffff", "#a2aab4", 2));
    const key = new THREE.DirectionalLight("#fff7ed", 3);
    key.position.set(4, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 9, bottom: -5, far: 30 });
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#dde9ff", 1.1);
    fill.position.set(-5, 5, -3);
    scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const model = createMannequin();
    const shirt = createTShirt();
    scene.add(model, shirt);
    const render = () => {
      renderer.render(scene, camera);
      canvas.dataset.rendered = "true";
    };
    sceneRef.current = { model, shirt, render };
    const resize = () => {
      const aspect = canvas.clientWidth / canvas.clientHeight;
      const halfHeight = Math.max(4.4, 2.2 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      sceneRef.current = null;
      disposeMannequin(model);
      disposeTShirt(shirt);
      floor.geometry.dispose();
      floor.material.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    current.model.rotation.y = angles[view];
    current.shirt.rotation.y = angles[view];
    current.shirt.visible = shirtVisible;
    current.render();
    if (canvasRef.current) canvasRef.current.dataset.view = view;
  }, [view, shirtVisible]);

  return (
    <section aria-labelledby="studio-heading" className="space-y-5">
      <h2 id="studio-heading" className="text-2xl font-semibold">Fashion mannequin</h2>
      <p className="text-sm text-muted">Static white cotton T-shirt fitted over the neutral mannequin. No cloth physics or wardrobe data changes.</p>
      <div role="group" aria-label="Preview angle" className="flex gap-2">
        {(["front", "side", "back"] as View[]).map((option) => (
          <button type="button" key={option} aria-pressed={view === option} onClick={() => setView(option)} className={`rounded-lg px-4 py-2 capitalize ${view === option ? "bg-accent text-white" : "bg-white text-ink"}`}>{option}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" aria-pressed={shirtVisible} onClick={() => setShirtVisible((visible) => !visible)} className="rounded-lg bg-white px-4 py-2 text-ink">{shirtVisible ? "Hide T-shirt" : "Show T-shirt"}</button>
      </div>
      <p aria-live="polite" className="text-sm">{view[0].toUpperCase() + view.slice(1)} view</p>
      <canvas ref={canvasRef} role="img" aria-label="Neutral fashion mannequin wearing a white T-shirt" className="h-[620px] w-full rounded-2xl" />
      {failed && <p role="alert">3D graphics are unavailable. Your wardrobe and planner remain usable.</p>}
      <p className="text-xs text-muted">Approximate garment fit, not a prediction of real-world sizing or fit. The shirt is a static lightweight prototype with built-in clearance around the body.</p>
    </section>
  );
}
