import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { SettingsAdminClient } from "@/components/admin/SettingsAdminClient";
import {
  getAdminSettings,
  getAdminTables,
  getAdminTimeSlots,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  try {
    const [settings, timeSlots, tables] = await Promise.all([
      getAdminSettings(),
      getAdminTimeSlots(),
      getAdminTables(),
    ]);
    return (
      <SettingsAdminClient
        settings={settings}
        timeSlots={timeSlots}
        tables={tables}
      />
    );
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/settings] failed:", err);
    return <AdminErrorState title="Could not load settings" />;
  }
}
