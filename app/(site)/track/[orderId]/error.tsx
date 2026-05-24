"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";

interface TrackingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TrackingError({ error, reset }: TrackingErrorProps) {
  useEffect(() => {
    console.error("[/track/[orderId]] error boundary:", error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Tracking"
      title="We hit a problem loading tracking"
      description="Please try again. If it keeps happening, your order is still being prepared — check your confirmation email."
    >
      <ErrorState
        title="Tracking unavailable right now"
        description="Try reloading the page. Your order is unaffected."
        onRetry={() => reset()}
        retryLabel="Retry"
      />
      <HStack marginTop={4} gap={3} flexWrap="wrap">
        <NextLink href="/menu" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back to menu
          </Button>
        </NextLink>
        <NextLink href="/order" style={{ textDecoration: "none" }}>
          <Button
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
          >
            Start a new order
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}
