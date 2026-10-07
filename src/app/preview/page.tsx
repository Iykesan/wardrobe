import Link from "next/link";

const prototypeBoundaries = [
  "Uses one local wardrobe and does not require an account or cloud sync.",
  "Keeps clothing and outfit records unchanged; this page does not create inventory.",
  "Treats any future avatar or garment rendering as approximate, not a fit or measurement claim.",
];

export default function PreviewPage() {
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Phase 3 feasibility prototype
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Outfit preview is not enabled yet
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          This entry point reserves a safe place for a future avatar and 3D
          preview. The wardrobe, outfits, and planner continue to work without
          graphics support or model assets.
        </p>
      </header>

      <section
        aria-labelledby="prototype-status"
        className="rounded-[var(--radius-card)] border border-border bg-surface/80 p-6"
      >
        <h2 id="prototype-status" className="text-xl font-semibold text-ink">
          Current prototype status
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          No rendering engine, avatar model, or clothing asset is loaded by
          this page. Asset formats, licensing, supported body ranges, and
          performance budgets must be reviewed before adding those pieces.
        </p>
        <ul className="mt-5 flex max-w-2xl flex-col gap-3 text-sm text-ink">
          {prototypeBoundaries.map((boundary) => (
            <li key={boundary} className="flex gap-3 leading-6">
              <span aria-hidden="true" className="text-accent">•</span>
              <span>{boundary}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="continue-using-wardrobe" className="flex flex-col gap-3">
        <h2 id="continue-using-wardrobe" className="text-xl font-semibold text-ink">
          Continue using your wardrobe
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Add and edit owned items, assemble outfits, and plan dates as usual.
          Preview work will be additive and must not change those records.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/wardrobe"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open wardrobe
          </Link>
          <Link
            href="/outfits"
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
          >
            Open outfits
          </Link>
        </div>
      </section>
    </main>
  );
}
