import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { updateAdminImage } from "@/lib/admin/queries";
import { validateUuid } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const idCheck = validateUuid(id);
  if (!idCheck.ok)
    return NextResponse.json(
      { ok: false, error: idCheck.error },
      { status: 400 },
    );

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_FORM",
          message: "Expected multipart form upload.",
        },
      },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FILE_REQUIRED",
          message: "Attach the photo under field name 'file'.",
        },
      },
      { status: 400 },
    );
  }

  const mime = file.type.toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNSUPPORTED_TYPE",
          message: "Please choose a JPG, PNG, WEBP, GIF or AVIF image.",
        },
      },
      { status: 415 },
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: `Image must be between 1 byte and ${MAX_BYTES / (1024 * 1024)} MB.`,
        },
      },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "images");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), bytes);
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images/[id]/upload] write failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "WRITE_FAILED",
          message: "Could not save the image on the server.",
        },
      },
      { status: 500 },
    );
  }

  const publicUrl = `/uploads/images/${filename}`;

  try {
    const updated = await updateAdminImage(idCheck.data, { url: publicUrl });
    if (!updated)
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Image slot not found." },
        },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/images/[id]/upload] db update failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "IMAGE_UPDATE_FAILED",
          message: "Saved the file but could not update the database.",
        },
      },
      { status: 500 },
    );
  }
}
