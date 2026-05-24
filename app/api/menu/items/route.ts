import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createMenuItem } from "@/lib/menu/queries";
import { validateCreateMenuItemInput } from "@/lib/validations/menu";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const validation = validateCreateMenuItemInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  try {
    const item = await createMenuItem(validation.data);
    return NextResponse.json({ ok: true, data: item }, { status: 201 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/menu/items POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MENU_ITEM_CREATE_FAILED",
          message: "We could not create the menu item.",
        },
      },
      { status: 500 },
    );
  }
}
