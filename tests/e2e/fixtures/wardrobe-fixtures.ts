/**
 * Shared Phase 1 acceptance fixtures.
 *
 * These are plain serializable objects written into the versioned
 * `wardrope-store` localStorage envelope. Keep IDs stable so tests can assert
 * on specific records. No production source is imported here.
 */

export type FixtureCategory = { id: string; name: string; order: number };
export type FixtureSubcategory = FixtureCategory & { categoryId: string };
export type FixtureItem = {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  createdAt: string;
  isFavorite: boolean;
  visualKey?: string;
  color?: string;
  fit?: string;
  season?: string;
  notes?: string;
};
export type FixtureOutfit = {
  id: string;
  name?: string;
  itemIds: string[];
  isFavorite: boolean;
  createdAt: string;
};
export type FixturePlan = {
  id: string;
  outfitId: string;
  plannedDate: string;
  description?: string;
  createdAt: string;
};
export type WardrobeFixture = {
  categories: FixtureCategory[];
  subcategories: FixtureSubcategory[];
  items: FixtureItem[];
  outfits: FixtureOutfit[];
  plans: FixturePlan[];
  setupComplete: boolean;
};

const ISO = "2035-01-01T00:00:00.000Z";

/** Versioned envelope matching `persistence.ts` SCHEMA_VERSION = 1. */
export function makeEnvelope(state: WardrobeFixture, version = 1) {
  return { version, savedAt: ISO, state };
}

/**
 * W1: two categories with subcategories, three owned items, a two-item and a
 * one-item outfit, and one plan per outfit. Stable IDs.
 */
export function w1(): WardrobeFixture {
  return {
    categories: [
      { id: "c-tops", name: "Tops", order: 1 },
      { id: "c-bottoms", name: "Bottoms", order: 2 },
    ],
    subcategories: [
      { id: "s-shirts", categoryId: "c-tops", name: "Shirts", order: 1 },
      { id: "s-jeans", categoryId: "c-bottoms", name: "Jeans", order: 1 },
    ],
    items: [
      {
        id: "i-shirt-a",
        name: "Linen shirt",
        categoryId: "c-tops",
        subcategoryId: "s-shirts",
        createdAt: ISO,
        isFavorite: false,
      },
      {
        id: "i-shirt-b",
        name: "Oxford shirt",
        categoryId: "c-tops",
        subcategoryId: "s-shirts",
        createdAt: ISO,
        isFavorite: true,
      },
      {
        id: "i-jeans-c",
        name: "Blue jeans",
        categoryId: "c-bottoms",
        subcategoryId: "s-jeans",
        createdAt: ISO,
        isFavorite: false,
      },
    ],
    outfits: [
      {
        id: "o-mixed",
        name: "Mixed outfit",
        itemIds: ["i-shirt-a", "i-jeans-c"],
        isFavorite: false,
        createdAt: ISO,
      },
      {
        id: "o-jeans",
        name: "Jeans only",
        itemIds: ["i-jeans-c"],
        isFavorite: false,
        createdAt: ISO,
      },
      {
        id: "o-shirts",
        name: "Shirts only",
        itemIds: ["i-shirt-a", "i-shirt-b"],
        isFavorite: false,
        createdAt: ISO,
      },
    ],
    plans: [
      {
        id: "p-mixed",
        outfitId: "o-mixed",
        plannedDate: "2035-06-15",
        description: "Dinner",
        createdAt: ISO,
      },
      {
        id: "p-shirts",
        outfitId: "o-shirts",
        plannedDate: "2035-06-16",
        createdAt: ISO,
      },
    ],
    setupComplete: true,
  };
}

const W500_DESCRIPTORS = [
  "long sleeve cotton blend with reinforced stitching",
  "lightweight breathable summer weave with a relaxed drape",
  "structured heavyweight fabric with a tailored silhouette",
  "soft brushed interior and a water resistant outer shell",
];

const pad = (value: number, width = 3) => String(value).padStart(width, "0");

/**
 * W500: 500 synthetic items, 50 outfits and 30 plans, including long names
 * and notes. Generated deterministically so runs are comparable.
 */
export function w500(): WardrobeFixture {
  const categories: FixtureCategory[] = [
    { id: "c-tops", name: "Tops", order: 1 },
    { id: "c-bottoms", name: "Bottoms", order: 2 },
    { id: "c-shoes", name: "Shoes", order: 3 },
  ];
  const subcategories: FixtureSubcategory[] = [
    { id: "s-shirts", categoryId: "c-tops", name: "Shirts", order: 1 },
    { id: "s-jeans", categoryId: "c-bottoms", name: "Jeans", order: 1 },
    { id: "s-sneakers", categoryId: "c-shoes", name: "Sneakers", order: 1 },
  ];
  const categoryFor = (index: number) => categories[index % categories.length];
  const subcategoryFor = (index: number) =>
    subcategories[index % subcategories.length];

  const items: FixtureItem[] = Array.from({ length: 500 }, (_, index) => {
    const category = categoryFor(index);
    const subcategory = subcategoryFor(index);
    const descriptor = W500_DESCRIPTORS[index % W500_DESCRIPTORS.length];
    const item: FixtureItem = {
      id: `w500-item-${pad(index)}`,
      name: `W500 item ${pad(index)} ${descriptor}`,
      categoryId: category.id,
      subcategoryId: subcategory.id,
      createdAt: new Date(Date.parse(ISO) + index * 60_000).toISOString(),
      isFavorite: index % 25 === 0,
    };
    if (index % 3 === 0) {
      item.color = ["blue", "black", "cream", "olive"][index % 4];
    }
    if (index % 5 === 0) {
      item.notes = `Synthetic acceptance note ${pad(index)} for search and rendering: ${descriptor}.`;
    }
    return item;
  });

  const itemIds = items.map((item) => item.id);
  const outfits: FixtureOutfit[] = Array.from({ length: 50 }, (_, index) => ({
    id: `w500-outfit-${pad(index, 2)}`,
    name: `W500 outfit ${pad(index, 2)}`,
    itemIds: [
      itemIds[index % itemIds.length],
      itemIds[(index + 7) % itemIds.length],
      ...(index % 4 === 0 ? [itemIds[(index + 13) % itemIds.length]] : []),
    ],
    isFavorite: index % 10 === 0,
    createdAt: new Date(Date.parse(ISO) + index * 60_000).toISOString(),
  }));

  const plans: FixturePlan[] = Array.from({ length: 30 }, (_, index) => ({
    id: `w500-plan-${pad(index, 2)}`,
    outfitId: `w500-outfit-${pad(index % outfits.length, 2)}`,
    plannedDate: `2035-01-${pad(index + 1, 2)}`,
    description:
      index % 3 === 0 ? `W500 planned note ${pad(index)}` : undefined,
    createdAt: new Date(Date.parse(ISO) + index * 60_000).toISOString(),
  }));

  return { categories, subcategories, items, outfits, plans, setupComplete: true };
}
