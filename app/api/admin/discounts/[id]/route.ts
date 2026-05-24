import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteDiscount,
  getDiscountById,
  updateDiscount,
} from "@/lib/discounts/queries";
import { validateUpdateDiscountInput } from "@/lib/discounts/validation";
import { validateUuid } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  const row = await getDiscountById(idCheck.data);
  if (!row)
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Discount not found." } },
      { status: 404 },
    );
  return NextResponse.json({ ok: true, data: row }, { status: 200 });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const validation = validateUpdateDiscountInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const row = await updateDiscount(idCheck.data, validation.data);
    if (!row)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Discount not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data: row }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("unique") || msg.includes("23505")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DISCOUNT_CODE_TAKEN",
            message: "That discount code is already in use.",
          },
        },
        { status: 409 },
      );
    }
    // eslint-disable-next-line no-console
    console.error("[api/admin/discounts PUT] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DISCOUNT_UPDATE_FAILED", message: "Could not update discount." },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  const deleted = await deleteDiscount(idCheck.data);
  if (!deleted)
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Discount not found." } },
      { status: 404 },
    );
  return NextResponse.json({ ok: true, data: { id: idCheck.data } }, { status: 200 });
}
