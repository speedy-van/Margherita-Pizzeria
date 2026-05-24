import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Margherita Pizzeria — sourdough pizza, halal, Dennistoun";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    title: "Sourdough pizza · Halal · Dennistoun",
    subtitle: "Delivery within 5 miles of G31 · Collection · Dine-in",
    showRating: true,
  });
}
