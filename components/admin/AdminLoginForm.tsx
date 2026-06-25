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
import NextImage from "next/image";
import NextLink from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
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
        <Stack gap={2} alignItems="center" textAlign="center">
          <NextImage
            src="/logo.png"
            alt="Margherita Pizza"
            width={72}
            height={72}
            priority
            style={{ borderRadius: "14px", objectFit: "cover" }}
          />
          <Heading as="h1" fontFamily="heading" fontSize="2xl" color="fg.default">
            Staff sign in
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Authorised staff only. Activity is logged.
          </Text>
        </Stack>
        <form onSubmit={onSubmit} noValidate>
          <Stack gap={4}>
            <Field.Root id="login-email" required>
              <Field.Label htmlFor="login-email">Email</Field.Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="you@margheritapizza.uk"
              />
            </Field.Root>
            <Field.Root id="login-password" required>
              <Field.Label htmlFor="login-password">Password</Field.Label>
              <Input
                id="login-password"
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
