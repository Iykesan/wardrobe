import PreviewStudio from "@/features/preview/components/PreviewStudio";

export default function PreviewPage() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Phase 3 feasibility prototype
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Preview a simple outfit silhouette
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          This desktop-first prototype uses lightweight procedural shapes to explore
          color, silhouette, and viewing angles. It does not load external models
          or claim accurate sizing, construction, or fit.
        </p>
      </header>
      <PreviewStudio />
    </main>
  );
}
