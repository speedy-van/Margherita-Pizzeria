"use client";

import { Box, Grid, Heading, Stack } from "@chakra-ui/react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type {
  AdminBookingListItem,
  AdminDashboardStats,
  AdminOrderListItem,
} from "@/lib/admin/types";

function formatPence(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const ORDER_COLUMNS: AdminColumn<AdminOrderListItem>[] = [
  { key: "id", header: "Order", render: (r) => r.id.slice(0, 8) },
  { key: "customer", header: "Customer", render: (r) => r.customerName },
  { key: "type", header: "Type", render: (r) => r.type },
  {
    key: "status",
    header: "Status",
    render: (r) => <AdminStatusBadge status={r.status} />,
  },
  { key: "total", header: "Total", render: (r) => formatPence(r.totalPence) },
  { key: "created", header: "Placed", render: (r) => formatDateTime(r.createdAt) },
];

const BOOKING_COLUMNS: AdminColumn<AdminBookingListItem>[] = [
  { key: "id", header: "Booking", render: (r) => r.id.slice(0, 8) },
  { key: "customer", header: "Customer", render: (r) => r.customerName },
  { key: "date", header: "Date", render: (r) => `${r.date} · ${r.timeSlot}` },
  { key: "covers", header: "Covers", render: (r) => r.covers },
  {
    key: "status",
    header: "Status",
    render: (r) => <AdminStatusBadge status={r.status} />,
  },
];

export interface DashboardOverviewProps {
  stats: AdminDashboardStats;
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
          Dashboard
        </Heading>
        <Box color="fg.muted" fontSize="sm">
          Today, server time. Generated {formatDateTime(stats.generatedAt)}.
        </Box>
      </Stack>

      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
        gap={4}
      >
        <AdminStatCard label="Orders today" value={stats.todayOrderCount} />
        <AdminStatCard
          label="Revenue today"
          value={formatPence(stats.todayRevenuePence)}
          helper="Excludes cancelled / rejected / unpaid."
        />
        <AdminStatCard label="Bookings today" value={stats.todayBookingCount} />
        <AdminStatCard
          label="Pending bookings"
          value={stats.pendingBookingsCount}
          helper="Awaiting confirmation."
        />
        <AdminStatCard label="Active menu items" value={stats.activeMenuItemsCount} />
        <AdminStatCard
          label="Unavailable items"
          value={stats.unavailableMenuItemsCount}
        />
      </Grid>

      <Stack gap={3}>
        <Heading as="h2" size="md" color="fg.default">
          Latest orders
        </Heading>
        {stats.latestOrders.length === 0 ? (
          <AdminEmptyState title="No orders yet" />
        ) : (
          <AdminDataTable
            columns={ORDER_COLUMNS}
            rows={stats.latestOrders}
            getRowKey={(r) => r.id}
          />
        )}
      </Stack>

      <Stack gap={3}>
        <Heading as="h2" size="md" color="fg.default">
          Latest bookings
        </Heading>
        {stats.latestBookings.length === 0 ? (
          <AdminEmptyState title="No bookings yet" />
        ) : (
          <AdminDataTable
            columns={BOOKING_COLUMNS}
            rows={stats.latestBookings}
            getRowKey={(r) => r.id}
          />
        )}
      </Stack>
    </Stack>
  );
}
