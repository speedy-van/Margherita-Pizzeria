import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { OrdersAdminClient } from "@/components/admin/OrdersAdminClient";
import { getAdminOrders } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  try {
    const orders = await getAdminOrders();
    return <OrdersAdminClient orders={orders} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/orders] failed:", err);
    return <AdminErrorState title="Could not load orders" />;
  }
}
