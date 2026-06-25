import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminInvoiceDocument } from "@/lib/invoices/admin";
import { renderInvoicePdfBuffer } from "@/lib/invoices/pdf";

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
    const invoice = await getAdminInvoiceDocument(parsed.data.invoiceId);
    if (!invoice) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Invoice not found." },
        },
        { status: 404 },
      );
    }

    const pdfBuffer = await renderInvoicePdfBuffer(invoice);
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.fileName}"`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/invoices/[invoiceId]/pdf] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVOICE_PDF_FAILED",
          message: "Could not generate invoice PDF.",
        },
      },
      { status: 500 },
    );
  }
}
