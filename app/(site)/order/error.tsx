"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";

interface OrderErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OrderError({ error, reset }: OrderErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[/order] error boundary:", error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Order"
      title="We hit a problem with the order page"
      description="Please try again. If it keeps happening, get in touch."
    >
      <ErrorState
        title="Order page unavailable right now"
        description="Try reloading. If this keeps happening, you can still order by phone."
        onRetry={() => reset()}
        retryLabel="Retry"
      />
      <HStack marginTop={4} gap={3}>
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back to menu
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}
