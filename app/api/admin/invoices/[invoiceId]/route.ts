import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminInvoiceDocument } from "@/lib/invoices/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice id."),
});

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid invoice id.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const data = await getAdminInvoiceDocument(parsed.data.invoiceId);
    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Invoice not found." },
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/invoices/[invoiceId]] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVOICE_FETCH_FAILED",
          message: "Could not load invoice.",
        },
      },
      { status: 500 },
    );
  }
}
