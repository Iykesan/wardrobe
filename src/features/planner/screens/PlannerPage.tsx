"use client";

import { CalendarDays } from "lucide-react";
import { useOutfits } from "@/features/outfits/hooks/useOutfits";
import CalendarView from "@/features/planner/components/CalendarView";
import { usePlanner } from "@/features/planner/hooks/usePlanner";
import StorageRecovery from "@/features/wardrobe/components/StorageRecovery";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import { useWardrobeInit } from "@/features/wardrobe/hooks/useWardrobeInit";
import Button from "@/shared/components/common/Button";
import InlineNotice from "@/shared/components/common/InlineNotice";
import { useFeedback } from "@/shared/hooks/useFeedback";

export default function PlannerPage() {
  useWardrobeInit();
  const { outfits } = useOutfits();
  const { plans, addPlan, removePlan } = usePlanner();
  const {
    items,
    isHydrated,
    isLoading,
    error,
    setError,
    storageStatus,
    conflict,
    reloadFromDisk,
  } = useWardrobe();
  const { feedback, show, clear } = useFeedback();

  const handleAddPlan = async (payload: {
    plannedDate: string;
    outfitId: string;
    description?: string;
  }) => {
    const existing = plans.find((plan) => plan.plannedDate === payload.plannedDate);
    await addPlan(payload);
    show({
      type: "success",
      message: existing ? "Plan updated." : "Plan scheduled.",
    });
  };

  const handleRemovePlan = async (id: string) => {
    try {
      await removePlan(id);
      show({ type: "success", message: "Plan removed." });
    } catch (removeError) {
      show({
        type: "error",
        message:
          removeError instanceof Error
            ? removeError.message
            : "Unable to remove plan.",
      });
      throw removeError;
    }
  };

  if (!isHydrated) {
    return <InlineNotice>Loading planner...</InlineNotice>;
  }

  if (storageStatus === "recovery-required" || storageStatus === "unavailable") {
    return (
      <div className="flex flex-col gap-8">
        <StorageRecovery />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {(isLoading || error || feedback || conflict) && (
        <div className="flex flex-col gap-3">
          {isLoading && <InlineNotice>Loading planner...</InlineNotice>}
          {conflict && (
            <InlineNotice variant="error">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{conflict.message}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void reloadFromDisk()}
                >
                  Reload
                </Button>
              </div>
            </InlineNotice>
          )}
          {error && (
            <InlineNotice variant="error" onDismiss={() => setError(undefined)}>
              {error}
            </InlineNotice>
          )}
          {feedback && (
            <InlineNotice variant={feedback.type} onDismiss={clear}>
              {feedback.message}
            </InlineNotice>
          )}
        </div>
      )}
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <CalendarDays size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Planner</h1>
          <p className="text-sm text-muted">Assign outfits to future dates.</p>
        </div>
      </header>

      {outfits.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-sm text-muted">
          Save an outfit before planning your week.
        </div>
      ) : (
        <CalendarView
          outfits={outfits}
          items={items}
          plans={plans}
          onAddPlan={handleAddPlan}
          onRemovePlan={handleRemovePlan}
        />
      )}
    </div>
  );
}
