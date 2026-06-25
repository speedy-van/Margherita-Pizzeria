/**
 * Idempotent seed script.
 *
 * Run with: npm run db:seed
 *
 * Safe to re-run: existing rows (by table number, settings key, category name,
 * menu item (category + name) and time slot (type, time)) are left untouched.
 * Admin-changed prices are NEVER overwritten on repeat seeds.
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  menuCategories,
  menuItems,
  settings,
  tables,
  timeSlots,
  users,
} from "@/lib/db/schema";
import { deliveryRules, siteConfig } from "@/lib/config/site";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { env } from "@/lib/env";
import type { OpeningHours } from "@/types/database";

const TABLE_COUNT = siteConfig.tablesCount;
const DEFAULT_MAX_COVERS = 4;

const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { open: "11:00", close: "23:00" },
  tuesday: { open: "11:00", close: "23:00" },
  wednesday: { open: "11:00", close: "23:00" },
  thursday: { open: "11:00", close: "23:00" },
  friday: { open: "11:00", close: "00:00" },
  saturday: { open: "11:00", close: "00:00" },
  sunday: { open: "11:00", close: "23:00" },
};

const DEFAULT_SETTINGS: ReadonlyArray<{ key: string; value: unknown }> = [
  { key: "min_delivery_order_pence", value: deliveryRules.defaultMinOrderPence },
  { key: "delivery_fee_pence", value: deliveryRules.defaultDeliveryFeePence },
  { key: "prep_time_minutes", value: 25 },
  { key: "delivery_time_minutes", value: 45 },
  { key: "deposit_enabled", value: false },
  { key: "deposit_amount_pence", value: 0 },
  { key: "opening_hours", value: DEFAULT_OPENING_HOURS },
];

const DEFAULT_CATEGORIES: ReadonlyArray<{ name: string; displayOrder: number }> = [
  { name: "Stone Baked Pizzas", displayOrder: 10 },
  { name: "Chef's Selection Pizzas", displayOrder: 15 },
  { name: "Meal Deals", displayOrder: 20 },
  { name: "Kitchen Specials", displayOrder: 25 },
  { name: "Pasta", displayOrder: 30 },
  { name: "King Smashburgers", displayOrder: 35 },
  { name: "Wraps", displayOrder: 40 },
  { name: "Hoagies", displayOrder: 45 },
  { name: "Homemade Chicken", displayOrder: 50 },
  { name: "Grill Kebab", displayOrder: 55 },
  { name: "Mixed Grill", displayOrder: 60 },
  { name: "Loaded Fries", displayOrder: 65 },
  { name: "Naan & Manqusha", displayOrder: 70 },
  { name: "Sides", displayOrder: 75 },
  { name: "Dips", displayOrder: 80 },
  { name: "Drinks", displayOrder: 85 },
  { name: "Desserts", displayOrder: 90 },
];

interface SeedMenuItem {
  name: string;
  description: string;
  pricePence: number;
  allergens: string[];
  imageUrl?: string;
}

const DEFAULT_MENU_ITEMS: ReadonlyArray<{
  category: string;
  items: ReadonlyArray<SeedMenuItem>;
}> = [
  {
    category: "Stone Baked Pizzas",
    items: [
      {
        name: "Margherita (12\")",
        description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/margherita-real.jpg",
      },
      {
        name: "Margherita (16\")",
        description: "Fresh mozzarella, parmesan, fresh basil. Vegetarian.",
        pricePence: 1700,
        allergens: [],
        imageUrl: "/legacy/margherita-real.jpg",
      },
      {
        name: "Pepperoni (12\")",
        description: "Pepperoni, cherry tomato, mozzarella.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/pepperoni-real.jpg",
      },
      {
        name: "Pepperoni (16\")",
        description: "Pepperoni, cherry tomato, mozzarella.",
        pricePence: 1800,
        allergens: [],
        imageUrl: "/legacy/pepperoni-real.jpg",
      },
      {
        name: "Bolognese (12\")",
        description: "Bolognese mince, green pepper, onion, mozzarella.",
        pricePence: 1200,
        allergens: [],
        imageUrl: "/legacy/bolognese-real.jpg",
      },
      {
        name: "Bolognese (16\")",
        description: "Bolognese mince, green pepper, onion, mozzarella.",
        pricePence: 1900,
        allergens: [],
        imageUrl: "/legacy/bolognese-real.jpg",
      },
      {
        name: "Vegetarian (12\")",
        description:
          "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/vegetarian-real.jpg",
      },
      {
        name: "Vegetarian (16\")",
        description:
          "Red onion, black olive, green pepper, mushroom, egg plant, mozzarella.",
        pricePence: 1800,
        allergens: [],
        imageUrl: "/legacy/vegetarian-real.jpg",
      },
      {
        name: "Vesuvio (12\")",
        description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/vesuvio-real.jpg",
      },
      {
        name: "Vesuvio (16\")",
        description: "A Swedish classic. Ham, mozzarella, olive oil, oregano.",
        pricePence: 1800,
        allergens: [],
        imageUrl: "/legacy/vesuvio-real.jpg",
      },
      {
        name: "Hawaiian (12\")",
        description: "Pineapple, ham, mozzarella.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/hawaiian-real.jpg",
      },
      {
        name: "Hawaiian (16\")",
        description: "Pineapple, ham, mozzarella.",
        pricePence: 1900,
        allergens: [],
        imageUrl: "/legacy/hawaiian-real.jpg",
      },
      {
        name: "Donner Kebab (12\")",
        description: "Donner, mixed salad, garlic sauce, mozzarella.",
        pricePence: 1200,
        allergens: [],
        imageUrl: "/legacy/donner-real.jpg",
      },
      {
        name: "Donner Kebab (16\")",
        description: "Donner, mixed salad, garlic sauce, mozzarella.",
        pricePence: 1800,
        allergens: [],
        imageUrl: "/legacy/donner-real.jpg",
      },
      {
        name: "Calzone (12\" only)",
        description:
          "Folded sourdough: 1 meat + 2 veg of your choice, mozzarella.",
        pricePence: 1300,
        allergens: [],
        imageUrl: "/legacy/calzone-real.jpg",
      },
      {
        name: "Altono (12\")",
        description: "Red onion, tuna, mozzarella, black olive, basil.",
        pricePence: 1200,
        allergens: ["fish"],
        imageUrl: "/legacy/altono-real.jpg",
      },
      {
        name: "Altono (16\")",
        description: "Red onion, tuna, mozzarella, black olive, basil.",
        pricePence: 1900,
        allergens: ["fish"],
        imageUrl: "/legacy/altono-real.jpg",
      },
      {
        name: "Capricciosa (12\")",
        description: "Ham, mushroom, mozzarella.",
        pricePence: 1100,
        allergens: [],
        imageUrl: "/legacy/capricciosa-real.jpg",
      },
      {
        name: "Capricciosa (16\")",
        description: "Ham, mushroom, mozzarella.",
        pricePence: 1900,
        allergens: [],
        imageUrl: "/legacy/capricciosa-real.jpg",
      },
      {
        name: "Mexican (12\")",
        description:
          "Fresh mince, green pepper, onion, green chilli, mozzarella.",
        pricePence: 1200,
        allergens: [],
        imageUrl: "/legacy/mexican-real.jpg",
      },
      {
        name: "Mexican (16\")",
        description:
          "Fresh mince, green pepper, onion, green chilli, mozzarella.",
        pricePence: 1900,
        allergens: [],
        imageUrl: "/legacy/mexican-real.jpg",
      },
    ],
  },
  {
    category: "Chef's Selection Pizzas",
    items: [
      {
        name: "Four Seasons (12\")",
        description:
          "Pepperoni, bolognese, ham and mushroom, spicy chicken, mozzarella.",
        pricePence: 1200,
        allergens: [],
      },
      {
        name: "Four Seasons (16\")",
        description:
          "Pepperoni, bolognese, ham and mushroom, spicy chicken, mozzarella.",
        pricePence: 1800,
        allergens: [],
      },
      {
        name: "Spicy Chicken (12\")",
        description: "Grilled chicken, mozzarella, green pepper, red onion.",
        pricePence: 1200,
        allergens: [],
        imageUrl: "/legacy/spicy-chicken-real.jpg",
      },
      {
        name: "Spicy Chicken (16\")",
        description: "Grilled chicken, mozzarella, green pepper, red onion.",
        pricePence: 1800,
        allergens: [],
        imageUrl: "/legacy/spicy-chicken-real.jpg",
      },
      {
        name: "Marinara (12\")",
        description: "Prawns, half lemon, fresh garlic, parmesan.",
        pricePence: 1300,
        allergens: ["crustaceans"],
      },
      {
        name: "Marinara (16\")",
        description: "Prawns, half lemon, fresh garlic, parmesan.",
        pricePence: 2000,
        allergens: ["crustaceans"],
      },
      {
        name: "Napoli (12\")",
        description:
          "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.",
        pricePence: 1200,
        allergens: [],
      },
      {
        name: "Napoli (16\")",
        description:
          "Buffalo mozzarella, cherry tomato, parmesan, fresh basil. Vegetarian.",
        pricePence: 2000,
        allergens: [],
      },
      {
        name: "Pesto Pizza (12\")",
        description:
          "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.",
        pricePence: 1200,
        allergens: ["nuts"],
      },
      {
        name: "Pesto Pizza (16\")",
        description:
          "Feta, green pesto, black olive, parmesan (no tomato sauce). Vegetarian.",
        pricePence: 1900,
        allergens: ["nuts"],
      },
      {
        name: "Four Cheese (12\")",
        description:
          "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce). Vegetarian.",
        pricePence: 1300,
        allergens: [],
      },
      {
        name: "Four Cheese (16\")",
        description:
          "Feta, gorgonzola, parmesan, mozzarella (no tomato sauce). Vegetarian.",
        pricePence: 2000,
        allergens: [],
      },
      {
        name: "Stuffed Crust Special (12\")",
        description: "Black olive, green pepper, mushroom, mozzarella.",
        pricePence: 1500,
        allergens: [],
      },
      {
        name: "Stuffed Crust Special (16\")",
        description: "Black olive, green pepper, mushroom, mozzarella.",
        pricePence: 2300,
        allergens: [],
      },
      {
        name: "Sausage Pizza (12\")",
        description:
          "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips/salad.",
        pricePence: 1200,
        allergens: [],
      },
      {
        name: "Sausage Pizza (16\")",
        description:
          "Savoury sausage, red onion, green pepper, zucchini, mozzarella (no tomato sauce). Served with chips/salad.",
        pricePence: 1900,
        allergens: [],
      },
      {
        name: "King Crown BBQ Chicken (12\" only)",
        description:
          "BBQ chicken, mozzarella, sourdough crown dome. Served with chips/salad.",
        pricePence: 1500,
        allergens: [],
      },
      {
        name: "Egg Pizza (12\" only)",
        description:
          "Two eggs, sea salt, pepper, parmesan, mozzarella. Served with chips/salad. Vegetarian.",
        pricePence: 1200,
        allergens: ["egg"],
      },
      {
        name: "Seafood Pizza (12\" only)",
        description:
          "Shrimp, calamari, anchovies, mussels, rocket, dill, mozzarella.",
        pricePence: 1700,
        allergens: ["fish", "crustaceans", "molluscs"],
      },
      {
        name: "Glasgow Pizza (12\" only)",
        description:
          "Half pasta white sauce, half double cheese. Vegetarian.",
        pricePence: 1500,
        allergens: [],
      },
      {
        name: "Philadelphia (12\")",
        description: "Soya sauce, mushroom, green pepper, mozzarella. Vegetarian.",
        pricePence: 1100,
        allergens: ["soya"],
      },
      {
        name: "Philadelphia (16\")",
        description: "Soya sauce, mushroom, green pepper, mozzarella. Vegetarian.",
        pricePence: 1900,
        allergens: ["soya"],
      },
      {
        name: "Syrian (12\")",
        description:
          "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.",
        pricePence: 1200,
        allergens: [],
      },
      {
        name: "Syrian (16\")",
        description:
          "Chicken curry, mushroom, sweetcorn, green pepper, tomato base sauce, mozzarella.",
        pricePence: 1900,
        allergens: [],
      },
    ],
  },
  {
    category: "Meal Deals",
    items: [
      {
        name: "Mon–Thu: Pizza Deal",
        description:
          "10\" pizza + chips + drink. Monday to Thursday, 11am to 4pm.",
        pricePence: 1000,
        allergens: [],
        imageUrl: "/legacy/deal-lunch.jpg",
      },
      {
        name: "Mon–Thu: King Smashburger Deal",
        description:
          "King Smashburger + chips + drink. Monday to Thursday, 11am to 4pm.",
        pricePence: 750,
        allergens: ["sesame"],
        imageUrl: "/legacy/deal-smashburger.jpg",
      },
      {
        name: "Weekend 10\" Deal",
        description: "2× 10\" pizza + chips. No drinks. Weekends only.",
        pricePence: 1499,
        allergens: [],
        imageUrl: "/legacy/deal-weekend-pizza.jpg",
      },
      {
        name: "Weekend 12\" Deal",
        description: "2× 12\" pizza + chips. No drinks. Weekends only.",
        pricePence: 1899,
        allergens: [],
        imageUrl: "/legacy/deal-weekend-pizza.jpg",
      },
      {
        name: "Weekend Family Deal",
        description: "3× 12\" pizza + chips. No drinks. Feed the whole family for less.",
        pricePence: 2499,
        allergens: [],
        imageUrl: "/legacy/deal-weekend-pizza.jpg",
      },
      {
        name: "Weekend King Smashburger Deal",
        description: "2 king smashburgers + chips. Weekends only. No drinks.",
        pricePence: 1500,
        allergens: ["sesame"],
        imageUrl: "/legacy/deal-smashburger-double.jpg",
      },
      {
        name: "Kids Deal",
        description:
          "Kids pizza, king smashburger or nuggets + chips + fruit shoot. Every day.",
        pricePence: 499,
        allergens: [],
        imageUrl: "/legacy/deal-kids.jpg",
      },
      {
        name: "Golden Box",
        description:
          "Shawarma, crispy chicken, pakora, donner, sajj, chips, manqusha, dips, 2 drinks.",
        pricePence: 1499,
        allergens: ["sesame"],
        imageUrl: "/legacy/deal-golden-box.jpg",
      },
    ],
  },
  {
    category: "Kitchen Specials",
    items: [
      {
        name: "Kebab Doner Box (Regular)",
        description: "Doner meat with chips, salad and sauce.",
        pricePence: 550,
        allergens: ["sesame"],
      },
      {
        name: "Kebab Doner Box (Large)",
        description: "Doner meat with chips, salad and sauce.",
        pricePence: 750,
        allergens: ["sesame"],
      },
      {
        name: "Crispy Chicken Plate (Regular)",
        description: "Crispy chicken, chips, salad and sauce.",
        pricePence: 799,
        allergens: [],
      },
      {
        name: "Crispy Chicken Plate (Large)",
        description: "Crispy chicken, chips, salad and sauce.",
        pricePence: 1499,
        allergens: [],
      },
      {
        name: "Shawarma Chicken Plate",
        description: "Chicken shawarma with chips, salad and sauce.",
        pricePence: 999,
        allergens: ["sesame"],
      },
      {
        name: "Falafel Plate",
        description: "Falafel with chips, salad and sauce. Vegetarian.",
        pricePence: 999,
        allergens: ["sesame"],
      },
    ],
  },
  {
    category: "Pasta",
    items: [
      {
        name: "Chicken Alfredo Pasta",
        description:
          "White sauce, mushroom, green pepper, chicken, onion, parmesan.",
        pricePence: 1199,
        allergens: [],
      },
      {
        name: "Penne all'Arrabbiata",
        description:
          "Garlic, onion, black olive, tomato sauce, cheese, green chilli. Vegetarian.",
        pricePence: 999,
        allergens: [],
      },
    ],
  },
  {
    category: "King Smashburgers",
    items: [
      {
        name: "King Smashburger",
        description: "Smashed patty, cheddar, chips.",
        pricePence: 750,
        allergens: ["sesame"],
      },
      {
        name: "King Smashburger Double",
        description: "Double patty, salad, sauce, cheddar, chips.",
        pricePence: 999,
        allergens: ["sesame"],
      },
      {
        name: "Chicken Burger",
        description: "Crispy chicken, cheddar, chips.",
        pricePence: 750,
        allergens: ["sesame"],
      },
      {
        name: "Halloumi Burger",
        description: "Grilled halloumi, cheddar, chips. Vegetarian.",
        pricePence: 750,
        allergens: ["sesame"],
      },
      {
        name: "Vegetarian Burger",
        description: "Veggie patty, cheddar, chips. Vegetarian.",
        pricePence: 750,
        allergens: ["sesame"],
      },
      {
        name: "Plain Smashburger",
        description: "Just the patty, no cheese, with chips.",
        pricePence: 550,
        allergens: ["sesame"],
      },
    ],
  },
  {
    category: "Wraps",
    items: [
      {
        name: "Chicken Shawarma Wrap",
        description: "Salad and sauce. Add a can for £1 extra.",
        pricePence: 699,
        allergens: ["sesame"],
      },
      {
        name: "Crispy Chicken Wrap",
        description: "Salad and sauce. Add a can for £1 extra.",
        pricePence: 699,
        allergens: [],
      },
      {
        name: "Lamb Kebab Wrap",
        description: "Salad and sauce. Add a can for £1 extra.",
        pricePence: 699,
        allergens: ["sesame"],
      },
      {
        name: "Chicken Tikka Wrap",
        description: "Salad and sauce. Add a can for £1 extra.",
        pricePence: 699,
        allergens: [],
      },
      {
        name: "Falafel Wrap",
        description: "Salad and sauce. Add a can for £1 extra. Vegetarian.",
        pricePence: 699,
        allergens: ["sesame"],
      },
    ],
  },
  {
    category: "Hoagies",
    items: [
      {
        name: "Chicken Shawarma Hoagie",
        description: "Cheese, chips, salad and sauce. Add a can for £1 extra.",
        pricePence: 899,
        allergens: ["sesame"],
      },
      {
        name: "Donner Kebab Hoagie",
        description: "Cheese, chips, salad and sauce. Add a can for £1 extra.",
        pricePence: 899,
        allergens: ["sesame"],
      },
      {
        name: "Lamb Kebab Hoagie",
        description: "Cheese, chips, salad and sauce. Add a can for £1 extra.",
        pricePence: 899,
        allergens: ["sesame"],
      },
      {
        name: "Crispy Chicken Hoagie",
        description: "Cheese, chips, salad and sauce. Add a can for £1 extra.",
        pricePence: 899,
        allergens: [],
      },
    ],
  },
  {
    category: "Homemade Chicken",
    items: [
      {
        name: "Peri Peri Chicken (Full)",
        description: "Served with chips or rice, salad and sauce.",
        pricePence: 1199,
        allergens: [],
      },
      {
        name: "Peri Peri Chicken (Half)",
        description: "Served with chips or rice, salad and sauce.",
        pricePence: 799,
        allergens: [],
      },
      {
        name: "Broasted Chicken (Full)",
        description: "Served with chips or rice, salad and sauce.",
        pricePence: 1499,
        allergens: [],
      },
      {
        name: "Broasted Chicken (Half)",
        description: "Served with chips or rice, salad and sauce.",
        pricePence: 899,
        allergens: [],
      },
      {
        name: "Spicy Broasted (Full)",
        description: "Spicy broasted chicken, chips or rice, salad and sauce.",
        pricePence: 1599,
        allergens: [],
      },
    ],
  },
  {
    category: "Grill Kebab",
    items: [
      {
        name: "Chicken Shish Tikka",
        description: "Chips or rice, salad and sauce.",
        pricePence: 950,
        allergens: [],
      },
      {
        name: "Lamb Koobideh Kebab (Regular)",
        description: "Chips or rice, salad and sauce.",
        pricePence: 749,
        allergens: [],
      },
      {
        name: "Lamb Koobideh Kebab (Large)",
        description: "Chips or rice, salad and sauce.",
        pricePence: 1049,
        allergens: [],
      },
      {
        name: "Afghani Tikka (5pcs)",
        description: "5 pieces. Chips or rice, salad and sauce.",
        pricePence: 799,
        allergens: [],
      },
      {
        name: "Afghani Tikka (10pcs)",
        description: "10 pieces. Chips or rice, salad and sauce.",
        pricePence: 1199,
        allergens: [],
      },
    ],
  },
  {
    category: "Mixed Grill",
    items: [
      {
        name: "Mix Grill 01",
        description:
          "1 skewer of each: Shish Tikka, Lamb Koobideh, Donner or Shawarma. Chips or rice. Grill onion and green pepper.",
        pricePence: 1399,
        allergens: ["sesame"],
      },
      {
        name: "Mix Grill 02",
        description:
          "Mix Grill 01 + 5 Chicken BBQ Wings, Donner or Shawarma. Chips or rice.",
        pricePence: 1799,
        allergens: ["sesame"],
      },
      {
        name: "Mix Grill 03",
        description:
          "2× Shish Tikka, 2× Lamb Koobideh, Wings, Donner or Shawarma. 1.5L cola included.",
        pricePence: 2999,
        allergens: ["sesame"],
      },
    ],
  },
  {
    category: "Loaded Fries",
    items: [
      {
        name: "Crispy Chicken Loaded Fries",
        description: "Cheddar cheese sauce, jalapeño and dry onion.",
        pricePence: 699,
        allergens: [],
      },
      {
        name: "Bolognese Loaded Fries",
        description: "Cheddar cheese sauce, jalapeño and dry onion.",
        pricePence: 699,
        allergens: [],
      },
      {
        name: "Chicken Shawarma Fries",
        description: "Cheddar cheese sauce, jalapeño and dry onion.",
        pricePence: 699,
        allergens: ["sesame"],
      },
    ],
  },
  {
    category: "Naan & Manqusha",
    items: [
      { name: "Zaatar (Thyme)", description: "Manqusha with za'atar.", pricePence: 300, allergens: ["sesame"] },
      { name: "Mohamara", description: "Manqusha with mohamara.", pricePence: 300, allergens: ["nuts"] },
      { name: "Lahma", description: "Manqusha with spiced minced lamb.", pricePence: 300, allergens: [] },
      { name: "Mortadella + Cheese", description: "Manqusha with mortadella and cheese.", pricePence: 300, allergens: [] },
      { name: "Mohamara + Cheese", description: "Manqusha with mohamara and cheese.", pricePence: 300, allergens: ["nuts"] },
      { name: "Garlic Naan", description: "Freshly baked garlic naan.", pricePence: 300, allergens: [] },
      { name: "Chilli Naan", description: "Freshly baked chilli naan.", pricePence: 300, allergens: [] },
    ],
  },
  {
    category: "Sides",
    items: [
      { name: "Chips (Regular)", description: "Skin-on chips.", pricePence: 399, allergens: [] },
      { name: "Chips (Large)", description: "Skin-on chips.", pricePence: 499, allergens: [] },
      { name: "Chips & Cheese", description: "Chips smothered in melted cheese.", pricePence: 599, allergens: [] },
      { name: "Onion Rings (Small, 5pcs)", description: "5 pieces.", pricePence: 299, allergens: [] },
      { name: "Onion Rings (Large, 10pcs)", description: "10 pieces.", pricePence: 599, allergens: [] },
      { name: "Chilli Cheese", description: "Chilli with melted cheese.", pricePence: 499, allergens: [] },
      { name: "Mozzarella Sticks", description: "6 pieces, crispy.", pricePence: 499, allergens: [] },
      { name: "Chicken Nuggets", description: "6 pieces.", pricePence: 599, allergens: [] },
      { name: "BBQ Wings (Regular)", description: "BBQ-glazed wings.", pricePence: 599, allergens: [] },
      { name: "BBQ Wings (Large)", description: "BBQ-glazed wings.", pricePence: 999, allergens: [] },
      { name: "Falafel (Regular)", description: "Crispy falafel. Vegetarian.", pricePence: 599, allergens: ["sesame"] },
      { name: "Falafel (Large)", description: "Crispy falafel. Vegetarian.", pricePence: 999, allergens: ["sesame"] },
    ],
  },
  {
    category: "Dips",
    items: [
      { name: "Garlic Mayo", description: "House garlic mayo dip.", pricePence: 50, allergens: ["egg"] },
      { name: "Sweet Chilli", description: "Sweet chilli dip.", pricePence: 50, allergens: [] },
      { name: "American Sauce", description: "American-style burger sauce.", pricePence: 50, allergens: ["egg"] },
      { name: "BBQ Sauce", description: "BBQ dipping sauce.", pricePence: 50, allergens: [] },
      { name: "Mild Sauce", description: "Mild chilli dipping sauce.", pricePence: 50, allergens: [] },
      { name: "Ketchup", description: "Tomato ketchup.", pricePence: 50, allergens: [] },
    ],
  },
  {
    category: "Drinks",
    items: [
      { name: "Can — Irn Bru", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Pepsi", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Pepsi Max", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Coke", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Diet Coke", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Fanta", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Vimto", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Tango", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Can — Limeade", description: "330ml can.", pricePence: 120, allergens: [] },
      { name: "Fruit Shoot", description: "Kids' fruit drink.", pricePence: 100, allergens: [] },
      { name: "Red Bull", description: "Energy drink.", pricePence: 150, allergens: [] },
      { name: "Water", description: "500ml still water.", pricePence: 100, allergens: [] },
      { name: "1.5L Bottle", description: "1.5 litre soft drink.", pricePence: 300, allergens: [] },
    ],
  },
  {
    category: "Desserts",
    items: [
      { name: "Ferrero Cake (Slice)", description: "Indulgent Ferrero cake by the slice.", pricePence: 299, allergens: ["egg", "nuts"] },
      { name: "Ferrero Cake (Whole)", description: "Whole Ferrero cake.", pricePence: 2499, allergens: ["egg", "nuts"] },
      { name: "Chocolate Mousse (Slice)", description: "Rich chocolate mousse cake.", pricePence: 299, allergens: ["egg"] },
      { name: "Chocolate Mousse (Whole)", description: "Whole chocolate mousse cake.", pricePence: 2499, allergens: ["egg"] },
      { name: "Cheesecake (Slice)", description: "Creamy cheesecake by the slice.", pricePence: 299, allergens: ["egg"] },
      { name: "Cheesecake (Whole)", description: "Whole cheesecake.", pricePence: 2499, allergens: ["egg"] },
      { name: "Fruit Cake (Slice)", description: "Fruit cake by the slice.", pricePence: 299, allergens: ["egg"] },
      { name: "Fruit Cake (Whole)", description: "Whole fruit cake.", pricePence: 2799, allergens: ["egg"] },
      { name: "Chocolate Milkshake", description: "Chocolate milkshake.", pricePence: 599, allergens: [] },
      { name: "Strawberry Milkshake", description: "Strawberry milkshake.", pricePence: 599, allergens: [] },
      { name: "Coconut Milkshake", description: "Coconut milkshake.", pricePence: 599, allergens: [] },
    ],
  },
];

function generateSlots(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  stepMinutes: number,
): string[] {
  const out: string[] = [];
  let h = startHour;
  let m = startMinute;
  while (h < endHour || (h === endHour && m <= endMinute)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += stepMinutes;
    while (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
}

async function seedTables(): Promise<void> {
  for (let number = 1; number <= TABLE_COUNT; number += 1) {
    const existing = await db
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.number, number))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(tables).values({
        number,
        maxCovers: DEFAULT_MAX_COVERS,
      });
    }
  }
}

async function seedSettings(): Promise<void> {
  for (const entry of DEFAULT_SETTINGS) {
    const existing = await db
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, entry.key))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values(entry);
    }
  }
}

async function seedCategories(): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.name, cat.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(menuCategories).values(cat);
    }
  }
}

async function seedMenuItems(): Promise<void> {
  const cats = await db
    .select({ id: menuCategories.id, name: menuCategories.name })
    .from(menuCategories);
  const catByName = new Map<string, string>();
  for (const c of cats) {
    catByName.set(c.name, c.id);
  }

  for (const group of DEFAULT_MENU_ITEMS) {
    const categoryId = catByName.get(group.category);
    if (!categoryId) continue;

    for (const item of group.items) {
      const existing = await db
        .select({ id: menuItems.id, imageUrl: menuItems.imageUrl })
        .from(menuItems)
        .where(
          and(
            eq(menuItems.categoryId, categoryId),
            eq(menuItems.name, item.name),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(menuItems).values({
          categoryId,
          name: item.name,
          description: item.description,
          pricePence: item.pricePence,
          available: true,
          allergens: item.allergens,
          imageUrl: item.imageUrl ?? null,
        });
      } else {
        const row = existing[0];
        if (row && item.imageUrl && !row.imageUrl) {
          // Backfill image on existing rows that don't already have one
          // (admin-uploaded images are preserved).
          await db
            .update(menuItems)
            .set({ imageUrl: item.imageUrl })
            .where(eq(menuItems.id, row.id));
        }
      }
    }
  }
}

async function seedTimeSlots(): Promise<void> {
  const collectionTimes = generateSlots(11, 0, 23, 45, 15);
  const bookingTimes = generateSlots(11, 0, 22, 30, 30);

  for (const time of collectionTimes) {
    const existing = await db
      .select({ id: timeSlots.id })
      .from(timeSlots)
      .where(and(eq(timeSlots.type, "collection"), eq(timeSlots.time, time)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(timeSlots).values({ type: "collection", time });
    }
  }

  for (const time of bookingTimes) {
    const existing = await db
      .select({ id: timeSlots.id })
      .from(timeSlots)
      .where(and(eq(timeSlots.type, "booking"), eq(timeSlots.time, time)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(timeSlots).values({ type: "booking", time });
    }
  }
}

async function seedAdminUser(): Promise<void> {
  const emailRaw = env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_SEED_PASSWORD;
  if (!emailRaw || !password) {
    // eslint-disable-next-line no-console
    console.log(
      "[seed] admin seed skipped (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set)",
    );
    return;
  }

  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    // eslint-disable-next-line no-console
    console.error(`[seed] ADMIN_SEED_PASSWORD rejected: ${strength.message}`);
    return;
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, emailRaw))
    .limit(1);
  if (existing.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[seed] admin seed user exists");
    return;
  }

  const hashed = await hashPassword(password);
  await db.insert(users).values({
    email: emailRaw,
    hashedPw: hashed,
    role: "admin",
  });
  // eslint-disable-next-line no-console
  console.log("[seed] admin seed user created");
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[seed] starting…");
  await seedTables();
  await seedSettings();
  await seedCategories();
  await seedMenuItems();
  await seedTimeSlots();
  await seedAdminUser();
  // eslint-disable-next-line no-console
  console.log("[seed] done.");
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed:", err);
  process.exit(1);
});
