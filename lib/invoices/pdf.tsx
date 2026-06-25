import { renderToBuffer } from "@react-pdf/renderer";

import { OrderInvoicePdf } from "@/lib/pdf/order-invoice";
import type { InvoiceDocumentModel } from "@/lib/invoices/model";

export async function renderInvoicePdfBuffer(
  invoice: InvoiceDocumentModel,
): Promise<Buffer> {
  return renderToBuffer(OrderInvoicePdf({ invoice }));
}
