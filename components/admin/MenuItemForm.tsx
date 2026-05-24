"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";

import type { AdminMenuCategory, AdminMenuItem } from "@/lib/admin/types";
export interface MenuItemFormValues {
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePence: number;
  imageUrl: string | null;
  available: boolean;
  allergens: string[];
}

export interface MenuItemFormProps {
  categories: AdminMenuCategory[];
  initial?: AdminMenuItem | null;
  onSubmit: (values: MenuItemFormValues) => Promise<{ ok: boolean; error?: string }>;
  onCancel?: () => void;
  submitLabel?: string;
}

function fromItem(it: AdminMenuItem | null | undefined, fallbackCat: string | null) {
  if (!it) {
    return {
      categoryId: fallbackCat,
      name: "",
      description: "",
      priceStr: "",
      imageUrl: "",
      available: true,
      allergensStr: "",
    };
  }
  return {
    categoryId: it.categoryId,
    name: it.name,
    description: it.description ?? "",
    priceStr: (it.pricePence / 100).toFixed(2),
    imageUrl: it.imageUrl ?? "",
    available: it.available,
    allergensStr: it.allergens.join(", "),
  };
}

export function MenuItemForm({
  categories,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: MenuItemFormProps) {
  const firstCat = categories[0]?.id ?? null;
  const [state, setState] = useState(fromItem(initial, firstCat));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const priceNum = Number(state.priceStr);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Enter a valid price in pounds.");
      return;
    }
    const pricePence = Math.round(priceNum * 100);
    if (pricePence < 1 || pricePence > 5000) {
      setError("Price must be between £0.01 and £50.00.");
      return;
    }
    if (state.name.trim().length < 2) {
      setError("Name is required.");
      return;
    }

    const allergens = state.allergensStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const values: MenuItemFormValues = {
      categoryId: state.categoryId,
      name: state.name.trim(),
      description: state.description.trim() || null,
      pricePence,
      imageUrl: state.imageUrl.trim() || null,
      available: state.available,
      allergens,
    };

    setBusy(true);
    const res = await onSubmit(values);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Save failed.");
  };

  return (
    <form onSubmit={handle} noValidate>
      <Stack gap={4}>
        <Field.Root required>
          <Field.Label>Name</Field.Label>
          <Input
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
            disabled={busy}
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>Category</Field.Label>
          <NativeSelect.Root disabled={busy}>
            <NativeSelect.Field
              value={state.categoryId ?? ""}
              onChange={(e) =>
                setState({
                  ...state,
                  categoryId: e.target.value ? e.target.value : null,
                })
              }
            >
              <option value="">(none)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Textarea
            rows={3}
            value={state.description}
            onChange={(e) => setState({ ...state, description: e.target.value })}
            disabled={busy}
          />
        </Field.Root>
        <HStack gap={3} flexWrap="wrap" align="flex-end">
          <Field.Root required maxW="160px">
            <Field.Label>Price (£)</Field.Label>
            <Input
              inputMode="decimal"
              value={state.priceStr}
              onChange={(e) => setState({ ...state, priceStr: e.target.value })}
              disabled={busy}
            />
          </Field.Root>
          <Field.Root flex="1" minW="240px">
            <Field.Label>Image URL</Field.Label>
            <Input
              value={state.imageUrl}
              onChange={(e) => setState({ ...state, imageUrl: e.target.value })}
              disabled={busy}
              placeholder="https://…"
            />
          </Field.Root>
        </HStack>
        <Field.Root>
          <Field.Label>Allergens (comma separated)</Field.Label>
          <Input
            value={state.allergensStr}
            onChange={(e) => setState({ ...state, allergensStr: e.target.value })}
            disabled={busy}
            placeholder="gluten, milk, eggs"
          />
        </Field.Root>
        <Checkbox.Root
          checked={state.available}
          onCheckedChange={(d) =>
            setState({ ...state, available: d.checked === true })
          }
          disabled={busy}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Available</Checkbox.Label>
        </Checkbox.Root>
        {error ? (
          <Box>
            <Text role="alert" color="red.700" fontSize="sm">
              {error}
            </Text>
          </Box>
        ) : null}
        <HStack gap={3}>
          <Button
            type="submit"
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            loading={busy}
            disabled={busy}
          >
            {submitLabel}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              borderColor="border"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
          ) : null}
        </HStack>
      </Stack>
    </form>
  );
}
