import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stateless logout. JWTs are not server-tracked, so the client is
 * responsible for discarding the token. We still gate this behind a
 * basic shape check so unauthenticated clients can call it safely.
 */
export async function POST(): Promise<Response> {
  return NextResponse.json({ ok: true, data: { loggedOut: true } });
}
