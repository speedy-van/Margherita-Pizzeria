import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Stub endpoint — returns 204 so browser extensions or analytics tools
// that call /api/visitors/heartbeat do not spam 404 errors in server logs.
// No data is collected or stored.
export function GET(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function POST(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
