import { NextResponse, type NextRequest } from "next/server";

/**
 * Dev-only CORS preflight handler so the Expo debug harness
 * (apps/admin-mobile, served by Metro on http://localhost:8081) can call
 * /api/* from a browser. The headers themselves are emitted by
 * next.config.ts `headers()` on the real response.
 *
 * In production this middleware is a no-op (we never want to short-circuit
 * preflights against the public API), so the existing native Kotlin app
 * and public site behaviour is unchanged.
 */
export function proxy(req: NextRequest): NextResponse {
  if (
    process.env.NODE_ENV !== "production" &&
    req.method === "OPTIONS" &&
    req.nextUrl.pathname.startsWith("/api/")
  ) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-dev-admin",
        "Access-Control-Max-Age": "600",
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
