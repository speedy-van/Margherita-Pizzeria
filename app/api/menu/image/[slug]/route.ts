import { NextResponse } from "next/server";

import { classifyDish } from "@/lib/menu/dish-classifier";
import { renderDishSvg } from "@/lib/menu/dish-svg";

export const runtime = "edge";
export const dynamic = "force-static"; // safe — output is pure name→svg

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/menu/image/[slug]
 *
 * Returns a deterministic, on-brand SVG card illustration for a menu item
 * given by its decoded name. Used as a fallback whenever an item has no
 * uploaded photo and no hand-shot legacy override.
 *
 * Why SVG (not raster)?
 *  - scales perfectly on retina screens with zero CDN cost
 *  - tiny (~6–12 KB), instantly cached at the edge
 *  - the same item always renders the same image (deterministic PRNG)
 */
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  let name = "";
  try {
    name = decodeURIComponent(slug || "").trim();
  } catch {
    name = slug || "";
  }
  if (!name) name = "Dish";
  if (name.length > 80) name = name.slice(0, 80);

  const meta = classifyDish(name);

  // If we have a real photo for this name, redirect to it for best fidelity.
  if (meta.photo) {
    return NextResponse.redirect(new URL(meta.photo, _req.url), 308);
  }

  const svg = renderDishSvg({ name, meta });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
