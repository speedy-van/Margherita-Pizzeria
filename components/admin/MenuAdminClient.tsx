"use client";

import {
  Button,
  Dialog,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { MenuCategoryManager } from "@/components/admin/MenuCategoryManager";
import {
  MenuItemForm,
  type MenuItemFormValues,
} from "@/components/admin/MenuItemForm";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  AdminMenuPayload,
} from "@/lib/admin/types";

function formatPence(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}

async function postJson(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as
    | { ok: true; data: unknown }
    | { ok: false; error: { message: string } };
}

export interface MenuAdminClientProps {
  payload: AdminMenuPayload;
}

export function MenuAdminClient({ payload }: MenuAdminClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminMenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    const m = new Map<string, AdminMenuCategory>();
    for (const c of payload.categories) m.set(c.id, c);
    return m;
  }, [payload.categories]);

  const columns: AdminColumn<AdminMenuItem>[] = [
    { key: "name", header: "Item", render: (r) => r.name },
    {
      key: "cat",
      header: "Category",
      render: (r) =>
        r.categoryId ? categoryMap.get(r.categoryId)?.name ?? "—" : "—",
    },
    {
      key: "price",
      header: "Price",
      render: (r) => formatPence(r.pricePence),
    },
    {
      key: "available",
      header: "Available",
      render: (r) => (r.available ? "Yes" : "No"),
    },
    {
      key: "allergens",
      header: "Allergens",
      render: (r) => r.allergens.join(", ") || "—",
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <HStack gap={2}>
          <Button
            size="xs"
            variant="outline"
            borderColor="border"
            onClick={() => setEditing(r)}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderColor="red.300"
            color="red.700"
            onClick={async () => {
              if (
                !window.confirm(`Delete "${r.name}"? This cannot be undone.`)
              )
                return;
              setDeletingId(r.id);
              const res = await postJson(
                `/api/admin/menu/items/${r.id}`,
                {},
                "DELETE",
              );
              setDeletingId(null);
              if (!res.ok) {
                window.alert(res.error.message);
                return;
              }
              startTransition(() => router.refresh());
            }}
            loading={deletingId === r.id}
            disabled={deletingId !== null}
          >
            Delete
          </Button>
        </HStack>
      ),
    },
  ];

  return (
    <Stack gap={8}>
      <Stack gap={2}>
        <Heading as="h1" fontFamily="heading" size="lg" color="fg.default">
          Menu
        </Heading>
      </Stack>

      <Stack gap={3}>
        <HStack justify="space-between" align="center">
          <Heading as="h2" size="md" color="fg.default">
            Items
          </Heading>
          <Button
            size="sm"
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            onClick={() => setCreating(true)}
          >
            Add item
          </Button>
        </HStack>
        {payload.items.length === 0 ? (
          <AdminEmptyState
            title="No items yet"
            description="Add a category, then add menu items."
          />
        ) : (
          <AdminDataTable
            columns={columns}
            rows={payload.items}
            getRowKey={(r) => r.id}
          />
        )}
      </Stack>

      <Stack gap={3}>
        <Heading as="h2" size="md" color="fg.default">
          Categories
        </Heading>
        <MenuCategoryManager categories={payload.categories} />
      </Stack>

      <Dialog.Root
        open={creating || editing !== null}
        onOpenChange={(d) => {
          if (!d.open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="640px" bg="bg" padding={5}>
            <Dialog.Header>
              <Dialog.Title>
                {editing ? `Edit: ${editing.name}` : "Add menu item"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <MenuItemForm
                categories={payload.categories}
                initial={editing}
                submitLabel={editing ? "Save changes" : "Create item"}
                onCancel={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                onSubmit={async (values: MenuItemFormValues) => {
                  const url = editing
                    ? `/api/admin/menu/items/${editing.id}`
                    : `/api/admin/menu/items`;
                  const method = editing ? "PUT" : "POST";
                  const res = await postJson(url, values, method);
                  if (!res.ok)
                    return { ok: false, error: res.error.message };
                  setCreating(false);
                  setEditing(null);
                  startTransition(() => router.refresh());
                  return { ok: true };
                }}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Stack>
  );
}
