import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteMenuItem, updateMenuItem } from "@/lib/menu/queries";
import {
  validateMenuItemId,
  validateUpdateMenuItemInput,
} from "@/lib/validations/menu";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function notFoundResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "MENU_ITEM_NOT_FOUND",
        message: "That menu item does not exist.",
      },
    },
    { status: 404 },
  );
}

export async function PUT(request: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const idValidation = validateMenuItemId(id);
  if (!idValidation.ok) {
    return NextResponse.json(
      { ok: false, error: idValidation.error },
      { status: idValidation.status },
    );
  }

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

  const validation = validateUpdateMenuItemInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  try {
    const item = await updateMenuItem(idValidation.data, validation.data);
    if (!item) return notFoundResponse();
    return NextResponse.json({ ok: true, data: item }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/menu/items PUT] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MENU_ITEM_UPDATE_FAILED",
          message: "We could not update the menu item.",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const idValidation = validateMenuItemId(id);
  if (!idValidation.ok) {
    return NextResponse.json(
      { ok: false, error: idValidation.error },
      { status: idValidation.status },
    );
  }

  try {
    const removed = await deleteMenuItem(idValidation.data);
    if (!removed) return notFoundResponse();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/menu/items DELETE] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MENU_ITEM_DELETE_FAILED",
          message: "We could not delete the menu item.",
        },
      },
      { status: 500 },
    );
  }
}
