import { NextResponse } from "next/server";

import { applyDiscountByCode } from "@/lib/discounts/queries";
import { validateApplyDiscountInput } from "@/lib/discounts/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint used by the checkout UI to validate a discount code and
 * compute the resulting savings BEFORE the order is submitted. The order
 * create endpoint re-applies the same logic server-side, so this can be
 * called freely without any auth.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON." } },
      { status: 400 },
    );
  }
  const validation = validateApplyDiscountInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );

  const result = await applyDiscountByCode({
    code: validation.data.code,
    subtotalPence: validation.data.subtotalPence,
    orderType: validation.data.orderType,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: { code: result.code, message: result.message } },
      { status: 400 },
    );
  }
  return NextResponse.json(
    {
      ok: true,
      data: {
        code: result.discount.code,
        title: result.discount.title,
        discountPence: result.discountPence,
      },
    },
    { status: 200 },
  );
}
