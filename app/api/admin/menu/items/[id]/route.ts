import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteAdminMenuItem,
  updateAdminMenuItem,
} from "@/lib/admin/queries";
import {
  validateMenuItemId,
  validateUpdateMenuItemInput,
} from "@/lib/validations/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateMenuItemId(id);
  if (!idCheck.ok)
    return NextResponse.json(
      { ok: false, error: idCheck.error },
      { status: idCheck.status },
    );

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const validation = validateUpdateMenuItemInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );

  try {
    const data = await updateAdminMenuItem(idCheck.data, validation.data);
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Menu item not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/menu/items/[id] PUT] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "MENU_ITEM_UPDATE_FAILED", message: "Could not update item." },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateMenuItemId(id);
  if (!idCheck.ok)
    return NextResponse.json(
      { ok: false, error: idCheck.error },
      { status: idCheck.status },
    );
  try {
    const removed = await deleteAdminMenuItem(idCheck.data);
    if (!removed)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Menu item not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data: { id: idCheck.data } }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/menu/items/[id] DELETE] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "MENU_ITEM_DELETE_FAILED", message: "Could not delete item." },
      },
      { status: 500 },
    );
  }
}
