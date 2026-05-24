import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Margherita Pizzeria menu — sourdough pizzas, halal kebabs, smashburgers and more";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Menu",
    title: "Sourdough pizzas · Halal kebabs · Smashburgers",
    subtitle: "Delivery, collection or dine-in on Alexandra Parade",
  });
}
