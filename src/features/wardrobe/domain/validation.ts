import { z } from "zod";
import { isValidDateOnly } from "@/shared/lib/dates";

const id = z.string().min(1);
const name = z.string().trim().min(1, "Name cannot be empty.");
const optionalText = z.string().optional();
const category = z.object({ id, name, order: z.number().int().nonnegative() });
const subcategory = category.extend({ categoryId: id });
const item = z.object({
  id, name, categoryId: id, subcategoryId: id,
  createdAt: z.string().datetime(), isFavorite: z.boolean(),
  visualKey: optionalText, color: optionalText, fit: optionalText,
  season: optionalText, notes: optionalText,
});
const outfit = z.object({
  id, name: optionalText, itemIds: z.array(id).min(1, "Select at least one item."),
  isFavorite: z.boolean(), createdAt: z.string().datetime(),
});
const plan = z.object({
  id, outfitId: id, plannedDate: z.string().refine(isValidDateOnly, "Choose a valid calendar date."),
  description: optionalText, createdAt: z.string().datetime(),
});

export const wardrobeDataSchema = z.object({
  categories: z.array(category), subcategories: z.array(subcategory),
  items: z.array(item), outfits: z.array(outfit), plans: z.array(plan),
  setupComplete: z.boolean(),
}).superRefine((data, context) => {
  const fail = (message: string) => context.addIssue({ code: "custom", message });
  const unique = (values: string[], message: string) => {
    if (new Set(values).size !== values.length) fail(message);
  };
  const normalize = (value: string) => value.trim().toLowerCase();
  for (const records of [data.categories, data.subcategories, data.items, data.outfits, data.plans]) {
    unique(records.map((record) => record.id), "Record IDs must be unique.");
  }
  unique(data.categories.map((entry) => normalize(entry.name)), "That category already exists.");
  const categories = new Set(data.categories.map((entry) => entry.id));
  const subcategories = new Map(data.subcategories.map((entry) => [entry.id, entry]));
  const items = new Set(data.items.map((entry) => entry.id));
  const outfits = new Set(data.outfits.map((entry) => entry.id));
  for (const categoryId of categories) {
    unique(data.subcategories.filter((entry) => entry.categoryId === categoryId).map((entry) => normalize(entry.name)), "That subcategory already exists.");
  }
  for (const entry of data.subcategories) {
    if (!categories.has(entry.categoryId)) fail("Subcategory must belong to an existing category.");
  }
  for (const entry of data.items) {
    if (!categories.has(entry.categoryId) || subcategories.get(entry.subcategoryId)?.categoryId !== entry.categoryId) {
      fail("Item category and subcategory must exist and belong together.");
    }
  }
  for (const entry of data.outfits) {
    unique(entry.itemIds, "An outfit cannot contain the same item twice.");
    if (entry.itemIds.some((itemId) => !items.has(itemId))) fail("Outfits can only contain owned items.");
  }
  unique(data.plans.map((entry) => entry.plannedDate), "Only one outfit can be planned per date.");
  if (data.plans.some((entry) => !outfits.has(entry.outfitId))) fail("A plan must reference an existing outfit.");
});

export type WardrobeData = z.infer<typeof wardrobeDataSchema>;

export function validateWardrobeData(value: unknown): WardrobeData {
  const result = wardrobeDataSchema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}
