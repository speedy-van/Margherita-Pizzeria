import { env } from "@/lib/env";

export const brandColors = {
  crimson: "#C0392B",
  amber: "#E67E22",
  nearBlack: "#0D0D0D",
  charcoal: "#1A1A1A",
  offWhite: "#F5F5F0",
  warmGrey: "#A0998C",
  forest: "#27AE60",
} as const;

export const restaurantLocation = {
  addressLine: "652 Alexandra Parade",
  neighbourhood: "Dennistoun",
  city: "Glasgow",
  postcode: "G31 3BU",
  country: "GB",
  fullAddress: "652 Alexandra Parade, Dennistoun, Glasgow, G31 3BU",
  latitude: 55.8717,
  longitude: -4.2169,
} as const;

export const contactDetails = {
  primaryPhone: "+44 7746 870341",
  primaryPhoneTel: "+447746870341",
  secondaryPhone: "+44 7746 870341",
  secondaryPhoneTel: "+447746870341",
  whatsappLabel: "Call or WhatsApp",
  whatsappUrl: "https://wa.me/447746870341",
  email: "hello@margheritapizzeria.co.uk",
} as const;

export const socialLinks = {
  facebook: "https://www.facebook.com/p/Margherita-pizzeria-61584527125021/",
  instagram: "https://www.instagram.com/margherita.pizzaria1/",
  tiktok: "https://www.tiktok.com/@margherita.pizzaria1",
} as const;

export const deliveryRules = {
  radiusMiles: 4,
  freePostcodes: ["G31"] as const,
  outsideFeePence: 399,
  defaultMinOrderPence: 1000,
  // The live delivery fee is stored in the `settings` table (key: delivery_fee_pence)
  // and is the source of truth. This is only the seed/fallback value.
  defaultDeliveryFeePence: 0,
} as const;

export const businessHoursFallback = [
  { day: "Monday", open: "11:00", close: "23:00" },
  { day: "Tuesday", open: "11:00", close: "23:00" },
  { day: "Wednesday", open: "11:00", close: "23:00" },
  { day: "Thursday", open: "11:00", close: "23:00" },
  { day: "Friday", open: "11:00", close: "00:00" },
  { day: "Saturday", open: "11:00", close: "00:00" },
  { day: "Sunday", open: "11:00", close: "23:00" },
] as const;

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export const siteConfig = {
  name: "Margherita Pizzeria",
  shortName: "Margherita",
  domain: "margheritapizza.uk",
  legacyDomain: "margheritapizzeria.co.uk",
  url: normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL || "https://www.margheritapizza.uk"),
  description:
    "Authentic Italian sourdough pizza on Alexandra Parade, Dennistoun. 24-hour cold-proved dough, stone-baked and halal certified. Pizza delivery across Glasgow's East End for a £3.99 flat fee (up to 4 miles).",
  tagline: "Sourdough. Hand-stretched. Stone oven.",
  address: restaurantLocation.fullAddress,
  city: restaurantLocation.city,
  postcode: restaurantLocation.postcode,
  country: restaurantLocation.country,
  phone: contactDetails.primaryPhone,
  phoneTel: contactDetails.primaryPhoneTel,
  secondaryPhone: contactDetails.secondaryPhone,
  secondaryPhoneTel: contactDetails.secondaryPhoneTel,
  halalCertified: true,
  rating: 4.2,
  reviewCount: 62,
  priceRange: "££",
  currency: "GBP" as const,
  locale: "en-GB" as const,
  deliveryRadiusMiles: deliveryRules.radiusMiles,
  defaultMinDeliveryOrderPence: deliveryRules.defaultMinOrderPence,
  defaultDeliveryFeePence: deliveryRules.defaultDeliveryFeePence,
  tablesCount: 6,
  servesCuisine: "Pizza, Kebab, Burgers, Grill",
  areaServedDescription:
    "Dennistoun (G31) and Glasgow East End within a 4-mile radius — Gallowgate, Bridgeton, Shettleston, Carntyne, Riddrie, Springburn.",
} as const;

export type SiteConfig = typeof siteConfig;
