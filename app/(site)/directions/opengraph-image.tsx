import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Directions to Margherita Pizzeria, Alexandra Parade Glasgow";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Find us",
    title: "652 Alexandra Parade",
    subtitle: "Glasgow · G31 3BU",
  });
}
