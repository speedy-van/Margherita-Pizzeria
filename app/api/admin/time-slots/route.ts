import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deleteAdminTimeSlot,
  getAdminTimeSlots,
  updateAdminTimeSlot,
  upsertAdminTimeSlot,
} from "@/lib/admin/queries";
import {
  validateAdminTimeSlotInput,
  validateAdminUpdateTimeSlotInput,
  validateUuid,
} from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminTimeSlots();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/time-slots GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "SLOTS_FAILED", message: "Could not load slots." } },
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
  const validation = validateAdminTimeSlotInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await upsertAdminTimeSlot(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/time-slots POST] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "SLOT_UPSERT_FAILED", message: "Could not save slot." } },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Body must be a JSON object." } },
      { status: 400 },
    );
  }
  const obj = body as Record<string, unknown>;
  const idCheck = validateUuid(typeof obj.id === "string" ? obj.id : "");
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  const validation = validateAdminUpdateTimeSlotInput(obj);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await updateAdminTimeSlot(idCheck.data, validation.data);
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Slot not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/time-slots PUT] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "SLOT_UPDATE_FAILED", message: "Could not update slot." } },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const idParam = url.searchParams.get("id") ?? "";
  const idCheck = validateUuid(idParam);
  if (!idCheck.ok)
    return NextResponse.json({ ok: false, error: idCheck.error }, { status: 400 });
  try {
    const removed = await deleteAdminTimeSlot(idCheck.data);
    if (!removed)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Slot not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data: { id: idCheck.data } }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/time-slots DELETE] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "SLOT_DELETE_FAILED", message: "Could not delete slot." } },
      { status: 500 },
    );
  }
}
