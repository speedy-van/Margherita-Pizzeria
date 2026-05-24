import { siteConfig } from "@/lib/config/site";

export interface HomeTrustItem {
  label: string;
  detail: string;
}

export interface HomeServiceCard {
  id: "delivery" | "collection" | "dine-in";
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HomePizzaCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  toppings: string[];
  imageUrl: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    tertiaryCta: { label: string; href: string };
  };
  trustItems: HomeTrustItem[];
  pizzas: HomePizzaCard[];
  services: HomeServiceCard[];
  story: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
  };
  finalCta: {
    eyebrow: string;
    heading: string;
    body: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
}

export const homeContent: HomeContent = {
  hero: {
    eyebrow: "Glasgow · Alexandra Parade · Halal certified",
    headline: "Authentic Italian pizza, Glasgow made.",
    body: `Sourdough base with a 24-hour cold rise. Hand-stretched, stone-baked, halal certified. Free delivery in G31 and £3.99 outside (up to ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}), collect from ${siteConfig.address}, or book one of our ${siteConfig.tablesCount} tables.`,
    primaryCta: { label: "Order now", href: "/menu" },
    secondaryCta: { label: "View the menu", href: "/menu" },
    tertiaryCta: { label: `Call ${siteConfig.phone}`, href: `tel:${siteConfig.phoneTel}` },
  },
  trustItems: [
    { label: "24hr Sourdough", detail: "Handmade daily, never frozen." },
    { label: "Trained in Italy", detail: "Three years with master pizzaiolos." },
    { label: "Halal Certified", detail: "All meats halal." },
    { label: "Open till Midnight Fri & Sat", detail: "11am every day, late at weekends." },
    { label: `${siteConfig.rating}★ from ${siteConfig.reviewCount}+ reviews`, detail: "Google, Uber Eats and Deliveroo." },
    { label: "Free delivery in G31", detail: `£3.99 outside (up to ${siteConfig.deliveryRadiusMiles} miles).` },
  ],
  pizzas: [
    {
      id: "margherita",
      name: "Margherita",
      tagline: "La Regina — the one that started it all.",
      description:
        "Fresh mozzarella, parmesan and a whisper of basil on our 24-hour sourdough base. Simple. Perfect.",
      toppings: ["Mozzarella", "Parmesan", "Fresh basil"],
      imageUrl: "/legacy/margherita-real.jpg",
    },
    {
      id: "pepperoni",
      name: "Pepperoni",
      tagline: "Il Classico — the crowd-pleaser.",
      description:
        "Loaded with spiced pepperoni, cherry tomatoes and a generous blanket of mozzarella on stone-baked sourdough.",
      toppings: ["Pepperoni", "Cherry tomato", "Mozzarella"],
      imageUrl: "/legacy/pepperoni-real.jpg",
    },
    {
      id: "donner",
      name: "Donner Kebab",
      tagline: "Il Donner — Glasgow's favourite fusion.",
      description:
        "Shaved donner meat, mixed salad, garlic sauce and mozzarella on a sourdough base.",
      toppings: ["Donner", "Mixed salad", "Garlic sauce", "Mozzarella"],
      imageUrl: "/legacy/donner-real.jpg",
    },
  ],
  services: [
    {
      id: "delivery",
      title: "Delivery",
      body: `Hot, properly boxed and on your doorstep. Free in G31 (Dennistoun), £3.99 anywhere else inside ${siteConfig.deliveryRadiusMiles} miles. Also on Deliveroo.`,
      ctaLabel: "Start a delivery order",
      ctaHref: "/menu",
    },
    {
      id: "collection",
      title: "Collection",
      body: `Skip the wait. Order ahead and collect from ${siteConfig.address} — or call us on ${siteConfig.phone}.`,
      ctaLabel: "Order for collection",
      ctaHref: "/menu",
    },
    {
      id: "dine-in",
      title: "Dine in",
      body: `Just ${siteConfig.tablesCount} tables on Alexandra Parade. Open till 11pm Sun–Thu and midnight Fri & Sat.`,
      ctaLabel: "Book a table",
      ctaHref: "/book",
    },
  ],
  story: {
    eyebrow: "Our story",
    heading: "From Naples to Alexandra Parade.",
    paragraphs: [
      "Born from Syrian and Swedish roots, our chefs bring 20 years of experience and a fusion of cultures to Alexandra Parade. Trained in Italy, sharpened in Dubai, perfected in Glasgow.",
      "Every pizza starts with our sourdough — a 24-hour rise with natural yeast that gives it that real craft flavour. It would last 4 or 5 days in the fridge, but it'll never get that far.",
      "Real dough, real toppings, real prices. Any pizza can be stuffed crust — 12\" +£2, 16\" +£5. Gluten free available. Delivery or collection, straight from our stone oven to your door.",
    ],
  },
  finalCta: {
    eyebrow: "Hungry yet?",
    heading: "Order now or call 0141 378 0909.",
    body: "Order online for delivery and collection, or call us direct. Open 11am — late, seven days a week.",
    primary: { label: "Order online", href: "/menu" },
    secondary: { label: `Call ${siteConfig.phone}`, href: `tel:${siteConfig.phoneTel}` },
  },
};
