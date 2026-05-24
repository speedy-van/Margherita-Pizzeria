import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getPublicTrackingSummary,
  updateDriverLocation,
} from "@/lib/tracking/queries";
import {
  validateDriverLocationInput,
  validateOrderId,
} from "@/lib/tracking/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const idResult = validateOrderId(id);
  if (!idResult.ok) {
    return NextResponse.json(
      { ok: false, error: idResult.error },
      { status: 400 },
    );
  }

  const summary = await getPublicTrackingSummary(idResult.value);
  if (!summary) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Order not found.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { ok: true, data: summary },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const idResult = validateOrderId(id);
  if (!idResult.ok) {
    return NextResponse.json(
      { ok: false, error: idResult.error },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_BODY",
          message: "Expected JSON body with lat and lng.",
        },
      },
      { status: 400 },
    );
  }

  const bodyResult = validateDriverLocationInput(body);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { ok: false, error: bodyResult.error },
      { status: 400 },
    );
  }

  const result = await updateDriverLocation(idResult.value, bodyResult.value);
  if (!result.ok) {
    const status = result.code === "ORDER_NOT_FOUND" ? 404 : 409;
    return NextResponse.json(
      {
        ok: false,
        error: { code: result.code, message: result.message },
      },
      { status },
    );
  }

  return NextResponse.json(
    { ok: true, data: result.summary },
    { status: 200 },
  );
}
