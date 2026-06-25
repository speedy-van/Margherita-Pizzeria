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
        allergens: [],
        imageUrl: "/uploads/images/weekday-deal-10-pizza-chips-drink.png",
      },
      {
        name: "King Smashburger + Chips + Drink",
        description: "Mon–Thu 11am–4pm. King smashburger, chips & a drink.",
        pricePence: 750,
        allergens: [],
        imageUrl: "/legacy/deal-smashburger.jpg",
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
        allergens: [],
        imageUrl: "/uploads/images/weekend-deal-2x10-pizza-chips.png",
      },
      {
        name: "12\" Deal — 2× 12\" Pizza + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 1899,
        allergens: [],
        imageUrl: "/uploads/images/weekend-deal-2x12-pizza-chips.png",
      },
      {
        name: "Family Deal — 3× 12\" Pizza + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 2499,
        allergens: [],
        imageUrl: "/uploads/images/weekend-family-deal-3x12-pizza-chips.png",
      },
      {
        name: "King Smashburger Deal — 2 King Smashburgers + Chips",
        description: "Weekend deal (no drinks).",
        pricePence: 1500,
        allergens: [],
        imageUrl: "/legacy/deal-smashburger-double.jpg",
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
        allergens: [],
        imageUrl: "/legacy/deal-kids.jpg",
      },
      {
        name: "Golden Box",
        description:
          "Shawarma, crispy chicken, pakora, donner, sajj, chips, manqusha, dips & 2 drinks.",
        pricePence: 1499,
        allergens: [],
        imageUrl: "/legacy/deal-golden-box.jpg",
      },
    ],
  },

  /* ── Stone Baked Pizzas ──────────────────────────────── */
  {
    name: "Stone Baked Pizzas",
    displayOrder: 30,
    items: [
      // Margherita
      { name: "Margherita (12\")", description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.", pricePence: 1100, allergens: [], imageUrl: "/legacy/margherita-real.jpg" },
      { name: "Margherita (16\")", description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.", pricePence: 1700, allergens: [], imageUrl: "/legacy/margherita-real.jpg" },
      // Pepperoni
      { name: "Pepperoni (12\")", description: "Pepperoni, cherry tomato, mozzarella.", pricePence: 1100, allergens: [], imageUrl: "/legacy/pepperoni-real.jpg" },
      { name: "Pepperoni (16\")", description: "Pepperoni, cherry tomato, mozzarella.", pricePence: 1800, allergens: [], imageUrl: "/legacy/pepperoni-real.jpg" },
      // Bolognese
      { name: "Bolognese (12\")", description: "Bolognese mince, green pepper, onion, mozzarella.", pricePence: 1200, allergens: [], imageUrl: "/legacy/bolognese-real.jpg" },
      { name: "Bolognese (16\")", description: "Bolognese mince, green pepper, onion, mozzarella.", pricePence: 1900, allergens: [], imageUrl: "/legacy/bolognese-real.jpg" },
      // Vegetarian
      { name: "Vegetarian (12\")", description: "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella. Vegetarian.", pricePence: 1100, allergens: [], imageUrl: "/legacy/vegetarian-real.jpg" },
      { name: "Vegetarian (16\")", description: "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella. Vegetarian.", pricePence: 1800, allergens: [], imageUrl: "/legacy/vegetarian-real.jpg" },
      // Vesuvio
      { name: "Vesuvio (12\")", description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.", pricePence: 1100, allergens: [], imageUrl: "/legacy/vesuvio-real.jpg" },
      { name: "Vesuvio (16\")", description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.", pricePence: 1800, allergens: [], imageUrl: "/legacy/vesuvio-real.jpg" },
      // Hawaiian
      { name: "Hawaiian (12\")", description: "Pineapple, ham, mozzarella.", pricePence: 1100, allergens: [], imageUrl: "/legacy/hawaiian-real.jpg" },
      { name: "Hawaiian (16\")", description: "Pineapple, ham, mozzarella.", pricePence: 1900, allergens: [], imageUrl: "/legacy/hawaiian-real.jpg" },
      // Donner Kebab
      { name: "Donner Kebab (12\")", description: "Donner, mixed salad, garlic sauce, mozzarella.", pricePence: 1200, allergens: [], imageUrl: "/legacy/donner-real.jpg" },
      { name: "Donner Kebab (16\")", description: "Donner, mixed salad, garlic sauce, mozzarella.", pricePence: 1800, allergens: [], imageUrl: "/legacy/donner-real.jpg" },
      // Calzone 12" only
      { name: "Calzone (12\")", description: "Folded sourdough: 1 meat + 2 veg of your choice, mozzarella. 12\" only.", pricePence: 1300, allergens: [], imageUrl: "/legacy/calzone-real.jpg" },
      // Altono
      { name: "Altono (12\")", description: "Red onion, tuna, mozzarella, black olive, basil.", pricePence: 1200, allergens: ["fish"], imageUrl: "/legacy/altono-real.jpg" },
      { name: "Altono (16\")", description: "Red onion, tuna, mozzarella, black olive, basil.", pricePence: 1900, allergens: ["fish"], imageUrl: "/legacy/altono-real.jpg" },
      // Capricciosa
      { name: "Capricciosa (12\")", description: "Ham, mushroom, mozzarella.", pricePence: 1100, allergens: [], imageUrl: "/legacy/capricciosa-real.jpg" },
      { name: "Capricciosa (16\")", description: "Ham, mushroom, mozzarella.", pricePence: 1900, allergens: [], imageUrl: "/legacy/capricciosa-real.jpg" },
      // Mexican
      { name: "Mexican (12\")", description: "Fresh mince, green pepper, onion, green chilli, mozzarella.", pricePence: 1200, allergens: [], imageUrl: "/legacy/mexican-real.jpg" },
      { name: "Mexican (16\")", description: "Fresh mince, green pepper, onion, green chilli, mozzarella.", pricePence: 1900, allergens: [], imageUrl: "/legacy/mexican-real.jpg" },
      // Philadelphia
      { name: "Philadelphia (12\")", description: "Soya sauce, mushroom, green pepper, mozzarella.", pricePence: 1100, allergens: ["soya"], imageUrl: "/uploads/images/philadelphia-12.png" },
      { name: "Philadelphia (16\")", description: "Soya sauce, mushroom, green pepper, mozzarella.", pricePence: 1900, allergens: ["soya"], imageUrl: "/uploads/images/philadelphia-16.png" },
      // Syrian
      { name: "Syrian (12\")", description: "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/syrian-12.png" },
      { name: "Syrian (16\")", description: "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.", pricePence: 1900, allergens: [], imageUrl: "/uploads/images/syrian-16.png" },
    ],
  },

  /* ── Chef's Selection ────────────────────────────────── */
  {
    name: "Chef's Selection Pizzas",
    displayOrder: 35,
    items: [
      { name: "Four Seasons (12\")", description: "Pepperoni, bolognese, ham and mushroom, spicy chicken,", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/four-seasons-12.png" },
      { name: "Four Seasons (16\")", description: "Pepperoni, bolognese, ham and mushroom, spicy chicken, mozzarella.", pricePence: 1800, allergens: [], imageUrl: "/uploads/images/four-seasons-16.png" },
      { name: "Spicy Chicken (12\")", description: "Grilled chicken, mozzarella, green pepper, red onion.", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/spicy-chicken-12.png" },
      { name: "Spicy Chicken (16\")", description: "Grilled chicken, mozzarella, green pepper, red onion.", pricePence: 1800, allergens: [], imageUrl: "/uploads/images/spicy-chicken-16.png" },
      { name: "Marinara (12\")", description: "Prawns, half lemon, fresh garlic, parmesan.", pricePence: 1300, allergens: ["crustaceans"], imageUrl: "/uploads/images/marinara-12.png" },
      { name: "Marinara (16\")", description: "Prawns, half lemon, fresh garlic, parmesan.", pricePence: 2000, allergens: ["crustaceans"], imageUrl: "/uploads/images/marinara-16.png" },
      { name: "Napoli (12\")", description: "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/napoli-12.png" },
      { name: "Napoli (16\")", description: "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.", pricePence: 2000, allergens: [], imageUrl: "/uploads/images/napoli-16.png" },
      { name: "Pesto Pizza (12\")", description: "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/pesto-pizza-12.png" },
      { name: "Pesto Pizza (16\")", description: "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.", pricePence: 1900, allergens: [], imageUrl: "/uploads/images/pesto-pizza-16.png" },
      { name: "Four Cheese (12\")", description: "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce).", pricePence: 1300, allergens: [], imageUrl: "/uploads/images/four-cheese-12.png" },
      { name: "Four Cheese (16\")", description: "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce).", pricePence: 2000, allergens: [], imageUrl: "/uploads/images/four-cheese-16.png" },
      { name: "Stuffed Crust Special (12\")", description: "Black olive, green pepper, mushroom, mozzarella stuffed-", pricePence: 1500, allergens: [], imageUrl: "/uploads/images/stuffed-crust-special-12.png" },
      { name: "Stuffed Crust Special (16\")", description: "Black olive, green pepper, mushroom, mozzarella stuffed-crust.", pricePence: 2300, allergens: [], imageUrl: "/uploads/images/stuffed-crust-special-16.png" },
      { name: "Sausage Pizza (12\")", description: "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips or salad.", pricePence: 1200, allergens: [], imageUrl: "/uploads/images/sausage-pizza-12.png" },
      { name: "Sausage Pizza (16\")", description: "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips or salad.", pricePence: 1900, allergens: [], imageUrl: "/uploads/images/sausage-pizza-16.png" },
      { name: "King Crown BBQ Chicken (12\")", description: "BBQ chicken, mozzarella, sourdough crown dome. Served with chips or salad. 12\" only.", pricePence: 1500, allergens: [], imageUrl: "/uploads/images/king-crown-bbq-chicken-12.png" },
      { name: "Egg Pizza (12\")", description: "Two eggs, sea salt, pepper, parmesan, mozzarella. Served with chips or salad. 12\" only.", pricePence: 1200, allergens: ["eggs"], imageUrl: "/uploads/images/egg-pizza-12.png" },
      { name: "Seafood Pizza (12\")", description: "Shrimp, calamari, anchovies, mussels, rocket, dill, mozzarella. 12\" only.", pricePence: 1700, allergens: ["fish", "crustaceans", "molluscs"], imageUrl: "/uploads/images/seafood-pizza-12.png" },
      { name: "Glasgow Pizza (12\")", description: "Half pasta white sauce, half double cheese. 12\" only.", pricePence: 1500, allergens: [], imageUrl: "/uploads/images/glasgow-pizza-12.png" },
    ],
  },

  /* ── Kitchen Specials ────────────────────────────────── */
  {
    name: "Kitchen Specials",
    displayOrder: 40,
    items: [
      { name: "Kebab Doner Box (Regular)", description: "Served with chips, salad & sauce.", pricePence: 550, allergens: [], imageUrl: "/uploads/images/kebab-doner-box-regular.png" },
      { name: "Kebab Doner Box (Large)", description: "Served with chips, salad & sauce.", pricePence: 750, allergens: [], imageUrl: "/uploads/images/kebab-doner-box-large.png" },
      { name: "Crispy Chicken Plate (Regular)", description: "Served with chips, salad & sauce.", pricePence: 799, allergens: [], imageUrl: "/uploads/images/crispy-chicken-plate-regular.png" },
      { name: "Crispy Chicken Plate (Large)", description: "Served with chips, salad & sauce.", pricePence: 1499, allergens: [], imageUrl: "/uploads/images/crispy-chicken-plate-large.png" },
      { name: "Shawarma Chicken Plate", description: "Served with chips, salad & sauce.", pricePence: 999, allergens: [], imageUrl: "/uploads/images/shawarma-chicken-plate.png" },
      { name: "Falafel Plate", description: "Served with chips, salad & sauce. Vegan.", pricePence: 999, allergens: ["sesame"], imageUrl: "/uploads/images/falafel-plate.png" },
    ],
  },

  /* ── Pasta ───────────────────────────────────────────── */
  {
    name: "Pasta",
    displayOrder: 45,
    items: [
      { name: "Chicken Alfredo Pasta", description: "White sauce, mushroom, green pepper, chicken, onion, parmesan.", pricePence: 1199, allergens: [], imageUrl: "/uploads/images/chicken-alfredo-pasta.png" },
      { name: "Penne all'Arrabbiata", description: "Garlic, onion, black olive, tomato sauce, cheese, green chilli. Vegetarian.", pricePence: 999, allergens: [], imageUrl: "/uploads/images/penne-all-arrabbiata.png" },
    ],
  },

  /* ── King Smashburgers ───────────────────────────────── */
  {
    name: "King Smashburgers",
    displayOrder: 50,
    items: [
      { name: "King Smashburger", description: "Served with chips & cheddar cheese.", pricePence: 750, allergens: [], imageUrl: "/legacy/deal-smashburger.jpg" },
      { name: "King Smashburger Double", description: "Double patty, salad, sauce. Served with chips & cheddar cheese.", pricePence: 999, allergens: [], imageUrl: "/legacy/deal-smashburger-double.jpg" },
      { name: "Chicken Burger", description: "Served with chips & cheddar cheese.", pricePence: 750, allergens: [], imageUrl: "/uploads/images/chicken-burger.png" },
      { name: "Halloumi Burger", description: "Served with chips & cheddar cheese. Vegetarian.", pricePence: 750, allergens: [], imageUrl: "/uploads/images/halloumi-burger.png" },
      { name: "Vegetarian Burger", description: "Served with chips & cheddar cheese. Vegetarian.", pricePence: 750, allergens: [], imageUrl: "/uploads/images/vegetarian-burger-online.jpg" },
      { name: "Plain Smashburger", description: "Just the burger & chips.", pricePence: 550, allergens: [], imageUrl: "/legacy/deal-smashburger.jpg" },
    ],
  },

  /* ── Wraps ───────────────────────────────────────────── */
  {
    name: "Wraps",
    displayOrder: 55,
    items: [
      { name: "Chicken Shawarma Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/chicken-shawarma-wrap.png" },
      { name: "Crispy Chicken Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/crispy-chicken-wrap.png" },
      { name: "Lamb Kebab Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/lamb-kebab-wrap.png" },
      { name: "Chicken Tikka Wrap", description: "Salad & sauce. Add a can for £1.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/chicken-tikka-wrap.png" },
      { name: "Falafel Wrap", description: "Salad & sauce. Add a can for £1. Vegan.", pricePence: 699, allergens: ["sesame"], imageUrl: "/uploads/images/falafel-wrap.png" },
    ],
  },

  /* ── Hoagies ─────────────────────────────────────────── */
  {
    name: "Hoagies",
    displayOrder: 60,
    items: [
      { name: "Chicken Shawarma Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: [], imageUrl: "/uploads/images/chicken-shawarma-hoagie.png" },
      { name: "Donner Kebab Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: [], imageUrl: "/uploads/images/lamb-kebab-hoagie.png" },
      { name: "Lamb Kebab Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: [], imageUrl: "/uploads/images/lamb-kebab-hoagie.png" },
      { name: "Crispy Chicken Hoagie", description: "Cheese, chips, salad & sauce. Add a can for £1.", pricePence: 899, allergens: [], imageUrl: "/uploads/images/crispy-chicken-hoagie.png" },
    ],
  },

  /* ── Homemade Chicken ────────────────────────────────── */
  {
    name: "Homemade Chicken",
    displayOrder: 65,
    items: [
      { name: "Peri Peri Chicken (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1199, imageUrl: "/uploads/images/peri-peri-chicken-full.png" },
      { name: "Peri Peri Chicken (Half)", description: "Served with chips or rice, salad & sauce.", pricePence: 799, imageUrl: "/uploads/images/peri-peri-chicken-half.png" },
      { name: "Broasted Chicken (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1499, allergens: [], imageUrl: "/uploads/images/broasted-chicken-full.png" },
      { name: "Broasted Chicken (Half)", description: "Served with chips or rice, salad & sauce.", pricePence: 899, allergens: [], imageUrl: "/uploads/images/broasted-chicken-half.png" },
      { name: "Spicy Broasted (Full)", description: "Served with chips or rice, salad & sauce.", pricePence: 1599, allergens: [], imageUrl: "/uploads/images/spicy-broasted-full.png" },
    ],
  },

  /* ── Grill Kebab ─────────────────────────────────────── */
  {
    name: "Grill Kebab",
    displayOrder: 70,
    items: [
      { name: "Chicken Shish Tikka", description: "Chips or rice, salad & sauce.", pricePence: 950, imageUrl: "/uploads/images/chicken-shish-tikka.png" },
      { name: "Lamb Koobideh Kebab (Regular)", description: "Chips or rice, salad & sauce.", pricePence: 749, imageUrl: "/uploads/images/lamb-koobideh-kebab-regular.png" },
      { name: "Lamb Koobideh Kebab (Large)", description: "Chips or rice, salad & sauce.", pricePence: 1049, imageUrl: "/uploads/images/lamb-koobideh-kebab-large.png" },
      { name: "Afghani Tikka (5 pieces)", description: "Chips or rice, salad & sauce.", pricePence: 799, imageUrl: "/uploads/images/afghani-tikka-5-pieces.png" },
      { name: "Afghani Tikka (10 pieces)", description: "Chips or rice, salad & sauce.", pricePence: 1199, imageUrl: "/uploads/images/afghani-tikka-10-pieces.png" },
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
          "1 skewer of each: Shish Tikka, Lamb Koobideh, Donner or Shawarma. Served with chips or rice, grill onion & green",
        pricePence: 1399,
        imageUrl: "/uploads/images/mix-grill-01.png",
      },
      {
        name: "Mix Grill 02",
        description:
          "Mix Grill 01 + 5 Chicken BBQ Wings. Served with chips or rice, grill onion & green pepper.",
        pricePence: 1799,
        imageUrl: "/uploads/images/mix-grill-02.png",
      },
      {
        name: "Mix Grill 03",
        description:
          "2× Shish Tikka, 2× Lamb Koobideh, Wings, Donner or Shawarma. 1.5L cola included. Served with chips or rice, grill onion & green pepper.",
        pricePence: 2999,
        imageUrl: "/uploads/images/mix-grill-03.png",
      },
    ],
  },

  /* ── Naan & Manqusha ─────────────────────────────────── */
  {
    name: "Naan & Manqusha",
    displayOrder: 80,
    items: [
      { name: "Zaatar (Thyme) Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: ["sesame"], imageUrl: "/uploads/images/zaatar-thyme-manqusha.png" },
      { name: "Mohamara Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: ["nuts"], imageUrl: "/uploads/images/mohamara-manqusha.png" },
      { name: "Lahma Manqusha", description: "Stone-baked flatbread with spiced mince.", pricePence: 300, allergens: [], imageUrl: "/uploads/images/lahma-manqusha.png" },
      { name: "Mortadella + Cheese Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: [], imageUrl: "/uploads/images/mortadella-cheese-manqusha.png" },
      { name: "Mohamara + Cheese Manqusha", description: "Stone-baked flatbread.", pricePence: 300, allergens: ["nuts"], imageUrl: "/uploads/images/mohamara-cheese-manqusha.png" },
      { name: "Garlic Naan", description: "Stone-baked flatbread.", pricePence: 300, allergens: [], imageUrl: "/uploads/images/garlic-naan.png" },
      { name: "Chilli Naan", description: "Stone-baked flatbread.", pricePence: 300, allergens: [], imageUrl: "/uploads/images/chilli-naan.png" },
    ],
  },

  /* ── Loaded Fries ────────────────────────────────────── */
  {
    name: "Loaded Fries",
    displayOrder: 85,
    items: [
      { name: "Crispy Chicken Loaded Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/crispy-chicken-loaded-fries.png" },
      { name: "Bolognese Loaded Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/bolognese-loaded-fries-online.jpg" },
      { name: "Chicken Shawarma Fries", description: "Cheddar cheese sauce, jalapeño & dry onion.", pricePence: 699, allergens: [], imageUrl: "/uploads/images/chicken-shawarma-fries.png" },
    ],
  },

  /* ── Sides ───────────────────────────────────────────── */
  {
    name: "Sides",
    displayOrder: 90,
    items: [
      { name: "Chips (Regular)", pricePence: 399, imageUrl: "/uploads/images/chips-regular.png" },
      { name: "Chips (Large)", pricePence: 499, imageUrl: "/uploads/images/chips-large.png" },
      { name: "Chips & Cheese", pricePence: 599, allergens: [], imageUrl: "/uploads/images/chips-and-cheese.png" },
      { name: "Onion Rings (5 pieces)", pricePence: 299, allergens: [], imageUrl: "/uploads/images/onion-rings-5-pieces.png" },
      { name: "Onion Rings (10 pieces)", pricePence: 599, allergens: [], imageUrl: "/uploads/images/onion-rings-10-pieces.png" },
      { name: "Chilli Cheese", pricePence: 499, allergens: [], imageUrl: "/uploads/images/chilli-cheese.png" },
      { name: "Mozzarella Sticks (6 pieces)", pricePence: 499, allergens: [], imageUrl: "/uploads/images/mozzarella-sticks-6-pieces.png" },
      { name: "Chicken Nuggets (6 pieces)", pricePence: 599, allergens: [], imageUrl: "/uploads/images/chicken-nuggets-6-pieces.png" },
      { name: "BBQ Wings (Regular)", pricePence: 599, imageUrl: "/uploads/images/bbq-wings-regular.png" },
      { name: "BBQ Wings (Large)", pricePence: 999, imageUrl: "/uploads/images/bbq-wings-large.png" },
      { name: "Falafel (Regular)", description: "Vegan.", pricePence: 599, allergens: ["sesame"], imageUrl: "/uploads/images/falafel-regular.png" },
      { name: "Falafel (Large)", description: "Vegan.", pricePence: 999, allergens: ["sesame"], imageUrl: "/uploads/images/falafel-large.png" },
    ],
  },

  /* ── Dips ────────────────────────────────────────────── */
  {
    name: "Dips",
    displayOrder: 95,
    items: [
      { name: "Garlic Mayo", pricePence: 50, allergens: ["eggs"], imageUrl: "/uploads/images/garlic-mayo.png" },
      { name: "Sweet Chilli", pricePence: 50, imageUrl: "/uploads/images/sweet-chilli.png" },
      { name: "American", pricePence: 50, allergens: ["eggs"], imageUrl: "/uploads/images/american.png" },
      { name: "BBQ", pricePence: 50, imageUrl: "/uploads/images/bbq.png" },
      { name: "Mild Sauce", pricePence: 50, imageUrl: "/uploads/images/mild-sauce.png" },
      { name: "Ketchup", pricePence: 50, imageUrl: "/uploads/images/ketchup.png" },
    ],
  },

  /* ── Drinks ──────────────────────────────────────────── */
  {
    name: "Drinks",
    displayOrder: 100,
    items: [
      { name: "Can — Irn Bru", pricePence: 120, imageUrl: "/uploads/images/can-irn-bru.png" },
      { name: "Can — Pepsi", pricePence: 120, imageUrl: "/uploads/images/can-pepsi.png" },
      { name: "Can — Pepsi Max", pricePence: 120, imageUrl: "/uploads/images/can-pepsi-max.png" },
        { name: "Can — Coke", pricePence: 120, imageUrl: "/uploads/images/can-coke.png" },
      { name: "Can — Diet Coke", pricePence: 120, imageUrl: "/uploads/images/can-diet-coke.png" },
      { name: "Can — Fanta", pricePence: 120, imageUrl: "/uploads/images/can-fanta.png" },
      { name: "Can — Vimto", pricePence: 120, imageUrl: "/uploads/images/can-vimto-online.jpg" },
      { name: "Can — Tango", pricePence: 120, imageUrl: "/uploads/images/can-tango-online.jpg" },
      { name: "Can — Limeade", pricePence: 120, imageUrl: "/uploads/images/can-limeade.png" },
      { name: "Fruit Shoot", pricePence: 100, imageUrl: "/uploads/images/fruit-shoot-online.jpg" },
      { name: "Redbull", pricePence: 150, imageUrl: "/uploads/images/redbull-online.jpg" },
      { name: "Water (500ml)", pricePence: 100, imageUrl: "/uploads/images/water-500ml-online.jpg" },
      { name: "Water (1.5 Litre)", pricePence: 300, imageUrl: "/uploads/images/water-15l-online.webp" },
    ],
  },

  /* ── Desserts ────────────────────────────────────────── */
  {
    name: "Desserts",
    displayOrder: 110,
    items: [
      { name: "Ferrero Cake (Slice)", pricePence: 299, allergens: ["nuts", "eggs"], imageUrl: "/uploads/images/ferrero-cake-slice-online.jpg" },
      { name: "Ferrero Cake (Whole)", pricePence: 2499, allergens: ["nuts", "eggs"], imageUrl: "/uploads/images/ferrero-cake-whole-online.jpg" },
      { name: "Fruit Cake (Slice)", pricePence: 299, allergens: ["eggs"], imageUrl: "/uploads/images/fruit-cake-online.jpg" },
      { name: "Fruit Cake (Whole)", pricePence: 2799, allergens: ["eggs"], imageUrl: "/uploads/images/fruit-cake-online.jpg" },
      { name: "Chocolate Mousse Cake (Slice)", pricePence: 299, allergens: ["eggs"], imageUrl: "/uploads/images/chocolate-mousse-cake-online.jpg" },
      { name: "Chocolate Mousse Cake (Whole)", pricePence: 2499, allergens: ["eggs"], imageUrl: "/uploads/images/chocolate-mousse-cake-online.jpg" },
      { name: "Vanilla Cheesecake (Slice)", pricePence: 299, allergens: ["eggs"], imageUrl: "/uploads/images/vanilla-cheesecake-slice-online.jpg" },
      { name: "Vanilla Cheesecake (Whole)", pricePence: 2499, allergens: ["eggs"], imageUrl: "/uploads/images/vanilla-cheesecake-whole-online.jpg" },
      { name: "Strawberry Cheesecake (Slice)", pricePence: 299, allergens: ["eggs"], imageUrl: "/uploads/images/strawberry-cheesecake-slice-online.jpg" },
      { name: "Strawberry Cheesecake (Whole)", pricePence: 2499, allergens: ["eggs"], imageUrl: "/uploads/images/strawberry-cheesecake-whole-online.jpg" },
      { name: "Chocolate Cheesecake (Slice)", pricePence: 299, allergens: ["eggs"], imageUrl: "/uploads/images/chocolate-cheesecake-slice-online.jpg" },
      { name: "Chocolate Cheesecake (Whole)", pricePence: 2499, allergens: ["eggs"], imageUrl: "/uploads/images/chocolate-cheesecake-whole-online.jpg" },
      { name: "Chocolate Milkshake", pricePence: 599, allergens: [], imageUrl: "/uploads/images/chocolate-milkshake-online.jpg" },
      { name: "Strawberry Milkshake", pricePence: 599, allergens: [], imageUrl: "/uploads/images/strawberry-milkshake-online.jpg" },
      { name: "Coco Milkshake", pricePence: 599, allergens: [], imageUrl: "/uploads/images/coco-milkshake-online.jpg" },
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
