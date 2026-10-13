import { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiCall } from "@/api/client";
import type { AdminOrderDetail, OrderItemSnapshot, OrderStatus } from "@/api/types";
import { useApiGet } from "@/api/useApiGet";
import { Banner, ContactActions, PrimaryButton, SecondaryButton } from "@/components/controls";
import { useDialog } from "@/components/dialog";
import { ScreenLayout } from "@/components/ScreenLayout";
import { Card, EmptyState, StatusBadge } from "@/components/ui";
import { formatDateTime, palette } from "@/format";
import { useBadges } from "@/hooks/useBadges";
import {
  canTransitionOrderStatus,
  formatCurrencyGBP,
  formatOrderAge,
  getNextOrderActions,
  inferPaymentStatus,
  isCompletedOrder,
  isLateOrder,
  isTestOrderHeuristic,
  ORDER_STATUS_LABELS,
} from "@/lib/order-operations";
import {
  downloadInvoicePdf,
  getInvoiceDocument,
  invoiceActionErrorMessage,
  isInvoiceUserCancel,
  sendInvoiceEmail,
} from "@/lib/invoice-documents";
import {
  printCustomerReceipt,
  printKitchenTicket,
} from "@/lib/order-printing";
import type { MainStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "OrderDetail">;
type DetailAction =
  | "kitchen"
  | "receipt"
  | "email_invoice"
  | "share_invoice"
  | "print_invoice"
  | null;

export function OrderDetailScreen({ route }: Props): JSX.Element {
  const { id } = route.params;
  const { data, error, loading, reload } = useApiGet<AdminOrderDetail>(
    `/api/admin/orders/${id}`,
    [id],
  );
  const [saving, setSaving] = useState<OrderStatus | null>(null);
  const [action, setAction] = useState<DetailAction>(null);
  const savingRef = useRef<OrderStatus | null>(null);
  const actionRef = useRef<DetailAction>(null);
  const { refresh: refreshBadges } = useBadges();
  const dialog = useDialog();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const updateStatus = async (next: OrderStatus): Promise<void> => {
    if (!data || savingRef.current) return;
    if (!canTransitionOrderStatus(data.status, next)) {
      await dialog.alert({
        title: "Status not available",
        message: `This order cannot move from ${ORDER_STATUS_LABELS[data.status]} to ${ORDER_STATUS_LABELS[next]}.`,
        tone: "warning",
      });
      return;
    }
    savingRef.current = next;
    setSaving(next);
    try {
      const res = await apiCall<AdminOrderDetail>({
        method: "POST",
        path: `/api/admin/orders/${id}/status`,
        body: { status: next },
      });
      if (!res.ok) {
        await dialog.alert({
          title: "Couldn't update status",
          message: res.message,
          tone: "danger",
        });
        return;
      }
      await reload();
      void refreshBadges({ force: true });
      await dialog.alert({
        title: "Status updated",
        message: `Order marked ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
        tone: "success",
        playSound: false,
      });
    } finally {
      savingRef.current = null;
      setSaving(null);
    }
  };

  const confirmAndUpdate = async (next: OrderStatus): Promise<void> => {
    const ok = await dialog.confirm({
      title:
        next === "cancelled"
          ? "Cancel this order?"
          : next === "rejected"
            ? "Reject this order?"
            : `Mark ${ORDER_STATUS_LABELS[next].toLowerCase()}?`,
      message:
        next === "cancelled" || next === "rejected"
          ? "No cancel reason will be saved in this pass."
          : undefined,
      confirmLabel:
        next === "cancelled"
          ? "Cancel order"
          : next === "rejected"
            ? "Reject order"
            : "Confirm",
      cancelLabel: "Go back",
      destructive: next === "cancelled" || next === "rejected",
    });
    if (ok) await updateStatus(next);
  };

  const runAction = async (
    nextAction: Exclude<DetailAction, null>,
    handler: () => Promise<void>,
  ): Promise<void> => {
    if (actionRef.current) return;
    actionRef.current = nextAction;
    setAction(nextAction);
    try {
      await handler();
    } catch (err: unknown) {
      if (!isInvoiceUserCancel(err)) {
        await dialog.alert({
          title: "Action failed",
          message: invoiceActionErrorMessage(err),
          tone: "danger",
        });
      }
    } finally {
      actionRef.current = null;
      setAction(null);
    }
  };

  const printKitchen = async (): Promise<void> => {
    if (!data) return;
    await runAction("kitchen", () => printKitchenTicket(data));
  };

  const printReceipt = async (): Promise<void> => {
    if (!data) return;
    await runAction("receipt", async () => {
      let invoice = null;
      try {
        invoice = await getInvoiceDocument(data.id);
      } catch {
        invoice = null;
      }
      await printCustomerReceipt({ order: data, invoice });
    });
  };

  const emailInvoice = async (): Promise<void> => {
    if (!data) return;
    const email = data.customerEmail.trim();
    if (!email) {
      await dialog.alert({
        title: "Missing email",
        message: "This order does not have a customer email address.",
        tone: "warning",
      });
      return;
    }
    await runAction("email_invoice", async () => {
      const result = await sendInvoiceEmail({
        invoiceId: data.id,
        email,
        defaultEmail: data.customerEmail,
      });
      await dialog.alert({
        title: "Invoice sent",
        message: result.skipped
          ? "Invoice email was prepared in demo mode."
          : `Invoice sent to ${result.toEmail}.`,
        tone: "success",
      });
    });
  };

  const shareInvoice = async (): Promise<void> => {
    if (!data) return;
    await runAction("share_invoice", async () => {
      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error("Sharing is not available on this device.");
      const invoice = await getInvoiceDocument(data.id);
      const pdf = await downloadInvoicePdf({
        invoiceId: invoice.id,
        fileName: invoice.fileName,
      });
      await Sharing.shareAsync(pdf.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: invoice.invoiceNumber,
      });
    });
  };

  const printInvoice = async (): Promise<void> => {
    if (!data) return;
    await runAction("print_invoice", async () => {
      const invoice = await getInvoiceDocument(data.id);
      const pdf = await downloadInvoicePdf({
        invoiceId: invoice.id,
        fileName: invoice.fileName,
      });
      await Print.printAsync({ uri: pdf.uri });
    });
  };

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!data && error) {
    return (
      <ScreenLayout>
        <Banner tone="danger">{error}</Banner>
        <SecondaryButton
          label="Try again"
          onPress={() => void reload()}
          style={styles.retryButton}
        />
      </ScreenLayout>
    );
  }

  if (!data) {
    return (
      <ScreenLayout>
        <EmptyState message="Order not found" />
        <SecondaryButton
          label="Reload"
          onPress={() => void reload()}
          style={styles.retryButton}
        />
      </ScreenLayout>
    );
  }

  const payment = inferPaymentStatus(data);
  const actions = getNextOrderActions(data);
  const isTerminal = isCompletedOrder(data);
  const late = isLateOrder(data);
  const test = isTestOrderHeuristic(data);
  const busy = saving !== null || action !== null;

  return (
    <ScreenLayout
      refreshing={loading}
      onRefresh={() => void reload()}
      keyboardShouldPersistTaps="handled"
    >
      {error ? <Banner tone="danger">{error}</Banner> : null}
      {late ? <Banner tone="warning">This order is running late.</Banner> : null}
      {test ? (
        <Banner tone="warning">
          Possible test order. Treat this as a warning only.
        </Banner>
      ) : null}

      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.flexText}>
            <Text style={styles.ref}>{data.reference ?? data.id.slice(0, 8)}</Text>
            <Text style={styles.muted}>
              {data.type} · {formatOrderAge(data.createdAt)} ·{" "}
              {formatDateTime(data.createdAt)}
            </Text>
          </View>
          <StatusBadge status={data.status} />
        </View>
        <View style={styles.badgeLine}>
          <PaymentPill label={payment.label} tone={payment.tone} />
          {data.estimatedTime ? (
            <View style={styles.softPill}>
              <Text style={styles.softPillText}>{data.estimatedTime}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      {isTerminal ? (
        <Banner tone={data.status === "delivered" ? "success" : "warning"}>
          This order is {ORDER_STATUS_LABELS[data.status].toLowerCase()}.
        </Banner>
      ) : null}

      {actions.length > 0 ? (
        <Card style={styles.card}>
          <Text style={styles.section}>Status actions</Text>
          <View style={styles.actionGrid}>
            {actions.map((item) => (
              <SecondaryButton
                key={item.status}
                label={item.label}
                busy={saving === item.status}
                disabled={busy && saving !== item.status}
                tone={item.tone === "danger" ? "danger" : item.tone === "success" ? "success" : "default"}
                onPress={() =>
                  item.requiresConfirmation
                    ? void confirmAndUpdate(item.status)
                    : void updateStatus(item.status)
                }
                style={styles.actionButton}
              />
            ))}
          </View>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Text style={styles.section}>Customer</Text>
        <Text style={styles.name}>{data.customerName || "Customer"}</Text>
        <InfoLine icon="call-outline" value={data.customerPhone} />
        <InfoLine icon="mail-outline" value={data.customerEmail} />
        {data.address ? <InfoLine icon="location-outline" value={data.address} /> : null}
        <ContactActions
          phone={data.customerPhone}
          email={data.customerEmail}
          address={data.address ?? null}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Items</Text>
        {data.items.length === 0 ? (
          <Text style={styles.muted}>No items on this order.</Text>
        ) : (
          data.items.map((item, index) => (
            <OrderItemRow
              key={`${item.menuItemId}-${index}`}
              item={item}
              showBorder={index > 0}
            />
          ))
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Totals</Text>
        <MoneyRow label="Subtotal" value={formatCurrencyGBP(data.subtotalPence)} />
        <MoneyRow label="Delivery" value={formatCurrencyGBP(data.deliveryFeePence)} />
        {data.discountPence > 0 ? (
          <MoneyRow
            label={`Discount${data.discountCode ? ` (${data.discountCode})` : ""}`}
            value={`-${formatCurrencyGBP(data.discountPence)}`}
          />
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrencyGBP(data.totalPence)}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.section}>Print and invoice</Text>
        <View style={styles.actionGrid}>
          <SecondaryButton
            label="Print kitchen ticket"
            busy={action === "kitchen"}
            disabled={busy && action !== "kitchen"}
            onPress={() => void printKitchen()}
            style={styles.actionButton}
          />
          <SecondaryButton
            label="Print customer receipt"
            busy={action === "receipt"}
            disabled={busy && action !== "receipt"}
            onPress={() => void printReceipt()}
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Email invoice"
            busy={action === "email_invoice"}
            disabled={busy && action !== "email_invoice"}
            onPress={() => void emailInvoice()}
            style={styles.actionButton}
          />
          <SecondaryButton
            label="Share invoice PDF"
            busy={action === "share_invoice"}
            disabled={busy && action !== "share_invoice"}
            onPress={() => void shareInvoice()}
            style={styles.actionButton}
          />
          <SecondaryButton
            label="Print invoice PDF"
            busy={action === "print_invoice"}
            disabled={busy && action !== "print_invoice"}
            onPress={() => void printInvoice()}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </ScreenLayout>
  );
}

function PaymentPill({
  label,
  tone,
}: {
  label: string;
  tone: "paid" | "unpaid" | "cash" | "unknown";
}): JSX.Element {
  const colors =
    tone === "paid"
      ? { bg: palette.successBg, fg: palette.success }
      : tone === "cash"
        ? { bg: palette.infoBg, fg: palette.info }
        : tone === "unpaid"
          ? { bg: palette.warningBg, fg: palette.warning }
          : { bg: palette.surfaceAlt, fg: palette.textMuted };
  return (
    <View style={[styles.paymentPill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.paymentText, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

function InfoLine({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }): JSX.Element {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={15} color={palette.textMuted} />
      <Text style={styles.muted} selectable>
        {value || "-"}
      </Text>
    </View>
  );
}

function itemMetaLines(item: OrderItemSnapshot): string[] {
  const raw = item as unknown as Record<string, unknown>;
  const out: string[] = [];
  const notes = raw.notes ?? raw.note;
  if (typeof notes === "string" && notes.trim()) out.push(`Note: ${notes.trim()}`);
  for (const key of ["modifiers", "options"]) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) {
      out.push(value.trim());
    } else if (Array.isArray(value)) {
      const entries = value
        .map((entry) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object" && "name" in entry) {
            return String((entry as { name?: unknown }).name ?? "");
          }
          return "";
        })
        .filter(Boolean);
      if (entries.length > 0) out.push(entries.join(", "));
    }
  }
  return out;
}

function OrderItemRow({
  item,
  showBorder,
}: {
  item: OrderItemSnapshot;
  showBorder: boolean;
}): JSX.Element {
  const meta = itemMetaLines(item);
  return (
    <View style={[styles.itemRow, showBorder && styles.itemRowBorder]}>
      <View style={styles.flexText}>
        <Text style={styles.itemName}>
          {item.quantity} x {item.name}
        </Text>
        {meta.map((line) => (
          <Text key={line} style={styles.itemMeta}>
            {line}
          </Text>
        ))}
        {item.allergens.length > 0 ? (
          <Text style={styles.allergens}>{item.allergens.join(", ")}</Text>
        ) : null}
      </View>
      <Text style={styles.itemPrice}>{formatCurrencyGBP(item.totalPence)}</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg,
  },
  retryButton: { alignSelf: "flex-start", marginTop: 12 },
  card: { marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  flexText: { flex: 1, minWidth: 0 },
  ref: { fontSize: 21, fontWeight: "900", color: palette.text },
  muted: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  badgeLine: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  paymentPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paymentText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  softPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: palette.surfaceAlt,
  },
  softPillText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  section: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0,
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: "46%",
    minWidth: 142,
  },
  name: { color: palette.text, fontWeight: "800", fontSize: 16, marginBottom: 8 },
  infoLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
  },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: palette.border },
  itemName: { color: palette.text, fontWeight: "800", fontSize: 15, lineHeight: 20 },
  itemMeta: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  itemPrice: {
    color: palette.text,
    fontWeight: "800",
    minWidth: 76,
    textAlign: "right",
  },
  allergens: { color: palette.warning, fontSize: 12, marginTop: 2 },
  moneyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 12,
  },
  moneyValue: { color: palette.text, fontWeight: "800", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 12,
    marginTop: 8,
    gap: 12,
  },
  totalLabel: { color: palette.text, fontWeight: "900", fontSize: 17 },
  totalValue: {
    color: palette.primary,
    fontWeight: "900",
    fontSize: 18,
    textAlign: "right",
  },
});
