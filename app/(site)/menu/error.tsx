"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";

interface MenuErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MenuError({ error, reset }: MenuErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[/menu] error boundary:", error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Menu"
      title="We couldn't load the menu"
      description="Something went wrong while reaching our kitchen system."
    >
      <ErrorState
        title="Menu unavailable right now"
        description="Please try again in a moment. If it keeps happening, get in touch and we'll sort it."
        onRetry={() => reset()}
        retryLabel="Retry"
      />
      <HStack marginTop={4} gap={3}>
        <NextLink href="/" style={{ textDecoration: "none" }}>
          <Button variant="outline" borderColor="border" color="fg.default">
            Back to home
          </Button>
        </NextLink>
      </HStack>
    </PageShell>
  );
}
