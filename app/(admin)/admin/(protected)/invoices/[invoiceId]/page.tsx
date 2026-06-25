import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { InvoiceAdminClient } from "@/components/admin/InvoiceAdminClient";
import { validateUuid } from "@/lib/admin/validation";
import { getAdminInvoiceDocument } from "@/lib/invoices/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const idCheck = validateUuid(invoiceId);
  if (!idCheck.ok) notFound();

  try {
    const invoice = await getAdminInvoiceDocument(idCheck.data);
    if (!invoice) notFound();
    return <InvoiceAdminClient invoice={invoice} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/invoices/[invoiceId]] failed:", err);
    return <AdminErrorState title="Could not load invoice" />;
  }
}
