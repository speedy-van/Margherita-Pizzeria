import { restaurantLocation, siteConfig } from "@/lib/config/site";

export interface LandingCta {
  label: string;
  href: string;
}

export interface LandingTrustItem {
  label: string;
  value: string;
}

export interface LandingOfferCard {
  id: "delivery" | "collection" | "dinein";
  title: string;
  description: string;
  cta: LandingCta;
}

export interface LandingHowItWorksStep {
  step: number;
  title: string;
  body: string;
}

export interface LandingMenuPreviewItem {
  name: string;
  description: string;
}

export interface LandingContent {
  source: "order_now" | "collection";
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: LandingCta;
    secondaryCtas: LandingCta[];
  };
  trust: LandingTrustItem[];
  offers: LandingOfferCard[];
  menuPreview: {
    title: string;
    body: string;
    items: LandingMenuPreviewItem[];
    cta: LandingCta;
  };
  howItWorks: {
    title: string;
    steps: LandingHowItWorksStep[];
  };
  stickyCta: LandingCta;
}

// Customers landing from ads start by browsing the menu, then proceed to /order
// for checkout. We preserve `mode` + UTM params on /menu purely for analytics —
// /menu does not currently consume `mode`, and the user picks delivery vs
// collection again at checkout.
const ORDER_DELIVERY_HREF =
  "/menu?mode=delivery&utm_source=google_ads&utm_campaign=order_now";
const ORDER_COLLECTION_HREF =
  "/menu?mode=collection&utm_source=google_ads&utm_campaign=collection";

const trustItems: LandingTrustItem[] = [
  { label: "Google rating", value: `${siteConfig.rating}★ from ${siteConfig.reviewCount} reviews` },
  { label: "Delivery zone", value: `Within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}` },
  { label: "Collection", value: `From ${restaurantLocation.addressLine}, ${restaurantLocation.city}` },
  { label: "Price range", value: siteConfig.priceRange },
];

const [deliveryOffer, collectionOffer, dineInOffer]: readonly [
  LandingOfferCard,
  LandingOfferCard,
  LandingOfferCard,
] = [
  {
    id: "delivery",
    title: "Delivery",
    description: `Hot, halal sourdough pizza brought to your door within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}. Free in G31, £3.99 outside. Check live availability at checkout.`,
    cta: { label: "Order delivery", href: ORDER_DELIVERY_HREF },
  },
  {
    id: "collection",
    title: "Collection",
    description: `Skip the wait. Order ahead and collect from ${restaurantLocation.addressLine}.`,
    cta: { label: "Order for collection", href: ORDER_COLLECTION_HREF },
  },
  {
    id: "dinein",
    title: "Dine-in",
    description: `We only have ${siteConfig.tablesCount} tables, so booking is recommended.`,
    cta: { label: "Book a table", href: "/book" },
  },
];

const deliveryFirstOffers: LandingOfferCard[] = [deliveryOffer, collectionOffer, dineInOffer];

const collectionFirstOffers: LandingOfferCard[] = [
  collectionOffer,
  deliveryOffer,
  dineInOffer,
];

const orderNowSteps: LandingHowItWorksStep[] = [
  { step: 1, title: "Choose delivery or collection", body: "Pick how you want your pizza. Delivery is available within 5 miles of G31." },
  { step: 2, title: "Build your order", body: "Add sourdough pizzas, kebabs, smashburgers, sides and drinks from the live menu." },
  { step: 3, title: "Pay your way", body: "Pay securely by card online, or choose cash where available." },
  { step: 4, title: "Track or collect", body: `Track delivery on the map, or collect from ${restaurantLocation.addressLine}.` },
];

const collectionSteps: LandingHowItWorksStep[] = [
  { step: 1, title: "Pick collection", body: "No delivery address needed — we'll have it ready for pickup." },
  { step: 2, title: "Choose ASAP or a time slot", body: "Order for the next available slot, or schedule it for later." },
  { step: 3, title: "Pay your way", body: "Pay by card online, or choose cash where available." },
  { step: 4, title: "Collect from G31", body: `Walk in at ${restaurantLocation.addressLine}, ${restaurantLocation.postcode}.` },
];

const previewItems: LandingMenuPreviewItem[] = [
  { name: "Margherita", description: "San Marzano tomato, fior di latte mozzarella, basil." },
  { name: "Pepperoni", description: "Tomato, mozzarella, fennel-spiced pepperoni." },
  { name: "Garlic Bread", description: "Stone-baked sourdough flatbread with garlic butter and herbs." },
  { name: "Tiramisu", description: "Classic Italian dessert, made in-house." },
];

export const orderNowLandingContent: LandingContent = {
  source: "order_now",
  hero: {
    eyebrow: "Pizza delivery · Glasgow East End",
    title: "Sourdough pizza & halal kebabs, delivered to your door.",
    body: `Order online for delivery within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}, or collect from ${restaurantLocation.addressLine}. Card or cash supported. Rated ${siteConfig.rating}★ by ${siteConfig.reviewCount} Google reviewers.`,
    primaryCta: { label: "Start your order", href: ORDER_DELIVERY_HREF },
    secondaryCtas: [
      { label: "View menu", href: "/menu" },
      { label: "Book a table", href: "/book" },
    ],
  },
  trust: trustItems,
  offers: deliveryFirstOffers,
  menuPreview: {
    title: "Customer favourites",
    body: "A taste of what's on the live menu. Prices and availability are confirmed at checkout.",
    items: previewItems,
    cta: { label: "See live menu", href: "/menu" },
  },
  howItWorks: {
    title: "How it works",
    steps: orderNowSteps,
  },
  stickyCta: { label: "Start order", href: ORDER_DELIVERY_HREF },
};

export const collectionLandingContent: LandingContent = {
  source: "collection",
  hero: {
    eyebrow: "Pizza collection · Glasgow G31",
    title: "Order ahead. Collect from Alexandra Parade.",
    body: `Skip the queue: order online and collect from ${restaurantLocation.addressLine}, ${restaurantLocation.postcode}. Choose ASAP or a scheduled slot at checkout — no delivery address needed.`,
    primaryCta: { label: "Order for collection", href: ORDER_COLLECTION_HREF },
    secondaryCtas: [
      { label: "View menu", href: "/menu" },
      { label: "Get directions", href: "/directions" },
    ],
  },
  trust: trustItems,
  offers: collectionFirstOffers,
  menuPreview: {
    title: "Customer favourites",
    body: "A taste of what's on the live menu. Prices and availability are confirmed at checkout.",
    items: previewItems,
    cta: { label: "See live menu", href: "/menu" },
  },
  howItWorks: {
    title: "How collection works",
    steps: collectionSteps,
  },
  stickyCta: { label: "Order for collection", href: ORDER_COLLECTION_HREF },
};

export interface LandingFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const landingFaqs: LandingFaqItem[] = [
  {
    id: "delivery-radius",
    question: "Do you deliver to my area?",
    answer: `We deliver within ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}. Pop your postcode into the order page to check live availability.`,
  },
  {
    id: "minimum-order",
    question: "Is there a minimum order for delivery?",
    answer: "Yes — the minimum delivery subtotal is shown at checkout. There is no minimum for collection.",
  },
  {
    id: "cash-or-card",
    question: "Can I pay by cash?",
    answer: "We accept card payments online, and cash is supported where available — you can pick your method during checkout.",
  },
  {
    id: "collection-slots",
    question: "Can I choose a collection time?",
    answer: "Yes. Pick ASAP or one of the scheduled collection slots when ordering for collection.",
  },
  {
    id: "allergies",
    question: "What about allergies?",
    answer: "Every menu item lists its allergens. If you have a serious allergy, please contact us so we can confirm what's safe.",
  },
  {
    id: "failed-payment",
    question: "What happens if my payment fails?",
    answer: "No order is placed if payment doesn't complete — your cart stays as it is so you can try again or pick a different method.",
  },
  {
    id: "outside-zone",
    question: "What if I'm outside the delivery zone?",
    answer: `If you're outside our ${siteConfig.deliveryRadiusMiles}-mile delivery radius, you can still order for collection from ${restaurantLocation.addressLine}.`,
  },
  {
    id: "table-booking",
    question: "Would you rather dine in?",
    answer: `We have just ${siteConfig.tablesCount} tables, so booking is recommended. You can reserve a table in a couple of taps.`,
  },
];
