"use client";

import { Button, HStack } from "@chakra-ui/react";
import NextLink from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";

export interface TrackingUnavailableProps {
  title?: string;
  description?: string;
}

export function TrackingUnavailable({
  title = "Tracking isn't available for this link",
  description = "The order reference may be missing, expired, or the order isn't trackable yet. Check your confirmation email for the latest link.",
}: TrackingUnavailableProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        <HStack gap={3} flexWrap="wrap" justify="center">
          <NextLink href="/menu" style={{ textDecoration: "none" }}>
            <Button
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
            >
              Browse the menu
            </Button>
          </NextLink>
          <NextLink href="/menu" style={{ textDecoration: "none" }}>
            <Button variant="outline" borderColor="border" color="fg.default">
              Start a new order
            </Button>
          </NextLink>
        </HStack>
      }
    />
  );
}
