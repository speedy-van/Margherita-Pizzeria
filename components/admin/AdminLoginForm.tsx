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
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }
      router.replace(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
      router.refresh();
    } catch {
      setError("Could not sign in. Please try again.");
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
            Staff sign-in
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Authorised staff only. Activity is logged.
          </Text>
        </Stack>
        <form onSubmit={onSubmit} noValidate>
          <Stack gap={4}>
            <Field.Root required>
              <Field.Label>Email</Field.Label>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Password</Field.Label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              loadingText="Signing in..."
              disabled={busy}
            >
              Sign in
            </Button>
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              <NextLink
                href="/admin/forgot-password"
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                Forgot password?
              </NextLink>
            </Text>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}
