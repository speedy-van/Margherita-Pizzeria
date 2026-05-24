import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    ok: true,
    data: {
      user: {
        id: auth.userId,
        role: auth.role,
        email: auth.email ?? null,
      },
    },
  });
}
