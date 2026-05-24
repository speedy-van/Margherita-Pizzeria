"use client";

import {
  Box,
  Button,
  Field,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminImage } from "@/lib/admin/types";

export interface ImageUrlFormProps {
  image: AdminImage;
}

export function ImageUrlForm({ image }: ImageUrlFormProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [url, setUrl] = useState(image.url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setOkMsg(null);
    try {
      new URL(url);
    } catch {
      setError("Enter a valid URL.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/images/${image.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setOkMsg("Saved.");
      startTransition(() => router.refresh());
    } catch {
      setError("Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap={2}>
      <HStack gap={2} flexWrap="wrap" align="flex-end">
        <Field.Root flex="1" minW="240px">
          <Field.Label>URL</Field.Label>
          <Input
            size="sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
            placeholder="https://…"
          />
        </Field.Root>
        <Button
          size="sm"
          onClick={save}
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.emphasized" }}
          loading={busy}
          disabled={busy}
        >
          Save
        </Button>
      </HStack>
      {error ? (
        <Text role="alert" fontSize="xs" color="red.700">
          {error}
        </Text>
      ) : null}
      {okMsg ? (
        <Text fontSize="xs" color="green.700">
          {okMsg}
        </Text>
      ) : null}
      {url ? (
        <Box>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={image.label}
            style={{
              maxHeight: 120,
              borderRadius: 8,
              border: "1px solid var(--chakra-colors-border)",
            }}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
