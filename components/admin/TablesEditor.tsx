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

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import type { AdminTable } from "@/lib/admin/types";

interface RowDraft {
  maxCovers: string;
  active: boolean;
  saving: boolean;
  error: string | null;
}

export interface TablesEditorProps {
  tables: AdminTable[];
}

export function TablesEditor({ tables }: TablesEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() => {
    const out: Record<string, RowDraft> = {};
    for (const t of tables) {
      out[t.id] = {
        maxCovers: String(t.maxCovers),
        active: t.active,
        saving: false,
        error: null,
      };
    }
    return out;
  });

  const update = (id: string, patch: Partial<RowDraft>) =>
    setDrafts((p) => ({ ...p, [id]: { ...p[id]!, ...patch } }));

  const save = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    const max = Number(d.maxCovers);
    if (!Number.isInteger(max) || max < 1 || max > 12) {
      update(id, { error: "Max covers must be 1–12." });
      return;
    }
    update(id, { saving: true, error: null });
    try {
      const res = await fetch("/api/admin/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, maxCovers: max, active: d.active }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      update(id, { saving: false, error: json.ok ? null : json.error.message });
      if (json.ok) startTransition(() => router.refresh());
    } catch {
      update(id, { saving: false, error: "Save failed." });
    }
  };

  if (tables.length === 0) {
    return (
      <AdminEmptyState
        title="No tables seeded"
        description="Tables are created when the database is seeded."
      />
    );
  }

  return (
    <Stack gap={3}>
      {tables.map((t) => {
        const d = drafts[t.id]!;
        return (
          <Box
            key={t.id}
            borderWidth="1px"
            borderColor="border"
            borderRadius="md"
            bg="bg.subtle"
            padding={3}
          >
            <Stack gap={2}>
              <HStack gap={3} flexWrap="wrap" align="flex-end">
                <Text fontWeight="600">Table {t.number}</Text>
                <Field.Root maxW="120px">
                  <Field.Label>Max covers</Field.Label>
                  <Input
                    size="sm"
                    inputMode="numeric"
                    value={d.maxCovers}
                    onChange={(e) => update(t.id, { maxCovers: e.target.value })}
                    disabled={d.saving}
                  />
                </Field.Root>
                <Checkbox.Root
                  checked={d.active}
                  onCheckedChange={(de) =>
                    update(t.id, { active: de.checked === true })
                  }
                  disabled={d.saving}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>Active</Checkbox.Label>
                </Checkbox.Root>
                <Button
                  size="sm"
                  marginLeft="auto"
                  onClick={() => save(t.id)}
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
  );
}
