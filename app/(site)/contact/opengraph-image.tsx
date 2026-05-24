import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Contact Margherita Pizzeria, Glasgow";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Contact",
    title: "Get in touch",
    subtitle: "Orders, bookings & everything else",
  });
}
