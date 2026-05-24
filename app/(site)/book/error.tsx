"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";

interface BookErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BookError({ error, reset }: BookErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[/book] error boundary:", error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Booking"
      title="We hit a problem with the booking page"
      description="Please try again. If it keeps happening, get in touch."
    >
      <ErrorState
        title="Booking page unavailable right now"
        description="Try reloading. If this keeps happening, please contact us."
        onRetry={() => reset()}
        retryLabel="Retry"
      />
      <HStack marginTop={4} gap={3}>
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back home
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}
