import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
});

export const subcategorySchema = z.object({
  categoryId: z.string().min(1, "Category selection is required."),
  name: z.string().trim().min(1, "Subcategory name is required."),
});

export const itemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  categoryId: z.string().min(1, "Category is required."),
  subcategoryId: z.string().min(1, "Subcategory is required."),
  visualKey: z.string().optional(),
  color: optionalText,
  fit: optionalText,
  season: optionalText,
  notes: optionalText,
  representation: z.object({
    templateId: z.literal("wardrope.tshirt"),
    fidelity: z.literal("customized-template"),
    color: optionalText,
  }).optional(),
});

export const outfitSchema = z.object({
  name: optionalText,
  itemIds: z.array(z.string()).min(1, "Select at least one item."),
});

export const planSchema = z.object({
  outfitId: z.string().min(1, "Select an outfit."),
  plannedDate: z.string().min(1, "Choose a date."),
  description: optionalText,
});
