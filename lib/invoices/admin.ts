import { getAdminOrderDetail } from "@/lib/admin/queries";
import {
  buildInvoiceDocument,
  type InvoiceDocumentModel,
} from "@/lib/invoices/model";

export async function getAdminInvoiceDocument(
  invoiceId: string,
): Promise<InvoiceDocumentModel | null> {
  const order = await getAdminOrderDetail(invoiceId);
  return order ? buildInvoiceDocument(order) : null;
}
