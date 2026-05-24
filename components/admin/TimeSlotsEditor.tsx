"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import type { AdminTimeSlot } from "@/lib/admin/types";
import type { SlotType } from "@/types/database";

const TYPES: SlotType[] = ["collection", "booking"];

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as
    | { ok: true; data: unknown }
    | { ok: false; error: { message: string } };
}

export interface TimeSlotsEditorProps {
  slots: AdminTimeSlot[];
}

export function TimeSlotsEditor({ slots }: TimeSlotsEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [type, setType] = useState<SlotType>("collection");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      setError("Use HH:mm.");
      return;
    }
    setBusy(true);
    const res = await send("/api/admin/time-slots", "POST", {
      type,
      time,
      active: true,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setTime("");
    startTransition(() => router.refresh());
  };

  const toggleActive = async (slot: AdminTimeSlot) => {
    setRowBusy(slot.id);
    const res = await send("/api/admin/time-slots", "PUT", {
      id: slot.id,
      active: !slot.active,
    });
    setRowBusy(null);
    if (!res.ok) {
      window.alert(res.error.message);
      return;
    }
    startTransition(() => router.refresh());
  };

  const remove = async (slot: AdminTimeSlot) => {
    if (!window.confirm(`Delete ${slot.type} slot ${slot.time}?`)) return;
    setRowBusy(slot.id);
    const res = await send(
      `/api/admin/time-slots?id=${encodeURIComponent(slot.id)}`,
      "DELETE",
    );
    setRowBusy(null);
    if (!res.ok) {
      window.alert(res.error.message);
      return;
    }
    startTransition(() => router.refresh());
  };

  const groups: Record<SlotType, AdminTimeSlot[]> = {
    collection: slots.filter((s) => s.type === "collection"),
    booking: slots.filter((s) => s.type === "booking"),
  };

  return (
    <Stack gap={5}>
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
        padding={3}
      >
        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="600">
            Add slot
          </Text>
          <HStack gap={2} flexWrap="wrap" align="flex-end">
            <Field.Root maxW="180px">
              <Field.Label>Type</Field.Label>
              <NativeSelect.Root size="sm" disabled={busy}>
                <NativeSelect.Field
                  value={type}
                  onChange={(e) => setType(e.target.value as SlotType)}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root maxW="140px">
              <Field.Label>Time (HH:mm)</Field.Label>
              <Input
                size="sm"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={busy}
              />
            </Field.Root>
            <Button
              size="sm"
              onClick={add}
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
              loading={busy}
              disabled={busy}
            >
              Add
            </Button>
          </HStack>
          {error ? (
            <Text role="alert" fontSize="xs" color="red.700">
              {error}
            </Text>
          ) : null}
        </Stack>
      </Box>

      {TYPES.map((t) => (
        <Stack gap={2} key={t}>
          <Heading as="h4" size="xs" textTransform="capitalize" color="fg.default">
            {t}
          </Heading>
          {groups[t].length === 0 ? (
            <AdminEmptyState title={`No ${t} slots`} />
          ) : (
            <Stack gap={2}>
              {groups[t].map((s) => (
                <HStack
                  key={s.id}
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  bg="bg.subtle"
                  padding={2.5}
                  gap={3}
                  flexWrap="wrap"
                >
                  <Text fontWeight="600">{s.time}</Text>
                  <Checkbox.Root
                    checked={s.active}
                    onCheckedChange={() => toggleActive(s)}
                    disabled={rowBusy === s.id}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Active</Checkbox.Label>
                  </Checkbox.Root>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="red.300"
                    color="red.700"
                    marginLeft="auto"
                    onClick={() => remove(s)}
                    loading={rowBusy === s.id}
                    disabled={rowBusy !== null}
                  >
                    Delete
                  </Button>
                </HStack>
              ))}
            </Stack>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
