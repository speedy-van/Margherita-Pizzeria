import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { MenuAdminClient } from "@/components/admin/MenuAdminClient";
import { getAdminMenu } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu",
  robots: { index: false, follow: false },
};

export default async function AdminMenuPage() {
  try {
    const payload = await getAdminMenu();
    return <MenuAdminClient payload={payload} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/menu] failed:", err);
    return <AdminErrorState title="Could not load menu" />;
  }
}
