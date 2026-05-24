import { NextResponse } from "next/server";

import { getPublicOrderSummary } from "@/lib/orders/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ID", message: "Invalid order id." } },
      { status: 400 },
    );
  }
  try {
    const summary = await getPublicOrderSummary(id);
    if (!summary) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Order not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, data: summary }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/orders/[id]] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "ORDER_FETCH_FAILED",
          message: "We couldn't load that order right now.",
        },
      },
      { status: 500 },
    );
  }
}
