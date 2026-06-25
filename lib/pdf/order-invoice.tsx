import {
  Document,
  Image,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";

import type { Order } from "@/lib/db/schema";
import {
  buildInvoiceDocument,
  type InvoiceDocumentModel,
  type InvoiceStatusModel,
} from "@/lib/invoices/model";
import { buildInvoiceTemplate } from "@/lib/invoices/template";

const logoPath = path.join(process.cwd(), "public", "logo.png");
const localLogoSrc = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : null;

const C = {
  brand: "#C0392B",
  fg: "#0D0D0D",
  muted: "#6B6B6B",
  border: "#E5E5E5",
  bg: "#FFFFFF",
  panel: "#F9F9F7",
  greenBg: "#DCFCE7",
  greenFg: "#166534",
  amberBg: "#FEF3C7",
  amberFg: "#92400E",
  redBg: "#FEE2E2",
  redFg: "#991B1B",
  blueBg: "#DBEAFE",
  blueFg: "#1E40AF",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.fg,
    backgroundColor: C.bg,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
  },
  /* ── Header ── */
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 38, height: 38, marginRight: 10, objectFit: "contain" },
  brandName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.brand, marginBottom: 3 },
  brandSub: { fontSize: 8.5, color: C.muted },
  invoiceLabel: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right", color: C.fg },
  invoiceRef: { fontSize: 9, color: C.muted, textAlign: "right", marginTop: 3 },
  statusWrap: { alignItems: "flex-end", marginTop: 8 },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  /* ── Divider ── */
  rule: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20 },
  /* ── Meta row ── */
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  metaBlock: { flex: 1 },
  metaBlockRight: { flex: 1, alignItems: "flex-end" },
  metaHead: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  metaValue: { fontSize: 9.5, marginBottom: 5 },
  metaMuted: { fontSize: 9, color: C.muted, marginBottom: 2 },
  /* ── Table ── */
  tableHead: { flexDirection: "row", backgroundColor: C.panel, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 3 },
  tableHeadText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowLast: { borderBottomWidth: 0 },
  colItem: { flex: 1 },
  colQty: { width: 36, textAlign: "center" },
  colUnit: { width: 64, textAlign: "right" },
  colTotal: { width: 64, textAlign: "right" },
  cellText: { fontSize: 9.5 },
  /* ── Totals ── */
  totalsWrap: { alignItems: "flex-end", marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 5, width: 220 },
  totalLabel: { flex: 1, fontSize: 9.5, color: C.muted },
  totalValue: { width: 72, textAlign: "right", fontSize: 9.5 },
  grandRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: C.fg, width: 220 },
  grandLabel: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 11 },
  grandValue: { width: 72, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 11 },
  /* ── Footer ── */
  footer: { position: "absolute", bottom: 32, left: 52, right: 52, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  footerText: { fontSize: 8, color: C.muted, textAlign: "center" },
});

interface InvoicePdfProps {
  order?: Order;
  invoice?: InvoiceDocumentModel;
}

function badgeStyle(status: InvoiceStatusModel) {
  switch (status.tone) {
    case "paid":
    case "delivered":
      return { backgroundColor: C.greenBg, color: C.greenFg };
    case "unpaid":
      return { backgroundColor: C.amberBg, color: C.amberFg };
    case "cancelled":
      return { backgroundColor: C.redBg, color: C.redFg };
    case "in_progress":
      return { backgroundColor: C.blueBg, color: C.blueFg };
  }
}

export function OrderInvoicePdf({ order, invoice: providedInvoice }: InvoicePdfProps) {
  const invoice = providedInvoice ?? (order ? buildInvoiceDocument(order) : null);
  if (!invoice) {
    throw new Error("Invoice data is required.");
  }
  const template = buildInvoiceTemplate(invoice);

  return (
    <Document title={`Invoice ${invoice.invoiceNumber} - ${invoice.business.name}`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.brandRow}>
            {localLogoSrc ? (
              <Image src={localLogoSrc} style={s.logo} />
            ) : null}
            <View>
              <Text style={s.brandName}>{invoice.business.name}</Text>
              <Text style={s.brandSub}>{invoice.business.address}</Text>
              <Text style={s.brandSub}>{invoice.business.phone}</Text>
              <Text style={s.brandSub}>{invoice.business.email}</Text>
            </View>
          </View>
          <View>
            <Text style={s.invoiceLabel}>Invoice</Text>
            <Text style={s.invoiceRef}>#{invoice.invoiceNumber}</Text>
            <View style={s.statusWrap}>
              {template.statusBadges.map((status) => (
                <Text
                  key={`${status.tone}-${status.label}`}
                  style={[s.statusBadge, badgeStyle(status)]}
                >
                  {status.label}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={s.rule} />

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaHead}>Bill To</Text>
            {template.customerLines.map((line, index) => (
              <Text
                key={`${line}-${index}`}
                style={index === 0 ? s.metaValue : s.metaMuted}
              >
                {line}
              </Text>
            ))}
          </View>
          <View style={s.metaBlockRight}>
            {template.details.map((line, index) => (
              <View key={line.label}>
                <Text style={index === 0 ? s.metaHead : { ...s.metaHead, marginTop: 8 }}>
                  {line.label}
                </Text>
                <Text style={s.metaValue}>{line.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Table header */}
        <View style={s.tableHead}>
          <Text style={{ ...s.tableHeadText, ...s.colItem }}>Item</Text>
          <Text style={{ ...s.tableHeadText, ...s.colQty }}>Qty</Text>
          <Text style={{ ...s.tableHeadText, ...s.colUnit }}>Unit price</Text>
          <Text style={{ ...s.tableHeadText, ...s.colTotal }}>Total</Text>
        </View>

        {/* Table rows */}
        {template.items.length === 0 ? (
          <View style={{ ...s.tableRow, ...s.tableRowLast }}>
            <Text style={s.cellText}>No invoice items</Text>
          </View>
        ) : (
          template.items.map((item, idx) => (
            <View
              key={item.id}
              style={idx === template.items.length - 1 ? { ...s.tableRow, ...s.tableRowLast } : s.tableRow}
            >
              <Text style={{ ...s.cellText, ...s.colItem }}>{item.name}</Text>
              <Text style={{ ...s.cellText, ...s.colQty }}>{item.quantity}</Text>
              <Text style={{ ...s.cellText, ...s.colUnit }}>{item.unitPrice}</Text>
              <Text style={{ ...s.cellText, ...s.colTotal }}>{item.rowTotal}</Text>
            </View>
          ))
        )}

        {/* Totals */}
        <View style={s.totalsWrap}>
          {template.totals.map((line) =>
            line.emphasis ? (
              <View key={line.id} style={s.grandRow}>
                <Text style={s.grandLabel}>{line.label}</Text>
                <Text style={s.grandValue}>{line.value}</Text>
              </View>
            ) : (
              <View key={line.id} style={s.totalRow}>
                <Text style={s.totalLabel}>{line.label}</Text>
                <Text style={s.totalValue}>{line.value}</Text>
              </View>
            ),
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {[invoice.business.name, ...template.businessContactLines].join(" · ")}
          </Text>
          <Text style={{ ...s.footerText, marginTop: 2 }}>
            {invoice.footerMessage}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
