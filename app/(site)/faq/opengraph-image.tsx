import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og";

export const runtime = "nodejs";
export const alt = "Margherita Pizzeria — frequently asked questions";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "FAQ",
    title: "Delivery, collection & booking answers",
    subtitle: "Everything you need to know",
  });
}
