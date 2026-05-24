import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "About Margherita Pizzeria, Alexandra Parade Glasgow";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "About",
    title: "A local Glasgow pizzeria",
    subtitle: "Sourdough pizza · Halal · Dennistoun",
  });
}
