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
import type { AdminOrderListItem } from "@/lib/admin/types";
import type { OrderStatus } from "@/types/database";

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

const STATUS_FILTERS: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "making", label: "Making" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

export interface OrdersAdminClientProps {
  orders: AdminOrderListItem[];
}

export function OrdersAdminClient({ orders }: OrdersAdminClientProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search]);

  const columns: AdminColumn<AdminOrderListItem>[] = [
    {
      key: "id",
      header: "Order",
      render: (r) => (
        <NextLink href={`/admin/orders/${r.id}`}>
          <Box as="span" color="brand.fg" fontWeight="600">
            {r.reference ?? r.id.slice(0, 8)}
          </Box>
        </NextLink>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customerName },
    { key: "type", header: "Type", render: (r) => r.type },
    {
      key: "status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    { key: "items", header: "Items", render: (r) => r.itemCount },
    { key: "total", header: "Total", render: (r) => formatPence(r.totalPence) },
    {
      key: "payment",
      header: "Payment",
      render: (r) => r.paymentMethod,
    },
    {
      key: "created",
      header: "Placed",
      render: (r) => formatDateTime(r.createdAt),
    },
    {
      key: "action",
      header: "",
      render: (r) => (
        <Button asChild size="xs" variant="outline" borderColor="border">
          <NextLink href={`/admin/orders/${r.id}`}>Open</NextLink>
        </Button>
      ),
    },
  ];

  return (
    <Stack gap={5}>
      <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
        Orders
      </Heading>
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="Search id, name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="320px"
        />
        <NativeSelect.Root maxW="220px">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | OrderStatus)
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
        <AdminEmptyState title="No orders match" />
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
