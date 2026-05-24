import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createDiscount,
  listAdminDiscounts,
} from "@/lib/discounts/queries";
import { validateCreateDiscountInput } from "@/lib/discounts/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await listAdminDiscounts();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/discounts GET] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "DISCOUNTS_FAILED", message: "Could not load discounts." },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const validation = validateCreateDiscountInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }
  try {
    const data = await createDiscount(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: unknown) {
    // Unique-constraint violation on code is the most common conflict.
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
    console.error("[api/admin/discounts POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DISCOUNT_CREATE_FAILED",
          message: "Could not create discount.",
        },
      },
      { status: 500 },
    );
  }
}
