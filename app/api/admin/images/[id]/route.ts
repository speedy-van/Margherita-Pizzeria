import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { deleteAdminImage, updateAdminImage } from "@/lib/admin/queries";
import {
  validateAdminUpdateImageInput,
  validateUuid,
} from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
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
  const validation = validateAdminUpdateImageInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );

  try {
    const data = await updateAdminImage(idCheck.data, validation.data);
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Image not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images/[id] PUT] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "IMAGE_UPDATE_FAILED", message: "Could not update image." } },
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
    return NextResponse.json(
      { ok: false, error: idCheck.error },
      { status: 400 },
    );

  try {
    const removed = await deleteAdminImage(idCheck.data);
    if (!removed)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Image not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data: { id: idCheck.data } });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images/[id] DELETE] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "IMAGE_DELETE_FAILED", message: "Could not delete image." },
      },
      { status: 500 },
    );
  }
}
