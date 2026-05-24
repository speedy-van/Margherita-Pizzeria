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
import { ADMIN_BOOKING_STATUSES } from "@/lib/admin/validation";
import type { BookingStatus } from "@/types/database";

export interface BookingStatusControlsProps {
  bookingId: string;
  currentStatus: BookingStatus;
}

export function BookingStatusControls({
  bookingId,
  currentStatus,
}: BookingStatusControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<BookingStatus>(
    currentStatus === "pending" ? "confirmed" : currentStatus,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
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
        <NativeSelect.Root maxW="220px" disabled={busy || pending}>
          <NativeSelect.Field
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus)}
          >
            {ADMIN_BOOKING_STATUSES.map((s) => (
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
      {status === "rejected" ? (
        <Text fontSize="xs" color="fg.muted">
          Rejecting will email the customer.
        </Text>
      ) : null}
      {error ? (
        <Box>
          <AdminErrorState title="Update failed" description={error} />
        </Box>
      ) : null}
    </Stack>
  );
}
