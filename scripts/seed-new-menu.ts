/**
 * Seed the new Margherita Pizzeria menu.
 *
 * Run with: npx tsx --env-file=.env.local scripts/seed-new-menu.ts
 *
 * Wipes menu_items + menu_categories then inserts the menu provided
 * 2026-05-24. Each section becomes a menu_category. Size variants (12"/16",
 * Regular/Large, Slice/Whole, etc.) are expanded into individual menu_items
 * so the existing order schema (single pricePence) keeps working.
 */

import { db } from "@/lib/db/client";
import { menuCategories, menuItems } from "@/lib/db/schema";

interface SeedItem {
  name: string;
  description?: string;
  pricePence: number;
  allergens?: string[];
  imageUrl?: string;
}

interface SeedCategory {
  name: string;
  displayOrder: number;
  items: SeedItem[];
}

const GLUTEN_MILK = ["gluten", "milk"];

const CATEGORIES: SeedCategory[] = [
  /* ── Deals ───────────────────────────────────────────── */
  {
    name: "Weekday Deals",
    displayOrder: 10,
    items: [
      {
        name: "10\" Pizza + Chips + Drink",
        description: "Mon–Thu 11am–4pm. 10\" pizza, chips & a drink.",
        pricePence: 1000,
        allergens: GLUTEN_MILK,
      },
      {
        name: "King Smashburger + Chips + Drink",
        description: "Mon–Thu 11am–4pm. King smashburger, chips & a drink.",
        pricePence: 750,
        allergens: GLUTEN_MILK,
      },
    ],
  },
  {
    name: "Weekend Deals",
    displayOrder: 15,
    items: [
      {
        name: "10\" Deal — 2× 10\" Pizza + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 1499,
        allergens: GLUTEN_MILK,
      },
      {
        name: "12\" Deal — 2× 12\" Pizza + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 1899,
        allergens: GLUTEN_MILK,
      },
      {
        name: "Family Deal — 3× 12\" Pizza + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 2499,
        allergens: GLUTEN_MILK,
      },
      {
        name: "King Smashburger Deal — 2 King Smashburgers + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 1500,
        allergens: GLUTEN_MILK,
      },
    ],
  },
  {
    name: "Daily Deals",
    displayOrder: 20,
    items: [
      {
        name: "Kids Deal",
        description:
          "Kids pizza, king burger or nuggets + chips + fruit shoot.",
        pricePence: 499,
        allergens: GLUTEN_MILK,
      },
      {
        name: "Golden Box",
        description:
          "Shawarma, crispy chicken, pakora, donner, sajj, chips, manqusha, dips & 2 drinks.",
        pricePence: 1499,
        allergens: GLUTEN_MILK,
      },
    ],
  },

  /* ── Stone Baked Pizzas ──────────────────────────────── */
  {
    name: "Stone Baked Pizzas",
    displayOrder: 30,
    items: [
      // Margherita
      { name: "Margherita (12\")", description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Margherita (16\")", description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.", pricePence: 1700, allergens: GLUTEN_MILK },
      // Pepperoni
      { name: "Pepperoni (12\")", description: "Pepperoni, cherry tomato, mozzarella.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Pepperoni (16\")", description: "Pepperoni, cherry tomato, mozzarella.", pricePence: 1800, allergens: GLUTEN_MILK },
      // Bolognese
      { name: "Bolognese (12\")", description: "Bolognese mince, green pepper, onion, mozzarella.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Bolognese (16\")", description: "Bolognese mince, green pepper, onion, mozzarella.", pricePence: 1900, allergens: GLUTEN_MILK },
      // Vegetarian
      { name: "Vegetarian (12\")", description: "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella. Vegetarian.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Vegetarian (16\")", description: "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella. Vegetarian.", pricePence: 1800, allergens: GLUTEN_MILK },
      // Vesuvio
      { name: "Vesuvio (12\")", description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Vesuvio (16\")", description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.", pricePence: 1800, allergens: GLUTEN_MILK },
      // Hawaiian
      { name: "Hawaiian (12\")", description: "Pineapple, ham, mozzarella.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Hawaiian (16\")", description: "Pineapple, ham, mozzarella.", pricePence: 1900, allergens: GLUTEN_MILK },
      // Donner Kebab
      { name: "Donner Kebab (12\")", description: "Donner, mixed salad, garlic sauce, mozzarella.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Donner Kebab (16\")", description: "Donner, mixed salad, garlic sauce, mozzarella.", pricePence: 1800, allergens: GLUTEN_MILK },
      // Calzone 12" only
      { name: "Calzone (12\")", description: "Folded sourdough: 1 meat + 2 veg of your choice, mozzarella. 12\" only.", pricePence: 1300, allergens: GLUTEN_MILK },
      // Altono
      { name: "Altono (12\")", description: "Red onion, tuna, mozzarella, black olive, basil.", pricePence: 1200, allergens: [...GLUTEN_MILK, "fish"] },
      { name: "Altono (16\")", description: "Red onion, tuna, mozzarella, black olive, basil.", pricePence: 1900, allergens: [...GLUTEN_MILK, "fish"] },
      // Capricciosa
      { name: "Capricciosa (12\")", description: "Ham, mushroom, mozzarella.", pricePence: 1100, allergens: GLUTEN_MILK },
      { name: "Capricciosa (16\")", description: "Ham, mushroom, mozzarella.", pricePence: 1900, allergens: GLUTEN_MILK },
      // Mexican
      { name: "Mexican (12\")", description: "Fresh mince, green pepper, onion, green chilli, mozzarella.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Mexican (16\")", description: "Fresh mince, green pepper, onion, green chilli, mozzarella.", pricePence: 1900, allergens: GLUTEN_MILK },
      // Philadelphia
      { name: "Philadelphia (12\")", description: "Soya sauce, mushroom, green pepper, mozzarella.", pricePence: 1100, allergens: [...GLUTEN_MILK, "soya"] },
      { name: "Philadelphia (16\")", description: "Soya sauce, mushroom, green pepper, mozzarella.", pricePence: 1900, allergens: [...GLUTEN_MILK, "soya"] },
      // Syrian
      { name: "Syrian (12\")", description: "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Syrian (16\")", description: "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.", pricePence: 1900, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Chef's Selection ────────────────────────────────── */
  {
    name: "Chef's Selection Pizzas",
    displayOrder: 35,
    items: [
      { name: "Four Seasons (12\")", description: "Pepperoni, bolognese, ham and mushroom, spicy chicken, mozzarella.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Four Seasons (16\")", description: "Pepperoni, bolognese, ham and mushroom, spicy chicken, mozzarella.", pricePence: 1800, allergens: GLUTEN_MILK },
      { name: "Spicy Chicken (12\")", description: "Grilled chicken, mozzarella, green pepper, red onion.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Spicy Chicken (16\")", description: "Grilled chicken, mozzarella, green pepper, red onion.", pricePence: 1800, allergens: GLUTEN_MILK },
      { name: "Marinara (12\")", description: "Prawns, half lemon, fresh garlic, parmesan.", pricePence: 1300, allergens: [...GLUTEN_MILK, "crustaceans"] },
      { name: "Marinara (16\")", description: "Prawns, half lemon, fresh garlic, parmesan.", pricePence: 2000, allergens: [...GLUTEN_MILK, "crustaceans"] },
      { name: "Napoli (12\")", description: "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Napoli (16\")", description: "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.", pricePence: 2000, allergens: GLUTEN_MILK },
      { name: "Pesto Pizza (12\")", description: "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Pesto Pizza (16\")", description: "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.", pricePence: 1900, allergens: GLUTEN_MILK },
      { name: "Four Cheese (12\")", description: "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce). Vegetarian.", pricePence: 1300, allergens: GLUTEN_MILK },
      { name: "Four Cheese (16\")", description: "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce). Vegetarian.", pricePence: 2000, allergens: GLUTEN_MILK },
      { name: "Stuffed Crust Special (12\")", description: "Black olive, green pepper, mushroom, mozzarella stuffed-crust.", pricePence: 1500, allergens: GLUTEN_MILK },
      { name: "Stuffed Crust Special (16\")", description: "Black olive, green pepper, mushroom, mozzarella stuffed-crust.", pricePence: 2300, allergens: GLUTEN_MILK },
      { name: "Sausage Pizza (12\")", description: "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips or salad.", pricePence: 1200, allergens: GLUTEN_MILK },
      { name: "Sausage Pizza (16\")", description: "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips or salad.", pricePence: 1900, allergens: GLUTEN_MILK },
      { name: "King Crown BBQ Chicken (12\")", description: "BBQ chicken, mozzarella, sourdough crown dome. Served with chips or salad. 12\" only.", pricePence: 1500, allergens: GLUTEN_MILK },
      { name: "Egg Pizza (12\")", description: "Two eggs, sea salt, pepper, parmesan, mozzarella. Served with chips or salad. 12\" only.", pricePence: 1200, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Seafood Pizza (12\")", description: "Shrimp, calamari, anchovies, mussels, rocket, dill, mozzarella. 12\" only.", pricePence: 1700, allergens: [...GLUTEN_MILK, "fish", "crustaceans", "molluscs"] },
      { name: "Glasgow Pizza (12\")", description: "Half pasta white sauce, half double cheese. 12\" only.", pricePence: 1500, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Kitchen Specials ────────────────────────────────── */
  {
    name: "Kitchen Specials",
    displayOrder: 40,
    items: [
      { name: "Kebab Doner Box (Regular)", description: "Served with chips, salad & sauce.", pricePence: 550, allergens: GLUTEN_MILK },
      { name: "Kebab Doner Box (Large)", description: "Served with chips, salad & sauce.", pricePence: 750, allergens: GLUTEN_MILK },
      { name: "Crispy Chicken Plate (Regular)", description: "Served with chips, salad & sauce.", pricePence: 799, allergens: GLUTEN_MILK },
      { name: "Crispy Chicken Plate (Large)", description: "Served with chips, salad & sauce.", pricePence: 1499, allergens: GLUTEN_MILK },
      { name: "Shawarma Chicken Plate", description: "Served with chips, salad & sauce.", pricePence: 999, allergens: GLUTEN_MILK },
      { name: "Falafel Plate", description: "Served with chips, salad & sauce. Vegan.", pricePence: 999, allergens: ["gluten", "sesame"] },
    ],
  },

  /* ── Pasta ───────────────────────────────────────────── */
  {
    name: "Pasta",
    displayOrder: 45,
    items: [
      { name: "Chicken Alfredo Pasta", description: "White sauce, mushroom, green pepper, chicken, onion, parmesan.", pricePence: 1199, allergens: GLUTEN_MILK },
      { name: "Penne all'Arrabbiata", description: "Garlic, onion, black olive, tomato sauce, cheese, green chilli. Vegetarian.", pricePence: 999, allergens: GLUTEN_MILK },
    ],
  },

  /* ── King Smashburgers ───────────────────────────────── */
  {
    name: "King Smashburgers",
    displayOrder: 50,
    items: [
      { name: "King Smashburger", description: "Served with chips & cheddar cheese.", pricePence: 750, allergens: GLUTEN_MILK },
      { name: "King Smashburger Double", description: "Double patty, salad, sauce. Served with chips & cheddar cheese.", pricePence: 999, allergens: GLUTEN_MILK },
      { name: "Chicken Burger", description: "Served with chips & cheddar cheese.", pricePence: 750, allergens: GLUTEN_MILK },
      { name: "Halloumi Burger", description: "Served with chips & cheddar cheese. Vegetarian.", pricePence: 750, allergens: GLUTEN_MILK },
      { name: "Vegetarian Burger", description: "Served with chips & cheddar cheese. Vegetarian.", pricePence: 750, allergens: GLUTEN_MILK },
      { name: "Plain Smashburger", description: "Just the burger & chips.", pricePence: 550, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Wraps ───────────────────────────────────────────── */
  {
    name: "Wraps",
    displayOrder: 55,
    items: [
      { name: "Chicken Shawarma Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Crispy Chicken Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Lamb Kebab Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Chicken Tikka Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Falafel Wrap", description: "Salad & sauce. Add a can for £1. Vegan.", pricePence: 699, allergens: ["gluten", "sesame"] },
    ],
  },

  /* ── Hoagies ─────────────────────────────────────────── */
  {
    name: "Hoagies",
    displayOrder: 60,
    items: [
      { name: "Chicken Shawarma Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: GLUTEN_MILK },
      { name: "Donner Kebab Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: GLUTEN_MILK },
      { name: "Lamb Kebab Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: GLUTEN_MILK },
      { name: "Crispy Chicken Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Homemade Chicken ────────────────────────────────── */
  {
    name: "Homemade Chicken",
    displayOrder: 65,
    items: [
      { name: "Peri Peri Chicken (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1199 },
      { name: "Peri Peri Chicken (Half)", description: "Served with chips or rice, salad & sauce.", pricePence: 799 },
      { name: "Broasted Chicken (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1499, allergens: GLUTEN_MILK },
      { name: "Broasted Chicken (Half)", description: "Served with chips or rice, salad & sauce.", pricePence: 899, allergens: GLUTEN_MILK },
      { name: "Spicy Broasted (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1599, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Grill Kebab ─────────────────────────────────────── */
  {
    name: "Grill Kebab",
    displayOrder: 70,
    items: [
      { name: "Chicken Shish Tikka", description: "Chips or rice, salad & sauce.", pricePence: 950 },
      { name: "Lamb Koobideh Kebab (Regular)", description: "Chips or rice, salad & sauce.", pricePence: 749 },
      { name: "Lamb Koobideh Kebab (Large)", description: "Chips or rice, salad & sauce.", pricePence: 1049 },
      { name: "Afghani Tikka (5 pieces)", description: "Chips or rice, salad & sauce.", pricePence: 799 },
      { name: "Afghani Tikka (10 pieces)", description: "Chips or rice, salad & sauce.", pricePence: 1199 },
    ],
  },

  /* ── Mixed Grill ─────────────────────────────────────── */
  {
    name: "Mixed Grill",
    displayOrder: 75,
    items: [
      {
        name: "Mix Grill 01",
        description:
          "1 skewer of each: Shish Tikka, Lamb Koobideh, Donner or Shawarma. Served with chips or rice, grill onion & green pepper.",
        pricePence: 1399,
      },
      {
        name: "Mix Grill 02",
        description:
          "Mix Grill 01 + 5 Chicken BBQ Wings. Served with chips or rice, grill onion & green pepper.",
        pricePence: 1799,
      },
      {
        name: "Mix Grill 03",
        description:
          "2× Shish Tikka, 2× Lamb Koobideh, Wings, Donner or Shawarma. 1.5L cola included. Served with chips or rice, grill onion & green pepper.",
        pricePence: 2999,
      },
    ],
  },

  /* ── Naan & Manqusha ─────────────────────────────────── */
  {
    name: "Naan & Manqusha",
    displayOrder: 80,
    items: [
      { name: "Zaatar (Thyme) Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: ["gluten", "sesame"] },
      { name: "Mohamara Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: ["gluten", "nuts"] },
      { name: "Lahma Manqusha", description: "Stone-baked flatbread with spiced mince.", pricePence: 300, allergens: ["gluten"] },
      { name: "Mortadella + Cheese Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: GLUTEN_MILK },
      { name: "Mohamara + Cheese Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: [...GLUTEN_MILK, "nuts"] },
      { name: "Garlic Naan", description: "Stone-baked flatbread.", pricePence: 300, allergens: GLUTEN_MILK },
      { name: "Chilli Naan", description: "Stone-baked flatbread.", pricePence: 300, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Loaded Fries ────────────────────────────────────── */
  {
    name: "Loaded Fries",
    displayOrder: 85,
    items: [
      { name: "Crispy Chicken Loaded Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Bolognese Loaded Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: GLUTEN_MILK },
      { name: "Chicken Shawarma Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: GLUTEN_MILK },
    ],
  },

  /* ── Sides ───────────────────────────────────────────── */
  {
    name: "Sides",
    displayOrder: 90,
    items: [
      { name: "Chips (Regular)", pricePence: 399 },
      { name: "Chips (Large)", pricePence: 499 },
      { name: "Chips & Cheese", pricePence: 599, allergens: ["milk"] },
      { name: "Onion Rings (5 pieces)", pricePence: 299, allergens: ["gluten"] },
      { name: "Onion Rings (10 pieces)", pricePence: 599, allergens: ["gluten"] },
      { name: "Chilli Cheese", pricePence: 499, allergens: ["milk"] },
      { name: "Mozzarella Sticks (6 pieces)", pricePence: 499, allergens: GLUTEN_MILK },
      { name: "Chicken Nuggets (6 pieces)", pricePence: 599, allergens: ["gluten"] },
      { name: "BBQ Wings (Regular)", pricePence: 599 },
      { name: "BBQ Wings (Large)", pricePence: 999 },
      { name: "Falafel (Regular)", description: "Vegan.", pricePence: 599, allergens: ["sesame"] },
      { name: "Falafel (Large)", description: "Vegan.", pricePence: 999, allergens: ["sesame"] },
    ],
  },

  /* ── Dips ────────────────────────────────────────────── */
  {
    name: "Dips",
    displayOrder: 95,
    items: [
      { name: "Garlic Mayo", pricePence: 50, allergens: ["eggs"] },
      { name: "Sweet Chilli", pricePence: 50 },
      { name: "American", pricePence: 50, allergens: ["eggs"] },
      { name: "BBQ", pricePence: 50 },
      { name: "Mild Sauce", pricePence: 50 },
      { name: "Ketchup", pricePence: 50 },
    ],
  },

  /* ── Drinks ──────────────────────────────────────────── */
  {
    name: "Drinks",
    displayOrder: 100,
    items: [
      { name: "Can — Irn Bru", pricePence: 120 },
      { name: "Can — Pepsi", pricePence: 120 },
      { name: "Can — Pepsi Max", pricePence: 120 },
      { name: "Can — Coke", pricePence: 120 },
      { name: "Can — Diet Coke", pricePence: 120 },
      { name: "Can — Fanta", pricePence: 120 },
      { name: "Can — Vimto", pricePence: 120 },
      { name: "Can — Tango", pricePence: 120 },
      { name: "Can — Limeade", pricePence: 120 },
      { name: "Fruit Shoot", pricePence: 100 },
      { name: "Redbull", pricePence: 150 },
      { name: "Water (500ml)", pricePence: 100 },
      { name: "Water (1.5 Litre)", pricePence: 300 },
    ],
  },

  /* ── Desserts ────────────────────────────────────────── */
  {
    name: "Desserts",
    displayOrder: 110,
    items: [
      { name: "Ferrero Cake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "nuts", "eggs"] },
      { name: "Ferrero Cake (Whole)", pricePence: 2499, allergens: [...GLUTEN_MILK, "nuts", "eggs"] },
      { name: "Fruit Cake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Fruit Cake (Whole)", pricePence: 2799, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Chocolate Mousse Cake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Chocolate Mousse Cake (Whole)", pricePence: 2499, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Vanilla Cheesecake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Vanilla Cheesecake (Whole)", pricePence: 2499, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Strawberry Cheesecake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Strawberry Cheesecake (Whole)", pricePence: 2499, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Chocolate Cheesecake (Slice)", pricePence: 299, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Chocolate Cheesecake (Whole)", pricePence: 2499, allergens: [...GLUTEN_MILK, "eggs"] },
      { name: "Chocolate Milkshake", pricePence: 599, allergens: ["milk"] },
      { name: "Strawberry Milkshake", pricePence: 599, allergens: ["milk"] },
      { name: "Coco Milkshake", pricePence: 599, allergens: ["milk"] },
    ],
  },
];

async function main() {
  console.log("Wiping existing menu rows…");
  await db.delete(menuItems);
  await db.delete(menuCategories);

  let totalItems = 0;
  for (const cat of CATEGORIES) {
    const [inserted] = await db
      .insert(menuCategories)
      .values({
        name: cat.name,
        displayOrder: cat.displayOrder,
        active: true,
      })
      .returning({ id: menuCategories.id });

    if (!inserted) {
      throw new Error(`Failed to insert category: ${cat.name}`);
    }

    if (cat.items.length > 0) {
      await db.insert(menuItems).values(
        cat.items.map((it) => ({
          categoryId: inserted.id,
          name: it.name,
          description: it.description ?? null,
          pricePence: it.pricePence,
          imageUrl: it.imageUrl ?? null,
          available: true,
          allergens: it.allergens ?? [],
        })),
      );
    }

    totalItems += cat.items.length;
    console.log(
      `  • ${cat.name.padEnd(28)} ${cat.items.length} items`,
    );
  }

  console.log(
    `\nDone. ${CATEGORIES.length} categories, ${totalItems} items inserted.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
