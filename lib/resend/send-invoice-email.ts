import { InvoiceEmail } from "@/emails/invoice-email";
import {
  buildInvoiceEmailSubject,
  type InvoiceDocumentModel,
} from "@/lib/invoices/model";
import { renderInvoicePdfBuffer } from "@/lib/invoices/pdf";
import { getMailerOrSkip } from "@/lib/resend/server";
import type { EmailSendResult } from "@/lib/resend/types";

export interface SendInvoiceEmailInput {
  invoice: InvoiceDocumentModel;
  toEmail: string;
}

export async function sendInvoiceEmail({
  invoice,
  toEmail,
}: SendInvoiceEmailInput): Promise<EmailSendResult> {
  const mailer = getMailerOrSkip();
  if (!mailer.ok) {
    // eslint-disable-next-line no-console
    console.error(`[email] sendInvoiceEmail: ${mailer.error}`);
    return { ok: false, error: mailer.error };
  }
  if (mailer.skipped) {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] invoice ${invoice.invoiceNumber} skipped: ${mailer.reason}`,
    );
    return { ok: true, skipped: true, reason: mailer.reason };
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderInvoicePdfBuffer(invoice);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown PDF error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendInvoiceEmail PDF failed: ${message}`);
    return { ok: false, error: "Could not generate invoice PDF." };
  }

  try {
    const result = await mailer.resend.emails.send({
      from: mailer.from,
      to: toEmail,
      subject: buildInvoiceEmailSubject(invoice),
      react: InvoiceEmail({ invoice }),
      attachments: [
        {
          filename: invoice.fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    if (result.error) {
      // eslint-disable-next-line no-console
      console.error(`[email] sendInvoiceEmail: ${result.error.message}`);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    // eslint-disable-next-line no-console
    console.error(`[email] sendInvoiceEmail: ${message}`);
    return { ok: false, error: message };
  }
}
