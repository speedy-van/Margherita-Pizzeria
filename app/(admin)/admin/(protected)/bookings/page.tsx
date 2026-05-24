import type { Metadata } from "next";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { BookingsAdminClient } from "@/components/admin/BookingsAdminClient";
import { getAdminBookings } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookings",
  robots: { index: false, follow: false },
};

export default async function AdminBookingsPage() {
  try {
    const bookings = await getAdminBookings();
    return <BookingsAdminClient bookings={bookings} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/bookings] failed:", err);
    return <AdminErrorState title="Could not load bookings" />;
  }
}
