import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminImage, getAdminImages } from "@/lib/admin/queries";
import { validateAdminCreateImageInput } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminImages();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "IMAGES_FAILED", message: "Could not load images." } },
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

  const validation = validateAdminCreateImageInput(body);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );

  try {
    const data = await createAdminImage(validation.data);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images POST] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "IMAGE_CREATE_FAILED", message: "Could not create image." },
      },
      { status: 500 },
    );
  }
}
