"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import Button from "@/shared/components/common/Button";
import InputField from "@/shared/components/common/InputField";
import Modal from "@/shared/components/common/Modal";
import { itemSchema } from "@/shared/lib/validation";
import type { Category, Subcategory, WardrobeItem } from "@/shared/types";

type ItemFormValues = {
  name: string;
  categoryId: string;
  subcategoryId: string;
  visualKey?: string;
  color?: string;
  fit?: string;
  season?: string;
  notes?: string;
  representation?: WardrobeItem["representation"];
};

type ItemFormProps = {
  open: boolean;
  categories: Category[];
  subcategories: Subcategory[];
  initial?: WardrobeItem;
  onClose: () => void;
  onSave: (values: ItemFormValues) => void | Promise<void>;
};

export default function ItemForm({
  open,
  categories,
  subcategories,
  initial,
  onClose,
  onSave,
}: ItemFormProps) {
  const defaultCategoryId = initial?.categoryId ?? categories[0]?.id ?? "";
  const defaultSubcategoryId =
    initial?.subcategoryId ??
    subcategories.find((subcategory) => subcategory.categoryId === defaultCategoryId)
      ?.id ??
    "";
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      categoryId: defaultCategoryId,
      subcategoryId: defaultSubcategoryId,
      visualKey: initial?.visualKey ?? "",
      color: initial?.color ?? "",
      fit: initial?.fit ?? "",
      season: initial?.season ?? "",
      representation: initial?.representation,
    },
  });

  const [showDetails, setShowDetails] = useState(
    Boolean(initial?.color || initial?.fit || initial?.season || initial?.notes),
  );
  const [templateId, setTemplateId] = useState<NonNullable<WardrobeItem["representation"]>["templateId"]>(initial?.representation?.templateId ?? "wardrope.tshirt");
  const representation = useWatch({ control, name: "representation" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const availableSubcategories = useMemo(
    () =>
      subcategories.filter((subcategory) => subcategory.categoryId === categoryId),
    [categoryId, subcategories],
  );

  const categoryRegister = register("categoryId", {
    onChange: (event) => {
      const nextCategoryId = event.target.value as string;
      const fallback = subcategories.find(
        (subcategory) => subcategory.categoryId === nextCategoryId,
      )?.id;
      if (!fallback) return;
      setValue("subcategoryId", fallback);
    },
  });
  const subcategoryRegister = register("subcategoryId");

  const submitHandler = handleSubmit(async (values) => {
    const result = itemSchema.safeParse({
      ...values,
      representation: values.representation
        ? {
            templateId,
            fidelity: "customized-template",
            color: values.representation.color,
          }
        : undefined,
    });
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ItemFormValues;
        setError(field, { message: issue.message });
      });
      return;
    }
    try {
      await onSave(result.data);
      onClose();
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Unable to save item." });
    }
  });

  return (
    <Modal
      open={open}
      title={initial ? "Edit item" : "Add item"}
      onClose={onClose}
    >
      <form className="flex flex-col gap-4" onSubmit={submitHandler}>
        <input type="hidden" {...register("visualKey")} />

        <InputField
          label="Item name"
          placeholder="Blue denim jacket"
          error={errors.name?.message}
          {...register("name", {
            onChange: () => {
              // Clear custom visual key so the subcategory icon stays in sync.
              setValue("visualKey", "");
            },
          })}
        />

        <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="item-category">
          <span className="font-medium text-ink">Category</span>
          <select
            id="item-category"
            className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-invalid={errors.categoryId ? true : undefined}
            aria-describedby={errors.categoryId ? "item-category-error" : undefined}
            {...categoryRegister}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId?.message && (
            <span id="item-category-error" role="alert" className="text-xs text-danger">
              {errors.categoryId.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="item-subcategory">
          <span className="font-medium text-ink">Subcategory</span>
          <select
            id="item-subcategory"
            className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-invalid={errors.subcategoryId ? true : undefined}
            aria-describedby={errors.subcategoryId ? "item-subcategory-error" : undefined}
            {...subcategoryRegister}
          >
            <option value="" disabled>
              Select a subcategory
            </option>
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          {errors.subcategoryId?.message && (
            <span id="item-subcategory-error" role="alert" className="text-xs text-danger">
              {errors.subcategoryId.message}
            </span>
          )}
        </label>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/60 p-4">
          <div>
            <div className="text-sm font-semibold text-ink">3D preview template</div>
            <p className="text-xs text-muted">Optional generic T-shirt template. This does not create another wardrobe item.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setValue("representation", { templateId: "wardrope.tshirt", fidelity: "customized-template", color: "White" })}>
            Add
          </Button>
        </div>
        {representation && (
          <div className="grid gap-3 rounded-xl border border-border bg-surface/60 p-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="font-medium text-ink">Template</span>
              <select aria-label="3D template" value={templateId} onChange={(event) => setTemplateId(event.target.value as NonNullable<WardrobeItem["representation"]>["templateId"])} className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink">
              <option value="wardrope.tshirt">Regular T-shirt</option>
              <option value="wardrope.trousers">Trousers</option>
              <option value="wardrope.jeans">Straight-leg jeans (asset unavailable)</option>
              <option value="wardrope.sneakers">Low-top sneakers (asset unavailable)</option>
            </select>
            </label>
            <InputField label="Preview color" defaultValue={initial?.representation?.color ?? "White"} {...register("representation.color" as never)} />
          </div>
        )}


        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-surface/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ink">Extra details</div>
              <p className="text-xs text-muted">
                Optional. Add color, fit, season, or notes when you have time.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              {showDetails ? "Hide" : "Add details"}
            </Button>
          </div>

          {showDetails && (
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField label="Color" {...register("color")} />
              <InputField label="Fit" {...register("fit")} />
              <InputField label="Season" {...register("season")} />
              <label className="flex flex-col gap-1 text-sm text-muted sm:col-span-2">
                <span className="font-medium text-ink">Notes</span>
                <textarea
                  className="min-h-[96px] rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  {...register("notes")}
                />
              </label>
            </div>
          )}
        </div>

        {errors.root && <p role="alert" className="text-sm text-danger">{errors.root.message}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>{initial ? "Save changes" : "Save item"}</Button>
        </div>
      </form>
    </Modal>
  );
}
