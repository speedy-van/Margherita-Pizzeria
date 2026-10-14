import { siteConfig } from "@/lib/config/site";

export interface AboutValue {
  id: string;
  title: string;
  body: string;
}

export interface AboutContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  story: {
    heading: string;
    paragraphs: string[];
  };
  values: AboutValue[];
  visitCta: {
    heading: string;
    body: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    tertiary: { label: string; href: string };
  };
}

export const aboutContent: AboutContent = {
  hero: {
    eyebrow: "About",
    title: "From Naples to Alexandra Parade.",
    description: `${siteConfig.name} is a stone-baked sourdough pizzeria on Alexandra Parade, Dennistoun. Halal certified, family-run, open 11am till late seven days a week.`,
  },
  story: {
    heading: "Syrian roots. Swedish craft. Italian fire.",
    paragraphs: [
      "Born from Syrian and Swedish roots, our chefs bring 20 years of experience and a fusion of cultures to Alexandra Parade. Trained in Italy, sharpened in Dubai, perfected in Glasgow.",
      "Our head chef spent three years in Italy mastering stone-baked pizza. Sourdough rises 24 hours with natural yeast — patient, alive, and easier to digest. It would last four or five days in the fridge, but it'll never get that far.",
      "This isn't fast food with an Italian name. Real dough, real toppings, real prices. Stuffed crust supplement: 12\" +£3, 16\" +£4 where available. Delivery or collection, straight from our stone oven to your door.",
      `Whether you're picking up a couple of boxes after work, having pizza delivered to the flat, or settling in at one of our ${siteConfig.tablesCount} tables, our promise is the same: real craft, real flavour, halal certified, made for the East End.`,
    ],
  },
  values: [
    {
      id: "sourdough",
      title: "24-hour sourdough",
      body: "Natural yeast, long cold ferment, made fresh every day. The base of everything we do.",
    },
    {
      id: "stone-baked",
      title: "Stone-baked",
      body: "Hand-stretched dough fired in our stone oven for that proper craft crust.",
    },
    {
      id: "halal",
      title: "Halal certified",
      body: "All our meats are halal certified — so the whole community can sit down and share a pizza.",
    },
    {
      id: "fusion",
      title: "A fusion of cultures",
      body: "Syrian and Swedish roots, 20 years of experience, trained in Italy. From Margherita to Manqusha, it all comes off the same fire.",
    },
    {
      id: "local",
      title: "Made for the East End",
      body: `Delivery from £1.95 across the East End — Dennistoun, Gallowgate, Bridgeton, Shettleston, Carntyne, Riddrie and Springburn (up to ${siteConfig.deliveryRadiusMiles} miles of ${siteConfig.postcode}, fee based on distance).`,
    },
    {
      id: "honest",
      title: "Honest pricing",
      body: "Real dough, real toppings, real prices. Student 10% off orders over £10. Kids deal £5.99 every day.",
    },
  ],
  visitCta: {
    heading: "Come and try us.",
    body: `Pop in at ${siteConfig.address}, order delivery to your door, or call ${siteConfig.phone}. Open 11am till late, seven days a week.`,
    primary: { label: "View the menu", href: "/menu" },
    secondary: { label: "Order online", href: "/menu" },
    tertiary: { label: "Book a table", href: "/book" },
  },
};
