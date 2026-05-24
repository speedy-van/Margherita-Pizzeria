"use client";

import {
  Badge,
  Box,
  Button,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import type {
  AdminDiscount,
  DiscountType,
} from "@/lib/discounts/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

interface ApiOk<T> {
  ok: true;
  data: T;
}
interface ApiErr {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}
type ApiRes<T> = ApiOk<T> | ApiErr;

export interface DiscountsAdminClientProps {
  initial: AdminDiscount[];
}

interface FormState {
  id: string | null;
  code: string;
  title: string;
  description: string;
  type: DiscountType;
  value: string;
  minOrderPence: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  appliesToDelivery: boolean;
  appliesToCollection: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  code: "",
  title: "",
  description: "",
  type: "percentage",
  value: "10",
  minOrderPence: "0",
  startsAt: "",
  endsAt: "",
  active: true,
  appliesToDelivery: true,
  appliesToCollection: true,
};

function toForm(d: AdminDiscount): FormState {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    description: d.description ?? "",
    type: d.type,
    value: String(d.value),
    minOrderPence: String(d.minOrderPence),
    startsAt: d.startsAt ? d.startsAt.slice(0, 16) : "",
    endsAt: d.endsAt ? d.endsAt.slice(0, 16) : "",
    active: d.active,
    appliesToDelivery: d.appliesToDelivery,
    appliesToCollection: d.appliesToCollection,
  };
}

function toIsoOrNull(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pencesFromInput(v: string, defaultV = 0): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return defaultV;
  return Math.max(0, Math.trunc(n));
}

export function DiscountsAdminClient({ initial }: DiscountsAdminClientProps) {
  const [rows, setRows] = useState<AdminDiscount[]>(initial);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isEditing = form.id !== null;

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setError(null);
  }, []);

  const payload = useMemo(() => {
    return {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      value: pencesFromInput(form.value),
      minOrderPence: pencesFromInput(form.minOrderPence),
      startsAt: toIsoOrNull(form.startsAt),
      endsAt: toIsoOrNull(form.endsAt),
      active: form.active,
      appliesToDelivery: form.appliesToDelivery,
      appliesToCollection: form.appliesToCollection,
    };
  }, [form]);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const url = isEditing
        ? `/api/admin/discounts/${form.id}`
        : "/api/admin/discounts";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiRes<AdminDiscount>;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setRows((prev) => {
        const without = prev.filter((r) => r.id !== json.data.id);
        return [...without, json.data].sort((a, b) =>
          a.code.localeCompare(b.code),
        );
      });
      setNotice(isEditing ? "Discount updated." : "Discount created.");
      reset();
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }, [form.id, isEditing, payload, reset]);

  const remove = useCallback(async (id: string) => {
    if (!window.confirm("Delete this discount? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as ApiRes<{ id: string }>;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setNotice("Discount deleted.");
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Stack gap={6}>
      <Heading as="h1" size="lg" color="fg.default">
        Discounts
      </Heading>

      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        bg="bg.subtle"
        padding={{ base: 4, md: 6 }}
      >
        <Stack gap={4}>
          <Heading as="h2" size="md" color="fg.default">
            {isEditing ? `Edit ${form.code || "discount"}` : "Add discount"}
          </Heading>

          <HStack gap={4} flexWrap="wrap" align="end">
            <Field.Root required maxW="220px">
              <Field.Label>Code</Field.Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                placeholder="WELCOME10"
                maxLength={40}
                disabled={busy}
              />
            </Field.Root>
            <Field.Root required flex="1" minW="220px">
              <Field.Label>Title</Field.Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="10% off your first order"
                maxLength={160}
                disabled={busy}
              />
            </Field.Root>
          </HStack>

          <Field.Root>
            <Field.Label>Description (optional)</Field.Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              maxLength={2000}
              disabled={busy}
            />
          </Field.Root>

          <HStack gap={4} flexWrap="wrap" align="end">
            <Field.Root maxW="180px">
              <Field.Label>Type</Field.Label>
              <NativeSelect.Root disabled={busy}>
                <NativeSelect.Field
                  title="Discount type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value as DiscountType,
                    }))
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed (pence)</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root required maxW="180px">
              <Field.Label>
                {form.type === "percentage" ? "Percent off (1–100)" : "Amount off (pence)"}
              </Field.Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={form.type === "percentage" ? 100 : 1_000_000}
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                disabled={busy}
              />
            </Field.Root>
            <Field.Root maxW="200px">
              <Field.Label>Min order (pence)</Field.Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.minOrderPence}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minOrderPence: e.target.value }))
                }
                disabled={busy}
              />
            </Field.Root>
          </HStack>

          <HStack gap={4} flexWrap="wrap" align="end">
            <Field.Root maxW="260px">
              <Field.Label>Starts at (optional)</Field.Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startsAt: e.target.value }))
                }
                disabled={busy}
              />
            </Field.Root>
            <Field.Root maxW="260px">
              <Field.Label>Ends at (optional)</Field.Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endsAt: e.target.value }))
                }
                disabled={busy}
              />
            </Field.Root>
          </HStack>

          <HStack gap={6} flexWrap="wrap">
            <Switch.Root
              checked={form.active}
              onCheckedChange={(d) =>
                setForm((p) => ({ ...p, active: d.checked }))
              }
              disabled={busy}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Active</Switch.Label>
            </Switch.Root>
            <Switch.Root
              checked={form.appliesToDelivery}
              onCheckedChange={(d) =>
                setForm((p) => ({ ...p, appliesToDelivery: d.checked }))
              }
              disabled={busy}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Delivery</Switch.Label>
            </Switch.Root>
            <Switch.Root
              checked={form.appliesToCollection}
              onCheckedChange={(d) =>
                setForm((p) => ({ ...p, appliesToCollection: d.checked }))
              }
              disabled={busy}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Collection</Switch.Label>
            </Switch.Root>
          </HStack>

          {error ? (
            <Text role="alert" color="red.700" fontSize="sm">
              {error}
            </Text>
          ) : null}
          {notice ? (
            <Text role="status" color="fg.muted" fontSize="sm">
              {notice}
            </Text>
          ) : null}

          <HStack gap={3} flexWrap="wrap">
            <Button
              type="button"
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
              onClick={submit}
              loading={busy}
              loadingText="Saving..."
              disabled={busy}
            >
              {isEditing ? "Save changes" : "Create discount"}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                variant="outline"
                borderColor="border"
                color="fg.default"
                onClick={reset}
                disabled={busy}
              >
                Cancel
              </Button>
            ) : null}
          </HStack>
        </Stack>
      </Box>

      <Stack gap={3}>
        <Heading as="h2" size="md" color="fg.default">
          Existing discounts
        </Heading>
        {rows.length === 0 ? (
          <AdminEmptyState
            title="No discounts yet"
            description="Create your first discount above."
          />
        ) : (
          <Stack gap={2}>
            {rows.map((r) => (
              <Box
                key={r.id}
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                padding={3}
                bg="bg.subtle"
              >
                <HStack justify="space-between" gap={3} flexWrap="wrap">
                  <Stack gap={1}>
                    <HStack gap={2} flexWrap="wrap">
                      <Text fontWeight="700" color="fg.default">
                        {r.code}
                      </Text>
                      <Badge colorPalette={r.active ? "green" : "gray"} variant="subtle">
                        {r.active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge colorPalette="orange" variant="subtle">
                        {r.type === "percentage"
                          ? `${r.value}% off`
                          : `${formatGBPFromPence(r.value)} off`}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="fg.default">
                      {r.title}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      Min order {formatGBPFromPence(r.minOrderPence)} ·{" "}
                      {r.appliesToDelivery ? "Delivery" : ""}
                      {r.appliesToDelivery && r.appliesToCollection ? " + " : ""}
                      {r.appliesToCollection ? "Collection" : ""}
                    </Text>
                  </Stack>
                  <HStack gap={2}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      borderColor="border"
                      color="fg.default"
                      onClick={() => setForm(toForm(r))}
                      disabled={busy}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      borderColor="red.500"
                      color="red.700"
                      onClick={() => void remove(r.id)}
                      disabled={busy}
                    >
                      Delete
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
