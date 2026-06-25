import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useApiGet } from "@/api/useApiGet";
import type {
  AdminOrderListItem,
  InvoiceDocumentModel,
  InvoiceStatusModel,
} from "@/api/types";
import { Banner, PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { ScreenLayout } from "@/components/ScreenLayout";
import { Card } from "@/components/ui";
import {
  buttonNeon,
  formatDateTime,
  formatMoney,
  palette,
  shadow,
} from "@/format";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  downloadInvoicePdf,
  invoiceActionErrorMessage,
  isInvoiceUserCancel,
  sendInvoiceEmail,
} from "@/lib/invoice-documents";
import type { MainStackParamList } from "@/navigation/types";

type InvoicesProps = NativeStackScreenProps<MainStackParamList, "Invoices">;
type InvoiceDetailProps = NativeStackScreenProps<MainStackParamList, "InvoiceDetail">;
type InvoiceAction = "email" | "print" | "share" | "save" | null;

function invoiceNumber(order: Pick<AdminOrderListItem, "id" | "reference">): string {
  return `INV-${order.reference ?? order.id.slice(0, 8).toUpperCase()}`;
}

function matchesInvoiceSearch(order: AdminOrderListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    order.reference,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    invoiceNumber(order),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function InvoicesScreen({ navigation }: InvoicesProps): JSX.Element {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } =
    useApiGet<AdminOrderListItem[]>("/api/admin/orders");

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const invoices = useMemo(() => {
    return [...(data ?? [])]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .filter((order) => matchesInvoiceSearch(order, query));
  }, [data, query]);

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      refreshing={loading && !!data}
      onRefresh={() => void reload()}
      contentContainerStyle={styles.container}
    >
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={palette.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("Search ref, name, phone, email")}
              placeholderTextColor={palette.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
          <SecondaryButton
            label={t("Refresh")}
            icon="↻"
            onPress={() => void reload()}
            accessibilityLabel={t("Refresh invoices")}
          />
        </View>

        {error ? (
          <>
            <Banner tone="danger">{error}</Banner>
            <SecondaryButton
              label={t("Try again")}
              onPress={() => void reload()}
              accessibilityLabel={t("Retry loading invoices")}
              style={styles.retryButton}
            />
          </>
        ) : null}

        {invoices.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={34} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>{t("No invoices")}</Text>
            <Text style={styles.emptyText}>
              {data?.length
                ? t("No invoices match this search.")
                : t("Orders will appear here once placed.")}
            </Text>
          </Card>
        ) : (
          invoices.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("InvoiceDetail", { id: item.id })}
              style={({ pressed }) => pressed && { opacity: 0.65 }}
              accessibilityRole="button"
              accessibilityLabel={`${t("Open invoice")} ${invoiceNumber(item)}`}
            >
              <Card style={styles.invoiceRow}>
                <View style={styles.invoiceTop}>
                  <View style={styles.flexText}>
                    <Text style={styles.invoiceNo} numberOfLines={1}>
                      {invoiceNumber(item)}
                    </Text>
                    <Text style={styles.invoiceCustomer} numberOfLines={1}>
                      {item.customerName}
                    </Text>
                  </View>
                  <Text style={styles.invoiceTotal}>{formatMoney(item.totalPence)}</Text>
                </View>
                <View style={styles.invoiceBottom}>
                  <Text style={styles.invoiceMeta}>
                    {formatDateTime(item.createdAt)} · {item.type}
                  </Text>
                  <InvoiceStatusBadge
                    status={{
                      label: item.status.replace(/_/g, " "),
                      tone:
                        item.status === "delivered"
                          ? "delivered"
                          : item.status === "cancelled" || item.status === "rejected"
                            ? "cancelled"
                            : "in_progress",
                    }}
                  />
                </View>
              </Card>
            </Pressable>
          ))
        )}
    </ScreenLayout>
  );
}

export function InvoiceDetailScreen({ route }: InvoiceDetailProps): JSX.Element {
  const { id } = route.params;
  const { t } = useLanguage();
  const dialog = useDialog();
  const [email, setEmail] = useState("");
  const [action, setAction] = useState<InvoiceAction>(null);
  const { data, error, loading, reload } = useApiGet<InvoiceDocumentModel>(
    `/api/admin/invoices/${id}`,
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (data) setEmail(data.customer.email);
  }, [data]);

  const downloadPdf = useCallback(
    async (directory: "cache" | "document" = "cache") => {
      if (!data) throw new Error(t("Invoice not found"));
      return downloadInvoicePdf({
        invoiceId: data.id,
        fileName: data.fileName,
        directory,
      });
    },
    [data, t],
  );

  const emailInvoice = useCallback(async () => {
    if (!data || action) return;
    const toEmail = email.trim();
    if (!toEmail) {
      await dialog.alert({
        title: t("Missing email"),
        message: t("Enter a customer email address before sending."),
        tone: "warning",
      });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(toEmail)) {
      await dialog.alert({
        title: t("Invalid email"),
        message: t("Enter a valid email address."),
        tone: "warning",
      });
      return;
    }
    if (data.orderStatus.tone === "cancelled") {
      const ok = await dialog.confirm({
        title: t("Send cancelled invoice?"),
        message: t("This invoice is cancelled or rejected. Send it anyway?"),
        confirmLabel: t("Send invoice"),
        cancelLabel: t("Cancel"),
        destructive: true,
      });
      if (!ok) return;
    }

    setAction("email");
    try {
      const result = await sendInvoiceEmail({
        invoiceId: data.id,
        email: toEmail,
        defaultEmail: data.customer.email,
      });
      await dialog.alert({
        title: t("Invoice sent"),
        message: result.skipped
          ? t("Invoice email was prepared in demo mode.")
          : `${t("Invoice sent to")} ${result.toEmail}.`,
        tone: "success",
      });
    } catch (err: unknown) {
      await dialog.alert({
        title: t("Email failed"),
        message: invoiceActionErrorMessage(err),
        tone: "danger",
      });
    } finally {
      setAction(null);
    }
  }, [action, data, dialog, email, t]);

  const printPdf = useCallback(async () => {
    if (!data || action) return;
    setAction("print");
    try {
      const pdf = await downloadPdf("cache");
      await Print.printAsync({ uri: pdf.uri });
    } catch (err: unknown) {
      if (!isInvoiceUserCancel(err)) {
        await dialog.alert({
          title: t("Print failed"),
          message: invoiceActionErrorMessage(err),
          tone: "danger",
        });
      }
    } finally {
      setAction(null);
    }
  }, [action, data, dialog, downloadPdf, t]);

  const sharePdf = useCallback(async () => {
    if (!data || action) return;
    setAction("share");
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error(t("Sharing is not available on this device."));
      const pdf = await downloadPdf("cache");
      await Sharing.shareAsync(pdf.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: data.invoiceNumber,
      });
    } catch (err: unknown) {
      if (!isInvoiceUserCancel(err)) {
        await dialog.alert({
          title: t("Share failed"),
          message: invoiceActionErrorMessage(err),
          tone: "danger",
        });
      }
    } finally {
      setAction(null);
    }
  }, [action, data, dialog, downloadPdf, t]);

  const savePdf = useCallback(async () => {
    if (!data || action) return;
    setAction("save");
    try {
      const pdf = await downloadPdf("document");
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: t("Save invoice PDF"),
        });
      } else {
        await dialog.alert({
          title: t("PDF saved"),
          message: `${t("Saved as")} ${pdf.fileName}.`,
          tone: "success",
        });
      }
    } catch (err: unknown) {
      if (!isInvoiceUserCancel(err)) {
        await dialog.alert({
          title: t("Save failed"),
          message: invoiceActionErrorMessage(err),
          tone: "danger",
        });
      }
    } finally {
      setAction(null);
    }
  }, [action, data, dialog, downloadPdf, t]);

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centerState}>
          <Ionicons name="document-text-outline" size={42} color={palette.textMuted} />
          <Text style={styles.errorTitle}>{t("Invoice not found")}</Text>
          <Text style={styles.centerText}>{error ?? t("Could not load invoice.")}</Text>
          <SecondaryButton
            label={t("Try again")}
            onPress={() => void reload()}
            accessibilityLabel={t("Retry loading invoice")}
            style={styles.retryButton}
          />
        </View>
      </ScreenLayout>
    );
  }

  const busy = action !== null;

  return (
    <ScreenLayout
      refreshing={loading && !!data}
      onRefresh={() => void reload()}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.detailContainer}
    >
        {error ? <Banner tone="danger">{error}</Banner> : null}
        <InvoiceHeader invoice={data} />
        <InvoiceCustomerCard invoice={data} email={email} setEmail={setEmail} />
        <InvoiceItemsCard invoice={data} />
        <InvoiceTotalsCard invoice={data} />

        <InvoiceActions
          action={action}
          disabled={busy}
          onEmail={emailInvoice}
          onPrint={printPdf}
          onShare={sharePdf}
          onSave={savePdf}
        />
    </ScreenLayout>
  );
}

function InvoiceHeader({ invoice }: { invoice: InvoiceDocumentModel }): JSX.Element {
  const { t } = useLanguage();
  const businessContact = [invoice.business.phone, invoice.business.email]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card style={styles.invoiceCard}>
      <View style={styles.detailHeader}>
        <View style={styles.businessHeading}>
          {invoice.business.logoUrl ? (
            <Image
              source={{ uri: invoice.business.logoUrl }}
              alt={`${invoice.business.name} logo`}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View style={styles.flexText}>
            <Text style={styles.brand}>{invoice.business.name}</Text>
            <Text style={styles.invoiceNoLarge}>{invoice.invoiceNumber}</Text>
          </View>
        </View>
        <InvoiceStatusBadge status={invoice.paymentStatus} />
      </View>
      <View style={styles.businessContact}>
        <Text style={styles.businessContactText}>{invoice.business.address}</Text>
        {businessContact ? (
          <Text style={styles.businessContactText}>{businessContact}</Text>
        ) : null}
      </View>
      <View style={styles.metaGrid}>
        <Meta label={t("Issued")} value={invoice.issueDate} />
        <Meta label={t("Order ref")} value={invoice.orderReference} />
        <Meta label={t("Order type")} value={invoice.fulfilmentType} />
        <Meta label={t("Payment")} value={invoice.paymentMethod} />
      </View>
      <View style={styles.statusRow}>
        <InvoiceStatusBadge status={invoice.orderStatus} />
      </View>
    </Card>
  );
}

function InvoiceCustomerCard({
  invoice,
  email,
  setEmail,
}: {
  invoice: InvoiceDocumentModel;
  email: string;
  setEmail: (value: string) => void;
}): JSX.Element {
  const { t } = useLanguage();
  return (
    <Card style={styles.invoiceCard}>
      <Text style={styles.section}>{t("Bill to")}</Text>
      <Text style={styles.customerName}>{invoice.customer.name}</Text>
      <Text style={styles.muted}>{invoice.customer.phone}</Text>
      {invoice.customer.address ? (
        <Text style={[styles.muted, styles.address]}>{invoice.customer.address}</Text>
      ) : null}
      <Text style={styles.inputLabel}>{t("Email recipient")}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("Customer email")}
        placeholderTextColor={palette.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        style={styles.emailInput}
      />
    </Card>
  );
}

function InvoiceItemsCard({ invoice }: { invoice: InvoiceDocumentModel }): JSX.Element {
  const { t } = useLanguage();
  return (
    <Card style={styles.invoiceCard}>
      <Text style={styles.section}>{t("Invoice items")}</Text>
      {invoice.items.length === 0 ? (
        <Text style={styles.muted}>{t("No invoice items")}</Text>
      ) : (
        invoice.items.map((item, index) => (
          <View
            key={item.lineId}
            style={[styles.itemRow, index > 0 && styles.itemBorder]}
          >
            <View style={styles.flexText}>
              <Text style={styles.itemName}>
                {item.quantity} x {item.name}
              </Text>
              <Text style={styles.itemMeta}>{item.unitPrice} {t("each")}</Text>
            </View>
            <Text style={styles.itemTotal}>{item.rowTotal}</Text>
          </View>
        ))
      )}
    </Card>
  );
}

function InvoiceTotalsCard({ invoice }: { invoice: InvoiceDocumentModel }): JSX.Element {
  return (
    <Card style={styles.invoiceCard}>
      <MoneyRow label={invoice.subtotal.label} value={invoice.subtotal.value} />
      {invoice.deliveryFee.amountPence > 0 ? (
        <MoneyRow label={invoice.deliveryFee.label} value={invoice.deliveryFee.value} />
      ) : null}
      {invoice.discount ? (
        <MoneyRow label={invoice.discount.label} value={invoice.discount.value} />
      ) : null}
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>{invoice.total.label}</Text>
        <Text style={styles.grandTotalValue}>{invoice.total.value}</Text>
      </View>
      <Text style={styles.footerMessage}>{invoice.footerMessage}</Text>
    </Card>
  );
}

function InvoiceActions({
  action,
  disabled,
  onEmail,
  onPrint,
  onShare,
  onSave,
}: {
  action: InvoiceAction;
  disabled: boolean;
  onEmail: () => void;
  onPrint: () => void;
  onShare: () => void;
  onSave: () => void;
}): JSX.Element {
  const { t } = useLanguage();
  return (
    <View style={styles.actions}>
      <PrimaryButton
        label={t("Email invoice")}
        icon="✉"
        disabled={disabled && action !== "email"}
        busy={action === "email"}
        onPress={onEmail}
        accessibilityLabel={t("Email invoice PDF")}
        style={styles.actionButton}
      />
      <SecondaryButton
        label={t("Print")}
        icon="⎙"
        disabled={disabled && action !== "print"}
        busy={action === "print"}
        onPress={onPrint}
        accessibilityLabel={t("Print invoice PDF")}
        style={styles.actionButton}
      />
      <SecondaryButton
        label={t("Share PDF")}
        icon="↗"
        disabled={disabled && action !== "share"}
        busy={action === "share"}
        onPress={onShare}
        accessibilityLabel={t("Share invoice PDF")}
        style={styles.actionButton}
      />
      <SecondaryButton
        label={t("Save PDF")}
        icon="⇩"
        disabled={disabled && action !== "save"}
        busy={action === "save"}
        onPress={onSave}
        accessibilityLabel={t("Save invoice PDF")}
        style={styles.actionButton}
      />
    </View>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatusModel }): JSX.Element {
  const tone =
    status.tone === "paid" || status.tone === "delivered"
      ? { bg: palette.successBg, fg: palette.success }
      : status.tone === "cancelled"
        ? { bg: palette.dangerBg, fg: palette.dangerFg }
        : status.tone === "unpaid"
          ? { bg: palette.warningBg, fg: palette.warning }
          : { bg: palette.infoBg, fg: palette.info };
  return (
    <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.statusText, { color: tone.fg }]}>{status.label}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function MoneyRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.moneyRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.moneyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1, backgroundColor: palette.bg },
  container: { paddingTop: 20, paddingHorizontal: 16 },
  detailContainer: { paddingTop: 22, paddingHorizontal: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: palette.bg,
  },
  centerText: {
    color: palette.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  errorTitle: {
    color: palette.text,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 12,
  },
  toolbar: { gap: 10, marginBottom: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    minHeight: 48,
    ...shadow,
    ...buttonNeon,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: palette.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  retryButton: { alignSelf: "center", marginTop: 10 },
  flexText: { flex: 1, minWidth: 0 },
  invoiceRow: { marginBottom: 10 },
  invoiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  invoiceNo: { color: palette.text, fontSize: 16, fontWeight: "800" },
  invoiceCustomer: { color: palette.textMuted, marginTop: 3, fontSize: 13 },
  invoiceTotal: {
    color: palette.primary,
    fontWeight: "800",
    fontSize: 15,
    textAlign: "right",
  },
  invoiceBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 12,
  },
  invoiceMeta: { color: palette.textMuted, fontSize: 12, flex: 1 },
  emptyCard: { alignItems: "center", paddingVertical: 34 },
  emptyTitle: { color: palette.text, fontWeight: "800", fontSize: 17, marginTop: 12 },
  emptyText: {
    color: palette.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  invoiceCard: { marginBottom: 12 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  businessHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.surfaceAlt,
  },
  brand: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  invoiceNoLarge: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 3,
  },
  businessContact: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: 14,
    paddingTop: 12,
    gap: 4,
  },
  businessContactText: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  metaItem: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 132,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
  },
  metaLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 4,
  },
  metaValue: { color: palette.text, fontWeight: "700", fontSize: 13 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: "center",
  },
  statusText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  section: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 10,
  },
  customerName: { color: palette.text, fontSize: 16, fontWeight: "800", marginBottom: 3 },
  muted: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  address: { marginTop: 6 },
  inputLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  emailInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
    color: palette.text,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
  },
  itemBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  itemName: { color: palette.text, fontWeight: "700", fontSize: 14, lineHeight: 19 },
  itemMeta: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  itemTotal: {
    color: palette.text,
    fontWeight: "800",
    minWidth: 78,
    textAlign: "right",
    fontSize: 14,
  },
  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 12,
  },
  moneyValue: { color: palette.text, fontWeight: "700", textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    marginTop: 8,
    gap: 12,
  },
  grandTotalLabel: { color: palette.text, fontWeight: "900", fontSize: 17 },
  grandTotalValue: {
    color: palette.primary,
    fontWeight: "900",
    fontSize: 18,
    textAlign: "right",
  },
  footerMessage: {
    color: palette.textMuted,
    textAlign: "center",
    marginTop: 14,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 142,
  },
});
