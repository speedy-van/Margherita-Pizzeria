import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { constructStripeEvent, handleStripeEvent } from "@/lib/stripe/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hdrs = await headers();
  const signature = hdrs.get("stripe-signature");

  const built = await constructStripeEvent(rawBody, signature);
  if (!built.ok) {
    return NextResponse.json(
      { ok: false, error: { code: built.code, message: built.message } },
      { status: built.status },
    );
  }

  const result = await handleStripeEvent(built.event);
  if (!result.ok) {
    // Return 500 so Stripe retries on transient failure, but never leak details.
    return NextResponse.json(
      { ok: false, error: { code: result.code, message: result.message } },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, handled: result.handled }, { status: 200 });
}
