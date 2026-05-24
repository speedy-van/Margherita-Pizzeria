import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getAdminTables,
  updateAdminTable,
} from "@/lib/admin/queries";
import {
  validateAdminUpdateTableInput,
  validateUuid,
} from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const data = await getAdminTables();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/tables GET] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "TABLES_FAILED", message: "Could not load tables." } },
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
  const validation = validateAdminUpdateTableInput(obj);
  if (!validation.ok)
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  try {
    const data = await updateAdminTable(idCheck.data, validation.data);
    if (!data)
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Table not found." } },
        { status: 404 },
      );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/tables PUT] failed:", err);
    return NextResponse.json(
      { ok: false, error: { code: "TABLE_UPDATE_FAILED", message: "Could not update table." } },
      { status: 500 },
    );
  }
}
