"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";
import { TablesEditor } from "@/components/admin/TablesEditor";
import { TimeSlotsEditor } from "@/components/admin/TimeSlotsEditor";
import type {
  AdminSettings,
  AdminTable,
  AdminTimeSlot,
} from "@/lib/admin/types";
import type { OpeningHours } from "@/types/database";

export interface SettingsAdminClientProps {
  settings: AdminSettings;
  timeSlots: AdminTimeSlot[];
  tables: AdminTable[];
}

interface FormState {
  minDeliveryOrderStr: string;
  deliveryFeeStr: string;
  prepStr: string;
  deliveryStr: string;
  depositEnabled: boolean;
  depositStr: string;
  openingHours: OpeningHours;
}

function init(s: AdminSettings): FormState {
  return {
    minDeliveryOrderStr: (s.minDeliveryOrderPence / 100).toFixed(2),
    deliveryFeeStr: (s.deliveryFeePence / 100).toFixed(2),
    prepStr: String(s.prepTimeMinutes),
    deliveryStr: String(s.deliveryTimeMinutes),
    depositEnabled: s.depositEnabled,
    depositStr: (s.depositAmountPence / 100).toFixed(2),
    openingHours: s.openingHours,
  };
}

export function SettingsAdminClient({
  settings,
  timeSlots,
  tables,
}: SettingsAdminClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(() => init(settings));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const parsePoundsToPence = (
    s: string,
  ): { ok: true; value: number } | { ok: false } => {
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return { ok: false };
    return { ok: true, value: Math.round(n * 100) };
  };
  const parseInt0 = (s: string): { ok: true; value: number } | { ok: false } => {
    const n = Number(s);
    if (!Number.isInteger(n) || n < 0) return { ok: false };
    return { ok: true, value: n };
  };

  const save = async () => {
    setError(null);
    const minDel = parsePoundsToPence(state.minDeliveryOrderStr);
    const fee = parsePoundsToPence(state.deliveryFeeStr);
    const prep = parseInt0(state.prepStr);
    const del = parseInt0(state.deliveryStr);
    const dep = parsePoundsToPence(state.depositStr);
    if (!minDel.ok || !fee.ok || !prep.ok || !del.ok || !dep.ok) {
      setError("Check numeric fields are valid.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDeliveryOrderPence: minDel.value,
          deliveryFeePence: fee.value,
          prepTimeMinutes: prep.value,
          deliveryTimeMinutes: del.value,
          depositEnabled: state.depositEnabled,
          depositAmountPence: dep.value,
          openingHours: state.openingHours,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
      startTransition(() => router.refresh());
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
        Settings
      </Heading>

      <Stack gap={4}>
        <Heading as="h2" size="md">
          Delivery
        </Heading>
        <HStack gap={4} flexWrap="wrap">
          <Field.Root maxW="200px">
            <Field.Label>Min delivery order (£)</Field.Label>
            <Input
              inputMode="decimal"
              value={state.minDeliveryOrderStr}
              onChange={(e) =>
                setState({ ...state, minDeliveryOrderStr: e.target.value })
              }
            />
          </Field.Root>
          <Field.Root maxW="200px">
            <Field.Label>Delivery fee (£)</Field.Label>
            <Input
              inputMode="decimal"
              value={state.deliveryFeeStr}
              onChange={(e) =>
                setState({ ...state, deliveryFeeStr: e.target.value })
              }
            />
          </Field.Root>
          <Field.Root maxW="200px">
            <Field.Label>Prep time (minutes)</Field.Label>
            <Input
              inputMode="numeric"
              value={state.prepStr}
              onChange={(e) => setState({ ...state, prepStr: e.target.value })}
            />
          </Field.Root>
          <Field.Root maxW="200px">
            <Field.Label>Delivery time (minutes)</Field.Label>
            <Input
              inputMode="numeric"
              value={state.deliveryStr}
              onChange={(e) =>
                setState({ ...state, deliveryStr: e.target.value })
              }
            />
          </Field.Root>
        </HStack>
      </Stack>

      <Stack gap={4}>
        <Heading as="h2" size="md">
          Booking deposit
        </Heading>
        <HStack gap={4} flexWrap="wrap" align="flex-end">
          <Checkbox.Root
            checked={state.depositEnabled}
            onCheckedChange={(d) =>
              setState({ ...state, depositEnabled: d.checked === true })
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Deposit required</Checkbox.Label>
          </Checkbox.Root>
          <Field.Root maxW="200px">
            <Field.Label>Deposit amount (£)</Field.Label>
            <Input
              inputMode="decimal"
              value={state.depositStr}
              onChange={(e) => setState({ ...state, depositStr: e.target.value })}
              disabled={!state.depositEnabled}
            />
          </Field.Root>
        </HStack>
      </Stack>

      <Stack gap={4}>
        <Heading as="h2" size="md">
          Opening hours
        </Heading>
        <OpeningHoursEditor
          value={state.openingHours}
          onChange={(openingHours) => setState({ ...state, openingHours })}
          disabled={saving}
        />
      </Stack>

      <Box>
        <HStack gap={3}>
          <Button
            onClick={save}
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            loading={saving}
            disabled={saving}
          >
            Save settings
          </Button>
          {savedAt ? (
            <Text fontSize="sm" color="fg.muted">
              Saved at {savedAt}
            </Text>
          ) : null}
        </HStack>
        {error ? (
          <Box marginTop={3}>
            <AdminErrorState title="Save failed" description={error} />
          </Box>
        ) : null}
      </Box>

      <Stack gap={4}>
        <Heading as="h2" size="md">
          Time slots
        </Heading>
        <TimeSlotsEditor slots={timeSlots} />
      </Stack>

      <Stack gap={4}>
        <Heading as="h2" size="md">
          Tables
        </Heading>
        <TablesEditor tables={tables} />
      </Stack>
    </Stack>
  );
}
