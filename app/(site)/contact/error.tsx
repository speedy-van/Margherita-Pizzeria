"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";

interface ContactErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ContactError({ error, reset }: ContactErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[/contact] error boundary:", error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Contact"
      title="We hit a problem loading the contact page"
      description="Please try again. If it keeps happening, you can still reach us via the order or booking pages."
    >
      <ErrorState
        title="Contact page unavailable right now"
        description="Try reloading. If this keeps happening, please try again shortly."
        onRetry={() => reset()}
        retryLabel="Retry"
      />
      <HStack marginTop={4} gap={3}>
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back home
          </Button>
        </NextLink>
        <NextLink href="/faq" style={{ textDecoration: "none" }}>
          <Button variant="ghost" color="fg.default">
            Visit the FAQ
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}
