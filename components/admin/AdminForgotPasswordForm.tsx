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
import { useState } from "react";

interface ApiOk {
  ok: true;
  data: { message: string };
}
interface ApiErr {
  ok: false;
  error: { code: string; message: string };
}
type ApiResponse = ApiOk | ApiErr;

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setDone(json.data.message);
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
            Forgot password
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Enter your admin email and we&apos;ll send a reset link.
          </Text>
        </Stack>
        {done ? (
          <Stack gap={3}>
            <Text role="status" color="fg.default" fontSize="sm">
              {done}
            </Text>
            <NextLink
              href="/admin/login"
              style={{ color: "inherit", textDecoration: "underline", fontSize: "0.875rem" }}
            >
              Back to sign in
            </NextLink>
          </Stack>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <Stack gap={4}>
              <Field.Root required>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                loadingText="Sending..."
                disabled={busy}
              >
                Send reset link
              </Button>
              <Text fontSize="sm" color="fg.muted" textAlign="center">
                <NextLink
                  href="/admin/login"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  Back to sign in
                </NextLink>
              </Text>
            </Stack>
          </form>
        )}
      </Stack>
    </Box>
  );
}
