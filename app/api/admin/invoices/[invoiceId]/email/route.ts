import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminInvoiceDocument } from "@/lib/invoices/admin";
import { sendInvoiceEmail } from "@/lib/resend/send-invoice-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice id."),
});

const bodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .optional(),
  })
  .optional();

const emailSchema = z.string().trim().email();

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) return undefined;
  return JSON.parse(text);
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
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

  let rawBody: unknown;
  try {
    rawBody = await readJson(req);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const parsedBody = bodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Enter a valid email address.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const invoice = await getAdminInvoiceDocument(parsedParams.data.invoiceId);
    if (!invoice) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Invoice not found." },
        },
        { status: 404 },
      );
    }

    const toEmail = parsedBody.data?.email || invoice.customer.email;
    const emailCheck = emailSchema.safeParse(toEmail);
    if (!emailCheck.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CUSTOMER_EMAIL_REQUIRED",
            message: "This customer does not have a valid email address.",
          },
        },
        { status: 400 },
      );
    }

    const result = await sendInvoiceEmail({
      invoice,
      toEmail: emailCheck.data,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVOICE_EMAIL_FAILED",
            message: "Could not send invoice email.",
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          invoiceNumber: invoice.invoiceNumber,
          toEmail: emailCheck.data,
          id: result.id ?? null,
          skipped: result.skipped ?? false,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/invoices/[invoiceId]/email] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVOICE_EMAIL_FAILED",
          message: "Could not send invoice email.",
        },
      },
      { status: 500 },
    );
  }
}
