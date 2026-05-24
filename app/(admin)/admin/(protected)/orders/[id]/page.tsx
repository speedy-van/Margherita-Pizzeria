import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { OrderDetailAdminClient } from "@/components/admin/OrderDetailAdminClient";
import { getAdminOrderDetail } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const order = await getAdminOrderDetail(id);
    if (!order) notFound();
    return <OrderDetailAdminClient order={order} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/orders/[id]] failed:", err);
    return <AdminErrorState title="Could not load order" />;
  }
}
