"use client";

import { useMemo, useState } from "react";

type View = "front" | "side" | "back";

const viewRotation: Record<View, string> = {
  front: "rotateY(0deg)",
  side: "rotateY(68deg)",
  back: "rotateY(180deg)",
};

export default function PreviewStudio() {
  const [view, setView] = useState<View>("front");
  const [shirtColor, setShirtColor] = useState("#4f6d7a");
  const [trouserColor, setTrouserColor] = useState("#334155");
  const [shoeColor, setShoeColor] = useState("#20242b");

  const viewLabel = useMemo(() => `${view[0].toUpperCase()}${view.slice(1)} view`, [view]);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="studio-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="studio-heading" className="text-2xl font-semibold text-ink">
            Silhouette studio
          </h2>
          <p className="mt-1 text-sm text-muted">
            Procedural shirt, trousers, and shoe shapes. Preview only; no fit claim.
          </p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          Approximate preview
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[var(--radius-card)] border border-border bg-[#eef1f2] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink" aria-live="polite">{viewLabel}</p>
            <div className="flex gap-2" role="group" aria-label="Preview angle">
              {(["front", "side", "back"] as View[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    view === option ? "bg-accent text-white" : "bg-white text-ink hover:bg-surface"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex min-h-[30rem] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#dfe8ea] to-[#f7f4ed] [perspective:900px]">
            <div
              className="relative h-[25rem] w-52 transition-transform duration-500 [transform-style:preserve-3d]"
              style={{ transform: `${viewRotation[view]} scaleX(${view === "side" ? 0.72 : 1})` }}
              aria-label={`Approximate mannequin showing ${viewLabel.toLowerCase()}`}
              role="img"
            >
              <div className="absolute left-1/2 top-2 h-16 w-14 -translate-x-1/2 rounded-[45%] bg-[#c99578] shadow-inner" />
              <div className="absolute left-1/2 top-16 h-9 w-24 -translate-x-1/2 rounded-t-[45%] bg-[#352e2d]" />
              <div className="absolute left-1/2 top-[4.5rem] h-36 w-36 -translate-x-1/2 rounded-[38%_38%_25%_25%] shadow-lg" style={{ backgroundColor: shirtColor }} />
              <div className="absolute left-3 top-[5rem] h-28 w-12 -rotate-[10deg] rounded-full shadow-md" style={{ backgroundColor: shirtColor }} />
              <div className="absolute right-3 top-[5rem] h-28 w-12 rotate-[10deg] rounded-full shadow-md" style={{ backgroundColor: shirtColor }} />
              <div className="absolute left-1/2 top-[13.5rem] h-36 w-[4.25rem] -translate-x-[4.5rem] rounded-b-xl shadow-lg" style={{ backgroundColor: trouserColor }} />
              <div className="absolute left-1/2 top-[13.5rem] h-36 w-[4.25rem] translate-x-[0.25rem] rounded-b-xl shadow-lg" style={{ backgroundColor: trouserColor }} />
              <div className="absolute left-1/2 top-[22rem] h-7 w-20 -translate-x-[4.75rem] -skew-x-12 rounded-full shadow-lg" style={{ backgroundColor: shoeColor }} />
              <div className="absolute left-1/2 top-[22rem] h-7 w-20 translate-x-[0.75rem] -skew-x-12 rounded-full shadow-lg" style={{ backgroundColor: shoeColor }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            The shape is a lightweight desktop prototype. It does not represent garment measurements, construction, or real-world fit.
          </p>
        </div>

        <aside className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface/80 p-5" aria-label="Preview controls">
          <div>
            <h3 className="font-semibold text-ink">Colors</h3>
            <p className="mt-1 text-xs leading-5 text-muted">Color changes affect only this preview.</p>
          </div>
          {[
            ["Shirt", shirtColor, setShirtColor],
            ["Trousers", trouserColor, setTrouserColor],
            ["Shoes", shoeColor, setShoeColor],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="flex items-center justify-between gap-3 text-sm text-ink">
              {label as string}
              <input
                type="color"
                aria-label={`${label as string} color`}
                value={value as string}
                onChange={(event) => (setter as (color: string) => void)(event.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-border bg-white p-1"
              />
            </label>
          ))}
          <div className="border-t border-border pt-4 text-xs leading-5 text-muted">
            <strong className="text-ink">Supported now:</strong> one static desktop silhouette with front, side, and back views. Animation, body customization, model files, and mobile budgets are not included.
          </div>
        </aside>
      </div>
    </section>
  );
}
