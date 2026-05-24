"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useMemo, useState } from "react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { AdminBookingListItem } from "@/lib/admin/types";
import type { BookingStatus } from "@/types/database";

const STATUS_FILTERS: { value: "all" | BookingStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export interface BookingsAdminClientProps {
  bookings: AdminBookingListItem[];
}

export function BookingsAdminClient({ bookings }: BookingsAdminClientProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.date.includes(q)
      );
    });
  }, [bookings, statusFilter, search]);

  const columns: AdminColumn<AdminBookingListItem>[] = [
    {
      key: "id",
      header: "Booking",
      render: (r) => (
        <NextLink href={`/admin/bookings/${r.id}`}>
          <Box as="span" color="brand.fg" fontWeight="600">
            {r.reference ?? r.id.slice(0, 8)}
          </Box>
        </NextLink>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "date", header: "Date", render: (r) => `${r.date} · ${r.timeSlot}` },
    { key: "covers", header: "Covers", render: (r) => r.covers },
    {
      key: "status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      key: "deposit",
      header: "Deposit",
      render: (r) => (r.depositPaid ? "Paid" : "—"),
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button asChild size="xs" variant="outline" borderColor="border">
          <NextLink href={`/admin/bookings/${r.id}`}>Open</NextLink>
        </Button>
      ),
    },
  ];

  return (
    <Stack gap={5}>
      <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
        Bookings
      </Heading>
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="Search id, name, email, phone, date…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="320px"
        />
        <NativeSelect.Root maxW="220px">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | BookingStatus)
            }
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
      {filtered.length === 0 ? (
        <AdminEmptyState title="No bookings match" />
      ) : (
        <AdminDataTable
          columns={columns}
          rows={filtered}
          getRowKey={(r) => r.id}
        />
      )}
    </Stack>
  );
}
