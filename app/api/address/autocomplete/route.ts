import { NextResponse } from "next/server";

import { autocompleteAddressSuggestions } from "@/lib/mapbox/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/address/autocomplete?q=...
 *
 * Returns up to ~6 Mapbox address suggestions biased to Glasgow / GB.
 * The Mapbox access token is read server-side and never returned to the
 * client. On missing token (dev), returns an empty list with a safe warning
 * code rather than throwing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (q.length < 3) {
    return NextResponse.json(
      { ok: true, data: { suggestions: [] } },
      { status: 200 },
    );
  }
  if (q.length > 200) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "QUERY_TOO_LONG", message: "Search text is too long." },
      },
      { status: 400 },
    );
  }

  const result = await autocompleteAddressSuggestions(q, { limit: 6 });
  if (!result.ok) {
    if (result.code === "MAPBOX_NOT_CONFIGURED") {
      // Don't fail the UI in dev — return empty list + warning code.
      return NextResponse.json(
        {
          ok: true,
          data: { suggestions: [] },
          warning: { code: result.code, message: result.message },
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { code: result.code, message: result.message } },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { ok: true, data: { suggestions: result.suggestions } },
    {
      status: 200,
      headers: {
        // Short cache to absorb keystroke debounce duplicates at the edge.
        "Cache-Control": "private, max-age=10",
      },
    },
  );
}
