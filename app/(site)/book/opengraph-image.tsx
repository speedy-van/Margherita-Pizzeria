import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Book a table at Margherita Pizzeria, Glasgow";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Book a table",
    title: "Six tables. One wood oven.",
    subtitle: "Dine in on Alexandra Parade, Glasgow",
    showRating: true,
  });
}
