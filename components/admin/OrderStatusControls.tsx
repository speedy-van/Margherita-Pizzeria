"use client";

import {
  Box,
  Button,
  HStack,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { getAdminOrderNextStatuses } from "@/lib/admin/validation";
import type { OrderStatus, OrderType } from "@/types/database";

export interface OrderStatusControlsProps {
  orderId: string;
  currentStatus: OrderStatus;
  orderType: OrderType;
}

export function OrderStatusControls({
  orderId,
  currentStatus,
  orderType,
}: OrderStatusControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const options = [
    currentStatus,
    ...getAdminOrderNextStatuses(currentStatus, orderType),
  ];

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap={3}>
      <Text fontSize="sm" fontWeight="600" color="fg.default">
        Update status
      </Text>
      <HStack gap={3} flexWrap="wrap">
        <NativeSelect.Root maxW="240px" disabled={busy || pending}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Button
          onClick={save}
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.emphasized" }}
          loading={busy || pending}
          disabled={busy || pending || status === currentStatus}
        >
          Save
        </Button>
      </HStack>
      {error ? (
        <Box>
          <AdminErrorState title="Update failed" description={error} />
        </Box>
      ) : null}
    </Stack>
  );
}
