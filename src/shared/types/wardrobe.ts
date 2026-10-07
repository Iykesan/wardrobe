export type Category = {
  id: string;
  name: string;
  order: number;
};

export type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  order: number;
};

export type WardrobeRepresentation = {
  templateId: "wardrope.tshirt";
  fidelity: "generic-template" | "customized-template" | "item-specific";
  color?: string;
};

export type WardrobeItem = {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  visualKey?: string;
  color?: string;
  fit?: string;
  season?: string;
  notes?: string;
  isFavorite: boolean;
  representation?: WardrobeRepresentation;
  createdAt: string;
};
