import { NextResponse } from "next/server";

import { getPublicMenu } from "@/lib/menu/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublicMenu();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/menu] fetch failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MENU_FETCH_FAILED",
          message: "We could not load the menu right now.",
        },
      },
      { status: 500 },
    );
  }
}
