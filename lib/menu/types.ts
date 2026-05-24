/**
 * Public/client-facing menu types for Phase 2.
 *
 * Money is always carried as integer pence — never as a float.
 */

export const COMMON_ALLERGENS = [
  "gluten",
  "milk",
  "egg",
  "nuts",
  "peanuts",
  "sesame",
  "soy",
  "sulphites",
  "fish",
  "shellfish",
] as const;

export type MenuAllergen = (typeof COMMON_ALLERGENS)[number];

export const DIETARY_FILTERS = [
  "vegetarian",
  "vegan",
  "gluten-free",
] as const;

export type MenuDietaryFilter = (typeof DIETARY_FILTERS)[number];

export interface PublicMenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
  /** Derived client-side from name/description/allergens. Optional in Phase 2. */
  dietaryTags: string[];
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  categories: PublicMenuCategory[];
  generatedAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePence: number;
  totalPence: number;
  allergens: string[];
  imageUrl: string | null;
}

export interface CartState {
  items: CartItem[];
}

export interface AddToCartInput {
  menuItemId: string;
  name: string;
  unitPricePence: number;
  allergens: string[];
  imageUrl: string | null;
}

export const CART_LIMITS = {
  minPerItem: 1,
  maxPerItem: 20,
} as const;
