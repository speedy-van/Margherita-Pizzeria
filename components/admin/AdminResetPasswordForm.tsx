"use client";

import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ApiOk {
  ok: true;
  data: { message: string };
}
interface ApiErr {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}
type ApiResponse = ApiOk | ApiErr;

export interface AdminResetPasswordFormProps {
  token: string;
}

export function AdminResetPasswordForm({ token }: AdminResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <Box
        maxW="420px"
        width="100%"
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        padding={{ base: 6, md: 8 }}
      >
        <Stack gap={3}>
          <Heading as="h1" fontFamily="heading" fontSize="2xl" color="fg.default">
            Reset link invalid
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            The reset link is missing a token. Request a new one.
          </Text>
          <NextLink
            href="/admin/forgot-password"
            style={{ color: "inherit", textDecoration: "underline", fontSize: "0.875rem" }}
          >
            Request a new reset link
          </NextLink>
        </Stack>
      </Box>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setDone(json.data.message);
      window.setTimeout(() => router.replace("/admin/login"), 1500);
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      maxW="420px"
      width="100%"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      padding={{ base: 6, md: 8 }}
    >
      <Stack gap={5}>
        <Stack gap={1.5}>
          <Heading as="h1" fontFamily="heading" fontSize="2xl" color="fg.default">
            Choose a new password
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Pick a strong password you don&apos;t use anywhere else.
          </Text>
        </Stack>
        {done ? (
          <Text role="status" color="fg.default" fontSize="sm">
            {done} Redirecting to sign in…
          </Text>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Stack gap={4}>
              <Field.Root required>
                <Field.Label>New password</Field.Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Confirm password</Field.Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={busy}
                />
              </Field.Root>
              {error ? (
                <Text role="alert" color="red.700" fontSize="sm">
                  {error}
                </Text>
              ) : null}
              <Button
                type="submit"
                bg="brand.solid"
                color="brand.contrast"
                _hover={{ bg: "brand.emphasized" }}
                loading={busy}
                loadingText="Saving..."
                disabled={busy}
              >
                Save password
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Box>
  );
}
