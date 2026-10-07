"use client";

import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import * as THREE from "three";
import { createMannequin, disposeMannequin } from "../mannequin";
import { createTShirt, disposeTShirt } from "../garments/tshirt";
import { TSHIRT_MANIFEST, isManifestCompatible } from "../garments/manifest";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";

type View = "front" | "side" | "back";
const angles = { front: 0, side: Math.PI / 2, back: Math.PI };

type SceneState = { model: THREE.Group; shirt: THREE.Group; camera: THREE.OrthographicCamera; render: () => void };
const CAMERA_DEFAULT = { azimuth: 0, elevation: 0.04, zoom: 1 };

export default function PreviewStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const [view, setView] = useState<View>("front");
  const [shirtVisible, setShirtVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const { items, isHydrated, initialize } = useWardrobe();
  const supportedItems = items.filter((item) => item.representation?.templateId === TSHIRT_MANIFEST.id);
  const [selectedItemId, setSelectedItemId] = useState("");
  const cameraState = useRef({ ...CAMERA_DEFAULT });
  const dragState = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isHydrated) void initialize();
  }, [initialize, isHydrated]);

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
    if (!isManifestCompatible(TSHIRT_MANIFEST, "wardrope-fashion-mannequin-v1")) {
      throw new Error("The T-shirt is not compatible with this mannequin.");
    }
    scene.add(model, shirt);
    const render = () => {
      renderer.render(scene, camera);
      canvas.dataset.rendered = "true";
    };
    sceneRef.current = { model, shirt, camera, render };
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
    const selected = supportedItems.find((item) => item.id === selectedItemId);
    const color = selected?.representation?.color;
    current.shirt.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => { if ("color" in material) (material as THREE.MeshStandardMaterial).color.set(color || "#ffffff"); });
      }
    });
    if (color) {
      try {
        const parsed = new THREE.Color(color);
        current.shirt.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => { if ("color" in material) (material as THREE.MeshStandardMaterial).color.copy(parsed); });
          }
        });
      } catch {
        // Keep the garment's safe white default for unrecognized user text.
      }
    }
    current.render();
  }, [selectedItemId, supportedItems]);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    current.model.rotation.y = angles[view];
    current.shirt.rotation.y = angles[view];
    current.shirt.visible = shirtVisible;
    current.render();
    if (canvasRef.current) canvasRef.current.dataset.view = view;
  }, [view, shirtVisible]);

  const resetCamera = () => {
    cameraState.current = { ...CAMERA_DEFAULT };
    setView("front");
    const current = sceneRef.current;
    if (current) {
      current.camera.zoom = 1;
      current.camera.position.set(0, 4.25, 16);
      current.camera.lookAt(0, 3.75, 0);
      current.camera.updateProjectionMatrix();
      current.render();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const previous = dragState.current;
    const current = sceneRef.current;
    if (!previous || !current) return;
    cameraState.current.azimuth += (event.clientX - previous.x) * 0.012;
    cameraState.current.elevation = THREE.MathUtils.clamp(cameraState.current.elevation + (event.clientY - previous.y) * 0.008, -0.65, 0.65);
    previous.x = event.clientX;
    previous.y = event.clientY;
    current.model.rotation.y = cameraState.current.azimuth;
    current.shirt.rotation.y = cameraState.current.azimuth;
    current.camera.position.set(Math.sin(cameraState.current.azimuth) * 16, 4.25 + cameraState.current.elevation * 5, Math.cos(cameraState.current.azimuth) * 16);
    current.camera.lookAt(0, 3.75, 0);
    current.render();
  };
  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    const current = sceneRef.current;
    if (!current) return;
    cameraState.current.zoom = THREE.MathUtils.clamp(cameraState.current.zoom - event.deltaY * 0.001, 0.75, 1.5);
    current.camera.zoom = cameraState.current.zoom;
    current.camera.updateProjectionMatrix();
    current.render();
  };

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
        <button type="button" onClick={resetCamera} className="rounded-lg bg-white px-4 py-2 text-ink">Reset camera</button>
      </div>
      {isHydrated && supportedItems.length > 0 && (
        <label className="flex max-w-sm flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-ink">Saved T-shirt representation</span>
          <select aria-label="Saved T-shirt representation" value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-ink">
            <option value="">Generic white template</option>
            {supportedItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      )}
      <p aria-live="polite" className="text-sm">{view[0].toUpperCase() + view.slice(1)} view</p>
      <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel} role="img" aria-label="Neutral fashion mannequin wearing a white T-shirt" className="h-[620px] w-full rounded-2xl" />
      {failed && <p role="alert">3D graphics are unavailable. Your wardrobe and planner remain usable.</p>}
      <p className="text-xs text-muted">Approximate garment fit, not a prediction of real-world sizing or fit. The shirt is a static lightweight prototype with built-in clearance around the body.</p>
    </section>
  );
}
