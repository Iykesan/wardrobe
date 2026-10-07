"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Layers, Shirt, Settings, Sparkles } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";

const navItems = [
  { label: "Wardrobe", href: "/wardrobe", icon: Shirt },
  { label: "Outfits", href: "/outfits", icon: Layers },
  { label: "Plan", href: "/plan", icon: CalendarDays },
  { label: "Preview", href: "/preview", icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col gap-8 rounded-[var(--radius-card)] border border-border bg-surface/90 px-5 py-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          Wardrobe Suite
        </span>
        <div className="text-2xl font-semibold text-ink">{APP_NAME}</div>
        <p className="text-sm text-muted">
          Organize, combine, and plan what you wear.
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-ink hover:bg-white/70"
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href="/setup"
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
            pathname === "/setup"
              ? "bg-accent-soft text-accent"
              : "text-muted hover:bg-white/70 hover:text-ink"
          }`}
        >
          <Settings size={18} strokeWidth={1.8} />
          Setup
        </Link>
        <div className="rounded-xl border border-border/60 bg-white/80 p-3 text-xs text-muted">
          <div className="font-semibold text-ink">MVP Mode</div>
          <div className="mt-1">Single-user, clean, and fast.</div>
        </div>
      </div>
    </aside>
  );
}
