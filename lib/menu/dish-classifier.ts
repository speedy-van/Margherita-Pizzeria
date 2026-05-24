/**
 * Best-effort mapping from a menu item name → a dish "kind" + a brand palette.
 *
 * Used by:
 *  - The dynamic SVG placeholder route (`/api/menu/image/[slug]`) to render an
 *    on-brand illustrated card whenever a real photo is not available.
 *  - The menu / cart UI to resolve a fallback `imageUrl` when the database
 *    has none.
 *
 * Why not real photos for every item? We have hand-shot photos for the
 * popular pizzas in `/public/legacy/*`. For the rest (burgers, wraps,
 * hoagies, kebabs, sides, drinks, desserts, deals…) we render a designed
 * SVG so the menu *always* looks finished and on-brand — instead of empty
 * grey boxes or mismatched stock photos.
 */

export type DishKind =
  | "pizza-margherita"
  | "pizza-pepperoni"
  | "pizza-veggie"
  | "pizza-hawaiian"
  | "pizza-bbq"
  | "pizza-cheese"
  | "pizza-seafood"
  | "pizza-meat"
  | "pizza-generic"
  | "calzone"
  | "burger"
  | "wrap"
  | "hoagie"
  | "kebab"
  | "chicken"
  | "pasta"
  | "manqusha"
  | "salad"
  | "side"
  | "dessert"
  | "drink"
  | "deal"
  | "dish";

export interface DishMeta {
  kind: DishKind;
  /** Brand-matched gradient pair `[from, to]` for the card background. */
  palette: [string, string];
  /** Short label rendered as the "category" eyebrow on the SVG. */
  category: string;
  /** Photo override under /public — when present, prefer it over the SVG. */
  photo?: string;
}

const norm = (s: string) => s.toLowerCase();

/** Direct photo overrides for our hand-shot pizzas (and a few deals). */
const PHOTO_OVERRIDES: Array<{ test: RegExp; photo: string }> = [
  { test: /\bmargherita\b/, photo: "/legacy/margherita-real.jpg" },
  { test: /\bpepperoni\b/, photo: "/legacy/pepperoni-real.jpg" },
  { test: /\bhawaiian\b/, photo: "/legacy/hawaiian-real.jpg" },
  { test: /\bvegetarian\b/, photo: "/legacy/vegetarian-real.jpg" },
  { test: /\bvesuvio\b/, photo: "/legacy/vesuvio-real.jpg" },
  { test: /\bcapricciosa\b/, photo: "/legacy/capricciosa-real.jpg" },
  { test: /\bmexican\b/, photo: "/legacy/mexican-real.jpg" },
  { test: /\bdonner\b/, photo: "/legacy/donner-real.jpg" },
  { test: /\bcalzone\b/, photo: "/legacy/calzone-real.jpg" },
  { test: /\baltono\b/, photo: "/legacy/altono-real.jpg" },
  { test: /\bbolognese\b/, photo: "/legacy/bolognese-real.jpg" },
  { test: /\bspicy chicken\b.*pizza|pizza.*spicy chicken/, photo: "/legacy/spicy-chicken-real.jpg" },
  { test: /\bgolden box\b/, photo: "/legacy/deal-golden-box.jpg" },
  { test: /\bkids? deal\b/, photo: "/legacy/deal-kids.jpg" },
  { test: /\blunch\b.*deal|deal.*\blunch\b/, photo: "/legacy/deal-lunch.jpg" },
  { test: /\bweekend\b.*pizza|family\b.*deal/, photo: "/legacy/deal-weekend-pizza.jpg" },
  { test: /\bsmashburger double\b/, photo: "/legacy/deal-smashburger-double.jpg" },
  { test: /\bsmashburger\b/, photo: "/legacy/deal-smashburger.jpg" },
];

/** Brand palette presets. Tuned to the existing brand tokens. */
const PALETTE = {
  tomato: ["#C0392B", "#E67E22"] as [string, string],
  ember: ["#7A1D12", "#C0392B"] as [string, string],
  basil: ["#1F6B3A", "#3E8E55"] as [string, string],
  sand: ["#8a6a3a", "#d2a85a"] as [string, string],
  ocean: ["#0E4F73", "#0EA5E9"] as [string, string],
  grape: ["#4C1D95", "#8B5CF6"] as [string, string],
  charcoal: ["#1f1f1f", "#3a3a3a"] as [string, string],
  golden: ["#8B6914", "#E0B341"] as [string, string],
} as const;

/** Order matters — first match wins. */
const RULES: Array<{ test: RegExp; meta: Omit<DishMeta, "photo"> }> = [
  // Pizzas (specific before generic)
  { test: /\bmargherita\b/, meta: { kind: "pizza-margherita", palette: PALETTE.basil, category: "Stone-baked pizza" } },
  { test: /\bpepperoni\b/, meta: { kind: "pizza-pepperoni", palette: PALETTE.tomato, category: "Stone-baked pizza" } },
  { test: /\bhawaiian\b/, meta: { kind: "pizza-hawaiian", palette: PALETTE.golden, category: "Stone-baked pizza" } },
  { test: /\bvegetarian\b|\bveggie\b|\bnapoli\b|\bpesto\b/, meta: { kind: "pizza-veggie", palette: PALETTE.basil, category: "Stone-baked pizza" } },
  { test: /\bbbq\b|king crown/, meta: { kind: "pizza-bbq", palette: PALETTE.ember, category: "Stone-baked pizza" } },
  { test: /\bfour cheese\b|\bcheese pizza\b|\bfour formaggi\b/, meta: { kind: "pizza-cheese", palette: PALETTE.sand, category: "Stone-baked pizza" } },
  { test: /\bseafood\b|\bmarinara\b|\baltono\b/, meta: { kind: "pizza-seafood", palette: PALETTE.ocean, category: "Stone-baked pizza" } },
  { test: /\b(bolognese|mexican|capricciosa|vesuvio|donner|spicy chicken|syrian|philadelphia|sausage|four seasons|egg pizza|glasgow|stuffed crust)\b/, meta: { kind: "pizza-meat", palette: PALETTE.ember, category: "Stone-baked pizza" } },
  { test: /\bpizza\b/, meta: { kind: "pizza-generic", palette: PALETTE.tomato, category: "Stone-baked pizza" } },

  // Calzone
  { test: /\bcalzone\b/, meta: { kind: "calzone", palette: PALETTE.sand, category: "Folded sourdough" } },

  // Burgers
  { test: /\b(smashburger|burger)\b/, meta: { kind: "burger", palette: PALETTE.ember, category: "Smashburger" } },

  // Wraps / hoagies
  { test: /\bwrap\b/, meta: { kind: "wrap", palette: PALETTE.sand, category: "Wrap" } },
  { test: /\bhoagie\b/, meta: { kind: "hoagie", palette: PALETTE.tomato, category: "Hoagie" } },

  // Kebabs / mixed grill
  { test: /\b(kebab|koobideh|shish|tikka|shawarma|mix grill|mixed grill|broasted|peri peri|afghani)\b/, meta: { kind: "kebab", palette: PALETTE.ember, category: "Grill" } },

  // Chicken plates
  { test: /\b(chicken|wings)\b/, meta: { kind: "chicken", palette: PALETTE.golden, category: "Chicken" } },

  // Pasta
  { test: /\b(pasta|alfredo|arrabbiata|penne|spaghetti)\b/, meta: { kind: "pasta", palette: PALETTE.tomato, category: "Pasta" } },

  // Manqusha / flatbreads
  { test: /\b(manqusha|zaatar|mohamara|lahma|mortadella)\b/, meta: { kind: "manqusha", palette: PALETTE.basil, category: "Stone-baked flatbread" } },

  // Salads
  { test: /\bsalad\b|\bfattoush\b|\btabbouleh\b/, meta: { kind: "salad", palette: PALETTE.basil, category: "Salad" } },

  // Sides
  { test: /\b(chips|fries|garlic bread|wedges|onion rings|nuggets|dip|sauce)\b/, meta: { kind: "side", palette: PALETTE.golden, category: "Side" } },

  // Desserts
  { test: /\b(tiramisu|cannoli|nutella|ice cream|brownie|cheesecake|dessert|baklava|kunafa)\b/, meta: { kind: "dessert", palette: PALETTE.grape, category: "Dessert" } },

  // Drinks
  { test: /\b(coke|cola|pepsi|fanta|sprite|water|pellegrino|juice|lemonade|drink|can|bottle|tea|coffee)\b/, meta: { kind: "drink", palette: PALETTE.ocean, category: "Drink" } },

  // Deals
  { test: /\bdeal\b|\bbox\b|\bcombo\b|\bmeal\b/, meta: { kind: "deal", palette: PALETTE.ember, category: "Deal" } },

  // Falafel default
  { test: /\bfalafel\b/, meta: { kind: "wrap", palette: PALETTE.basil, category: "Plant-based" } },
];

export function classifyDish(name: string): DishMeta {
  const n = norm(name);

  // Photo override first.
  for (const o of PHOTO_OVERRIDES) {
    if (o.test.test(n)) {
      const meta = (RULES.find((r) => r.test.test(n))?.meta) ?? {
        kind: "dish" as DishKind,
        palette: PALETTE.tomato,
        category: "Dish",
      };
      return { ...meta, photo: o.photo };
    }
  }

  for (const r of RULES) {
    if (r.test.test(n)) return { ...r.meta };
  }

  return { kind: "dish", palette: PALETTE.charcoal, category: "Dish" };
}

/** Returns the best image URL we can produce for an item, given an existing one (if any). */
export function resolveMenuImageUrl(
  name: string,
  existingUrl: string | null | undefined,
): string {
  if (existingUrl && existingUrl.trim() !== "") return existingUrl;
  const meta = classifyDish(name);
  if (meta.photo) return meta.photo;
  // Fall back to the dynamic SVG card.
  const slug = encodeURIComponent(name.trim().slice(0, 80));
  return `/api/menu/image/${slug}`;
}
