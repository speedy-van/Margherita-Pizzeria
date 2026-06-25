import { siteConfig } from "@/lib/config/site";

export type SeoChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface PublicSeoRoute {
  path: string;
  priority: number;
  changeFrequency: SeoChangeFrequency;
  title: string;
  description: string;
}

/**
 * Indexable public routes for Margherita Pizzeria. Used by `app/sitemap.ts`
 * and crawl-sanity helpers. Do NOT add landing pages, admin pages,
 * success pages, tracking pages, or API routes here.
 */
export const publicSeoRoutes: readonly PublicSeoRoute[] = [
  {
    path: "/",
    priority: 1.0,
    changeFrequency: "weekly",
    title: "Sourdough Pizza, Halal, in Dennistoun | Margherita Pizzeria",
    description:
      "Authentic Italian sourdough pizza on Alexandra Parade, Dennistoun. 24-hour cold-proved dough, stone-baked and halal certified. Pizza delivery across Glasgow's East End (£3.99, up to 4 miles), collection and dine-in.",
  },
  {
    path: "/menu",
    priority: 0.9,
    changeFrequency: "weekly",
    title: "Menu · Sourdough Pizza, Kebab, Burgers | Margherita Pizzeria",
    description:
      "Stone-baked sourdough pizzas, kebabs, burgers, pasta and grill. Halal certified. Delivery across Dennistoun and Glasgow's East End for a £3.99 flat fee (up to 4 miles).",
  },
  {
    path: "/order",
    priority: 0.9,
    changeFrequency: "daily",
    title: "Order Online · Halal Sourdough Pizza Glasgow | Margherita Pizzeria",
    description:
      "Order halal sourdough pizza, kebabs and burgers online from Margherita Pizzeria. £3.99 flat delivery across Dennistoun and Glasgow's East End (up to 4 miles).",
  },
  {
    path: "/book",
    priority: 0.8,
    changeFrequency: "daily",
    title: "Book a Table · Alexandra Parade | Margherita Pizzeria",
    description:
      "Book one of six tables at Margherita Pizzeria, 652 Alexandra Parade, Dennistoun. Open till 11pm Sun–Thu and midnight Fri & Sat.",
  },
  {
    path: "/about",
    priority: 0.6,
    changeFrequency: "monthly",
    title: "About · From Naples to Alexandra Parade | Margherita Pizzeria",
    description:
      "Family-run halal sourdough pizzeria on Alexandra Parade, Dennistoun. Syrian and Swedish roots, trained in Italy. Stone-baked, 24-hour cold rise.",
  },
  {
    path: "/faq",
    priority: 0.6,
    changeFrequency: "monthly",
    title: "Pizza Delivery & Booking FAQ | Margherita Pizzeria Glasgow",
    description:
      "Answers about delivery radius, collection, payments, allergies, table booking, and order tracking.",
  },
  {
    path: "/directions",
    priority: 0.6,
    changeFrequency: "monthly",
    title: "Directions to Margherita Pizzeria | Alexandra Parade Glasgow",
    description:
      "Find Margherita Pizzeria at 652 Alexandra Parade, Glasgow G31 3BU, with route guidance for collection and dine-in visits.",
  },
  {
    path: "/contact",
    priority: 0.6,
    changeFrequency: "monthly",
    title: "Contact Margherita Pizzeria | Glasgow G31",
    description:
      "Contact Margherita Pizzeria about orders, delivery area, collection, and table booking.",
  },
] as const;

/**
 * Path prefixes that must never be indexed or appear in the sitemap.
 * Compared with `startsWith` against the request path (without query string).
 */
export const noIndexRoutes: readonly string[] = [
  "/admin",
  "/api",
  "/lp",
  "/order/success",
  "/book/success",
  "/track",
] as const;

function trimTrailingSlash(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

/**
 * Build an absolute URL for the given site-relative path, using the configured
 * site URL. Always returns a normalised URL (no double slashes, no trailing
 * slash except for the root).
 */
export function getCanonicalUrl(path: string): string {
  const base = trimTrailingSlash(siteConfig.url);
  if (!path || path === "/") return `${base}/`;
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleaned}`;
}
