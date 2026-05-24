"use client";

import {
  Box,
  Button,
  Checkbox,
  Field,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminMenuCategory } from "@/lib/admin/types";

export interface MenuCategoryManagerProps {
  categories: AdminMenuCategory[];
}

interface RowDraft {
  name: string;
  displayOrder: string;
  active: boolean;
  saving: boolean;
  error: string | null;
}

export function MenuCategoryManager({ categories }: MenuCategoryManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() => {
    const out: Record<string, RowDraft> = {};
    for (const c of categories) {
      out[c.id] = {
        name: c.name,
        displayOrder: String(c.displayOrder),
        active: c.active,
        saving: false,
        error: null,
      };
    }
    return out;
  });
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const updateDraft = (id: string, patch: Partial<RowDraft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));

  const saveRow = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    updateDraft(id, { saving: true, error: null });
    const order = Number(d.displayOrder);
    if (!Number.isFinite(order) || order < 0) {
      updateDraft(id, { saving: false, error: "Invalid display order." });
      return;
    }
    try {
      const res = await fetch(`/api/admin/menu/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name.trim(),
          displayOrder: order,
          active: d.active,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        updateDraft(id, { saving: false, error: json.error.message });
        return;
      }
      updateDraft(id, { saving: false });
      startTransition(() => router.refresh());
    } catch {
      updateDraft(id, { saving: false, error: "Save failed." });
    }
  };

  const create = async () => {
    setCreateError(null);
    const name = newName.trim();
    if (name.length < 2) {
      setCreateError("Enter a category name.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/admin/menu/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          displayOrder: categories.length,
          active: true,
        }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setCreateError(json.error.message);
        return;
      }
      setNewName("");
      startTransition(() => router.refresh());
    } catch {
      setCreateError("Create failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack gap={4}>
      <Stack gap={3}>
        {categories.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No categories yet.
          </Text>
        ) : null}
        {categories.map((c) => {
          const d = drafts[c.id]!;
          return (
            <Box
              key={c.id}
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              bg="bg.subtle"
              padding={3}
            >
              <Stack gap={2}>
                <HStack gap={2} flexWrap="wrap">
                  <Field.Root flex="2" minW="180px">
                    <Field.Label>Name</Field.Label>
                    <Input
                      size="sm"
                      value={d.name}
                      onChange={(e) => updateDraft(c.id, { name: e.target.value })}
                      disabled={d.saving}
                    />
                  </Field.Root>
                  <Field.Root maxW="120px">
                    <Field.Label>Order</Field.Label>
                    <Input
                      size="sm"
                      inputMode="numeric"
                      value={d.displayOrder}
                      onChange={(e) =>
                        updateDraft(c.id, { displayOrder: e.target.value })
                      }
                      disabled={d.saving}
                    />
                  </Field.Root>
                  <Checkbox.Root
                    checked={d.active}
                    onCheckedChange={(de) =>
                      updateDraft(c.id, { active: de.checked === true })
                    }
                    disabled={d.saving}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Active</Checkbox.Label>
                  </Checkbox.Root>
                  <Button
                    size="sm"
                    onClick={() => saveRow(c.id)}
                    bg="brand.solid"
                    color="brand.contrast"
                    _hover={{ bg: "brand.emphasized" }}
                    loading={d.saving}
                    disabled={d.saving}
                  >
                    Save
                  </Button>
                </HStack>
                {d.error ? (
                  <Text role="alert" fontSize="xs" color="red.700">
                    {d.error}
                  </Text>
                ) : null}
              </Stack>
            </Box>
          );
        })}
      </Stack>
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
        padding={3}
      >
        <Stack gap={2}>
          <Text fontSize="sm" fontWeight="600">
            Add category
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Input
              size="sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              disabled={creating}
              maxW="280px"
            />
            <Button
              size="sm"
              onClick={create}
              variant="outline"
              borderColor="border"
              loading={creating}
              disabled={creating}
            >
              Add
            </Button>
          </HStack>
          {createError ? (
            <Text role="alert" fontSize="xs" color="red.700">
              {createError}
            </Text>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}
