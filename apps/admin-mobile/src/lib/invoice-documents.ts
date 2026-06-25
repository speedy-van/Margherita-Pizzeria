import { apiCall, downloadApiFile, type ApiFileResult } from "@/api/client";
import type { InvoiceDocumentModel, SendInvoiceEmailResponse } from "@/api/types";

export type InvoicePdfDirectory = "cache" | "document";

export function invoiceActionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isInvoiceUserCancel(error: unknown): boolean {
  return /cancel|dismiss|closed without/i.test(invoiceActionErrorMessage(error));
}

export async function getInvoiceDocument(
  invoiceId: string,
): Promise<InvoiceDocumentModel> {
  const result = await apiCall<InvoiceDocumentModel>({
    path: `/api/admin/invoices/${invoiceId}`,
  });
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

export async function downloadInvoicePdf({
  invoiceId,
  fileName,
  directory = "cache",
}: {
  invoiceId: string;
  fileName: string;
  directory?: InvoicePdfDirectory;
}): Promise<Extract<ApiFileResult, { ok: true }>> {
  const result = await downloadApiFile({
    path: `/api/admin/invoices/${invoiceId}/pdf`,
    fileName,
    directory,
  });
  if (!result.ok) throw new Error(result.message);
  return result;
}

export async function sendInvoiceEmail({
  invoiceId,
  email,
  defaultEmail,
}: {
  invoiceId: string;
  email: string;
  defaultEmail?: string | null;
}): Promise<SendInvoiceEmailResponse> {
  const toEmail = email.trim();
  const result = await apiCall<SendInvoiceEmailResponse>({
    method: "POST",
    path: `/api/admin/invoices/${invoiceId}/email`,
    body: defaultEmail && toEmail === defaultEmail ? {} : { email: toEmail },
  });
  if (!result.ok) throw new Error(result.message);
  return result.data;
}
