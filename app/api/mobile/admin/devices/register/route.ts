import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/client";
import { adminDevices } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(20).max(4096),
  platform: z.enum(["android", "ios", "web"]).default("android"),
  deviceLabel: z.string().trim().max(160).optional(),
});

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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: "Invalid payload." },
      },
      { status: 400 },
    );
  }
  const { token, platform, deviceLabel } = parsed.data;

  // Upsert by token — if another user previously owned this token, claim it.
  const [existing] = await db
    .select({ id: adminDevices.id })
    .from(adminDevices)
    .where(eq(adminDevices.fcmToken, token))
    .limit(1);
  const now = new Date();
  if (existing) {
    await db
      .update(adminDevices)
      .set({
        userId: auth.userId,
        platform,
        deviceLabel: deviceLabel ?? null,
        lastSeenAt: now,
      })
      .where(eq(adminDevices.id, existing.id));
    return NextResponse.json({ ok: true, data: { id: existing.id } });
  }
  const [row] = await db
    .insert(adminDevices)
    .values({
      userId: auth.userId,
      fcmToken: token,
      platform,
      deviceLabel: deviceLabel ?? null,
      lastSeenAt: now,
    })
    .returning({ id: adminDevices.id });
  return NextResponse.json({ ok: true, data: { id: row?.id } }, { status: 201 });
}

const deleteSchema = z.object({
  token: z.string().min(20).max(4096),
});

export async function DELETE(req: Request) {
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
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: "Token is required." },
      },
      { status: 400 },
    );
  }
  await db
    .delete(adminDevices)
    .where(
      and(
        eq(adminDevices.fcmToken, parsed.data.token),
        eq(adminDevices.userId, auth.userId),
      ),
    );
  return NextResponse.json({ ok: true, data: { deleted: true } });
}
