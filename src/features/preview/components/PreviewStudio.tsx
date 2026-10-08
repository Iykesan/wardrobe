"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import * as THREE from "three";
import { createMannequin, disposeMannequin } from "../mannequin";
import { createTShirt, disposeTShirt } from "../garments/tshirt";
import { createTrousers, disposeTrousers } from "../garments/trousers";
import { resolveOutfitPreview } from "../outfit-preview";
import { TSHIRT_MANIFEST, isManifestCompatible } from "../garments/manifest";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";

type View = "front" | "side" | "back";
const angles = { front: 0, side: Math.PI / 2, back: Math.PI };

type SceneState = { model: THREE.Group; shirt: THREE.Group; trousers: THREE.Group; camera: THREE.OrthographicCamera; render: () => void };
const CAMERA_DEFAULT = { azimuth: 0, elevation: 0.04, zoom: 1 };
const ELEVATION_LIMIT = 0.65;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.5;

export default function PreviewStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const [view, setView] = useState<View>("front");
  const [shirtVisible, setShirtVisible] = useState(true);
  const [failed, setFailed] = useState(false);
  const { items, outfits, isHydrated, initialize } = useWardrobe();
  const supportedItems = items.filter((item) => item.representation?.templateId === TSHIRT_MANIFEST.id);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedOutfitId, setSelectedOutfitId] = useState("");
  const cameraState = useRef({ ...CAMERA_DEFAULT });
  const dragState = useRef<{ x: number; y: number } | null>(null);
  const activePreview = selectedOutfitId ? resolveOutfitPreview({ outfitId: selectedOutfitId, outfits, items }) : null;
  const previewIssues = activePreview?.issues ?? [];

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
    scene.background = new THREE.Color("#cbd2d5");
    const camera = new THREE.OrthographicCamera(-3, 3, 4.4, -4.4, 0.1, 50);
    camera.position.set(0, 4.25, 16);
    camera.lookAt(0, 3.75, 0);
    scene.add(new THREE.HemisphereLight("#ffffff", "#737d88", 1.7));
    const key = new THREE.DirectionalLight("#fff7ed", 3);
    key.position.set(4, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 9, bottom: -5, far: 30 });
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#c9dcff", 0.8);
    fill.position.set(-5, 5, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight("#ffffff", 1.3);
    rim.position.set(-3, 7, -8);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const model = createMannequin();
    const shirt = createTShirt();
    const trousers = createTrousers();
    if (!isManifestCompatible(TSHIRT_MANIFEST, "wardrope-fashion-mannequin-v1")) {
      throw new Error("The T-shirt is not compatible with this mannequin.");
    }
    scene.add(model, shirt, trousers);
    const render = () => {
      renderer.render(scene, camera);
      canvas.dataset.rendered = "true";
      // Expose the real camera state so tests can assert actual orientation/zoom.
      canvas.dataset.cameraAzimuth = Math.atan2(camera.position.x, camera.position.z).toFixed(3);
      canvas.dataset.cameraElevation = camera.position.y.toFixed(3);
      canvas.dataset.cameraZoom = camera.zoom.toFixed(3);
    };
    sceneRef.current = { model, shirt, trousers, camera, render };
    const resize = () => {
      const aspect = canvas.clientWidth / canvas.clientHeight;
      const halfHeight = Math.max(3.95, 1.98 / aspect);
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
      disposeTrousers(trousers);
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
    const activeOutfit = selectedOutfitId ? resolveOutfitPreview({ outfitId: selectedOutfitId, outfits, items }) : null;
    const top = activeOutfit?.bySlot.top ?? (selected ? { itemId: selected.id, color: selected.representation?.color } : null);
    const bottom = activeOutfit?.bySlot.bottom ?? null;
    const color = top?.color;
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
    current.trousers.visible = Boolean(bottom);
    current.trousers.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => { if ("color" in material) (material as THREE.MeshStandardMaterial).color.set(bottom?.color || "#334155"); });
      }
    });
    current.render();
  }, [items, outfits, selectedItemId, selectedOutfitId, supportedItems]);

  useEffect(() => {
    const current = sceneRef.current;
    if (!current) return;
    current.model.rotation.y = angles[view];
    current.shirt.rotation.y = angles[view];
    current.shirt.visible = shirtVisible;
    current.render();
    if (canvasRef.current) canvasRef.current.dataset.view = view;
  }, [view, shirtVisible]);

  // Apply the orbit state to the real camera. The model keeps its preset
  // rotation; only the camera orbits, so drag and presets never fight.
  const applyCamera = useCallback(() => {
    const current = sceneRef.current;
    if (!current) return;
    const { azimuth, elevation, zoom } = cameraState.current;
    current.camera.position.set(Math.sin(azimuth) * 16, 4.25 + elevation * 5, Math.cos(azimuth) * 16);
    current.camera.lookAt(0, 3.75, 0);
    current.camera.zoom = zoom;
    current.camera.updateProjectionMatrix();
    current.render();
  }, []);

  // A native, non-passive wheel listener is required: React's onWheel is
  // passive, so it cannot preventDefault and the page scrolls while zooming.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraState.current.zoom = THREE.MathUtils.clamp(cameraState.current.zoom - event.deltaY * 0.001, ZOOM_MIN, ZOOM_MAX);
      applyCamera();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [applyCamera]);

  const resetCamera = () => {
    cameraState.current = { ...CAMERA_DEFAULT };
    setView("front");
    const current = sceneRef.current;
    if (current) {
      // Restore the preset orientation directly so reset also works when
      // "front" is already the selected view and the effect will not re-run.
      current.model.rotation.y = angles.front;
      current.shirt.rotation.y = angles.front;
    }
    applyCamera();
  };

  const selectView = (option: View) => {
    // A preset is a canonical orientation: reset the orbit offset so it stays
    // correct after a drag, even when the same view is clicked again.
    cameraState.current.azimuth = CAMERA_DEFAULT.azimuth;
    cameraState.current.elevation = CAMERA_DEFAULT.elevation;
    setView(option);
    applyCamera();
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    dragState.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const previous = dragState.current;
    if (!previous) return;
    cameraState.current.azimuth += (event.clientX - previous.x) * 0.012;
    cameraState.current.elevation = THREE.MathUtils.clamp(cameraState.current.elevation + (event.clientY - previous.y) * 0.008, -ELEVATION_LIMIT, ELEVATION_LIMIT);
    previous.x = event.clientX;
    previous.y = event.clientY;
    applyCamera();
  };
  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const step = Math.PI / 12;
    switch (event.key) {
      case "ArrowLeft":
        cameraState.current.azimuth -= step;
        break;
      case "ArrowRight":
        cameraState.current.azimuth += step;
        break;
      case "ArrowUp":
        cameraState.current.elevation = THREE.MathUtils.clamp(cameraState.current.elevation + 0.1, -ELEVATION_LIMIT, ELEVATION_LIMIT);
        break;
      case "ArrowDown":
        cameraState.current.elevation = THREE.MathUtils.clamp(cameraState.current.elevation - 0.1, -ELEVATION_LIMIT, ELEVATION_LIMIT);
        break;
      case "+":
      case "=":
        cameraState.current.zoom = THREE.MathUtils.clamp(cameraState.current.zoom + 0.1, ZOOM_MIN, ZOOM_MAX);
        break;
      case "-":
      case "_":
        cameraState.current.zoom = THREE.MathUtils.clamp(cameraState.current.zoom - 0.1, ZOOM_MIN, ZOOM_MAX);
        break;
      case "Home":
      case "0":
        resetCamera();
        return;
      default:
        return;
    }
    event.preventDefault();
    applyCamera();
  };

  return (
    <section aria-labelledby="studio-heading" className="space-y-5">
      <h2 id="studio-heading" className="text-2xl font-semibold">Fashion mannequin</h2>
      <p className="text-sm text-muted">Static white cotton T-shirt fitted over the neutral mannequin. No cloth physics or wardrobe data changes.</p>
      <div role="group" aria-label="Preview angle" className="flex gap-2">
        {(["front", "side", "back"] as View[]).map((option) => (
          <button type="button" key={option} aria-pressed={view === option} onClick={() => selectView(option)} className={`rounded-lg px-4 py-2 capitalize ${view === option ? "bg-accent text-white" : "bg-white text-ink"}`}>{option}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" aria-pressed={shirtVisible} onClick={() => setShirtVisible((visible) => !visible)} className="rounded-lg bg-white px-4 py-2 text-ink">{shirtVisible ? "Hide T-shirt" : "Show T-shirt"}</button>
        <button type="button" onClick={resetCamera} className="rounded-lg bg-white px-4 py-2 text-ink">Reset camera</button>
      </div>
      {isHydrated && outfits.length > 0 && (
        <label className="flex max-w-sm flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-ink">Saved outfit preview</span>
          <select aria-label="Saved outfit preview" value={selectedOutfitId} onChange={(event) => setSelectedOutfitId(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-ink">
            <option value="">Individual garment mode</option>
            {outfits.map((outfit) => <option key={outfit.id} value={outfit.id}>{outfit.name || "Unnamed outfit"}</option>)}
          </select>
        </label>
      )}
      {isHydrated && supportedItems.length > 0 && (
        <label className="flex max-w-sm flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-ink">Saved T-shirt representation</span>
          <select aria-label="Saved T-shirt representation" value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-ink">
            <option value="">Generic white template</option>
            {supportedItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      )}
      {previewIssues.length > 0 && (
        <ul role="status" className="space-y-1 text-sm text-warning">
          {previewIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>Preview note: {issue.code.replaceAll("-", " ")}</li>)}
        </ul>
      )}
      <p aria-live="polite" className="text-sm">{view[0].toUpperCase() + view.slice(1)} view</p>
      <p id="studio-camera-help" className="text-xs text-muted">Drag to orbit, scroll to zoom. With the viewer focused, arrow keys orbit, + and - zoom, and Home resets the camera.</p>
      <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onKeyDown={handleKeyDown} tabIndex={0} aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown + - Home" aria-describedby="studio-camera-help" role="img" aria-label="Neutral fashion mannequin wearing a white T-shirt" className="h-[620px] w-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
      {failed && <p role="alert">3D graphics are unavailable. Your wardrobe and planner remain usable.</p>}
      <p className="text-xs text-muted">Approximate garment fit, not a prediction of real-world sizing or fit. The shirt is a static lightweight prototype with built-in clearance around the body.</p>
    </section>
  );
}
