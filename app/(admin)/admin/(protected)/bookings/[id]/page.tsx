import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { BookingDetailAdminClient } from "@/components/admin/BookingDetailAdminClient";
import { getAdminBookingDetail } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking detail",
  robots: { index: false, follow: false },
};

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const booking = await getAdminBookingDetail(id);
    if (!booking) notFound();
    return <BookingDetailAdminClient booking={booking} />;
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[admin/bookings/[id]] failed:", err);
    return <AdminErrorState title="Could not load booking" />;
  }
}
