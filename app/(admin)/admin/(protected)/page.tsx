import type { Metadata } from "next";

import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { getAdminDashboardStats } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  try {
    const stats = await getAdminDashboardStats();
    return <DashboardOverview stats={stats} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/dashboard] failed:", err);
    return (
      <AdminErrorState
        title="Could not load dashboard"
        description="The database may be unreachable. Try again in a moment."
      />
    );
  }
}
