"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import Button from "@/shared/components/common/Button";
import OutfitVisual from "@/features/outfits/components/OutfitVisual";
import { confirmAction } from "@/shared/lib/confirm";
import { calendarDate, isValidDateOnly } from "@/shared/lib/dates";
import { formatISODate, formatShortDate } from "@/shared/lib/utils";
import type { Outfit, PlanEntry, WardrobeItem } from "@/shared/types";

type CalendarViewProps = {
  outfits: Outfit[];
  items: WardrobeItem[];
  plans: PlanEntry[];
  onAddPlan: (payload: {
    plannedDate: string;
    outfitId: string;
    description?: string;
  }) => void | Promise<void>;
  onRemovePlan: (id: string) => void | Promise<void>;
};

export default function CalendarView({
  outfits,
  items,
  plans,
  onAddPlan,
  onRemovePlan,
}: CalendarViewProps) {
  const [todayIso, setTodayIso] = useState(() => formatISODate(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [draft, setDraft] = useState<{ outfitId: string; description: string } | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setTodayIso(formatISODate(new Date()));
      clearTimeout(timer);
      const nextDay = addDays(startOfDay(new Date()), 1);
      timer = setTimeout(refresh, Math.max(1, nextDay.getTime() - Date.now()));
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const upcomingDays = useMemo(() => {
    const today = calendarDate(todayIso);
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }, [todayIso]);

  const planByDate = useMemo(() => {
    const map = new Map<string, PlanEntry>();
    plans.forEach((plan) => map.set(plan.plannedDate, plan));
    return map;
  }, [plans]);

  const itemsById = useMemo(() => {
    const map = new Map<string, WardrobeItem>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const currentPlan = planByDate.get(selectedDate);
  const selectedOutfitId = draft?.outfitId ?? currentPlan?.outfitId ?? "";
  const description = draft?.description ?? currentPlan?.description ?? "";
  const changeDraft = (change: Partial<NonNullable<typeof draft>>) =>
    setDraft({ outfitId: selectedOutfitId, description, ...change });
  const upcomingPlans = useMemo(
    () =>
      plans
        .filter((plan) => plan.plannedDate >= todayIso)
        .slice()
        .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)),
    [plans, todayIso],
  );

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setDraft(null);
    setError(undefined);
  };

  const handleRemovePlan = async (id: string) => {
    if (!confirmAction("Remove this plan?")) return;
    const removed = plans.find((plan) => plan.id === id);
    try {
      await onRemovePlan(id);
      if (removed?.plannedDate === selectedDate) setDraft(null);
      setError(undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to remove plan.");
    }
  };

  const handleEditPlan = (plan: PlanEntry) => {
    setSelectedDate(plan.plannedDate);
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
          <div>
            <div className="text-sm font-semibold text-ink">Plan an outfit</div>
            <p className="text-xs text-muted">
              Assign a saved outfit to a future date.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="font-medium text-ink">Date</span>
              <input
                className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                type="date"
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="font-medium text-ink">Outfit</span>
              <select
                className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={selectedOutfitId}
                onChange={(event) => changeDraft({ outfitId: event.target.value })}
              >
                <option value="">Select an outfit</option>
                {outfits.map((outfit) => (
                  <option key={outfit.id} value={outfit.id}>
                    {outfit.name || "Untitled outfit"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="font-medium text-ink">Notes (optional)</span>
              <textarea
                className="min-h-[88px] rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={description}
                onChange={(event) => changeDraft({ description: event.target.value })}
              />
            </label>

            {!isValidDateOnly(selectedDate) && <p role="alert" className="text-sm text-danger">Choose a valid calendar date.</p>}
            <Button
              type="button"
              onClick={async () => {
                try {
                  await onAddPlan({
                    plannedDate: selectedDate,
                    outfitId: selectedOutfitId,
                    description: description.trim() || undefined,
                  });
                  setDraft(null);
                  setError(undefined);
                } catch (error) {
                  setError(error instanceof Error ? error.message : "Unable to save plan.");
                }
              }}
              disabled={!selectedOutfitId || !isValidDateOnly(selectedDate)}
            >
              {currentPlan ? "Update plan" : "Schedule outfit"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
          <div className="text-sm font-semibold text-ink">Upcoming week</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {upcomingDays.map((day) => {
              const iso = formatISODate(day);
              const plan = planByDate.get(iso);
              const outfit = outfits.find((item) => item.id === plan?.outfitId);
              const outfitItems = outfit
                ? outfit.itemIds
                    .map((itemId) => itemsById.get(itemId))
                    .filter((item): item is WardrobeItem => item !== undefined)
                : [];
              return (
                <div
                  key={iso}
                  className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-border bg-surface/70 p-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {formatShortDate(day)}
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {outfit?.name ?? "No outfit yet"}
                  </div>
                  {outfitItems.length > 0 && (
                    <OutfitVisual
                      items={outfitItems}
                      compact
                    />
                  )}
                  {plan?.description && (
                    <p className="text-xs text-muted">{plan.description}</p>
                  )}
                  {plan && (
                    <button
                      className="mt-auto text-xs font-semibold text-danger"
                      onClick={() => handleRemovePlan(plan.id)}
                      type="button"
                    >
                      Remove plan
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
          <div className="mb-3 text-sm font-semibold text-ink">All upcoming plans</div>
          <div className="grid gap-3">
            {upcomingPlans.length === 0 ? (
              <div className="text-sm text-muted">
                No outfits scheduled yet. Pick a date to start planning.
              </div>
            ) : (
              upcomingPlans.map((plan) => {
                const outfit = outfits.find((item) => item.id === plan.outfitId);
                return (
                  <div
                    key={plan.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-ink">
                        {formatShortDate(plan.plannedDate)}
                      </div>
                      <div className="text-xs text-muted">
                        {outfit?.name ?? "Untitled outfit"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {plan.description && (
                        <span className="text-xs text-muted">{plan.description}</span>
                      )}
                      <button
                        className="text-xs font-semibold text-ink"
                        onClick={() => handleEditPlan(plan)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-semibold text-danger"
                        onClick={() => handleRemovePlan(plan.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
  );
}
