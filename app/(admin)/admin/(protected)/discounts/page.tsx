import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { DiscountsAdminClient } from "@/components/admin/DiscountsAdminClient";
import { listAdminDiscounts } from "@/lib/discounts/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discounts",
  robots: { index: false, follow: false },
};

export default async function AdminDiscountsPage() {
  try {
    const rows = await listAdminDiscounts();
    return <DiscountsAdminClient initial={rows} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/discounts] failed:", err);
    return <AdminErrorState title="Could not load discounts" />;
  }
}
