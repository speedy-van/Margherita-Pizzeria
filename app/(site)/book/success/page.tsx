import { Container, Stack } from "@chakra-ui/react";
import type { Metadata } from "next";

import { BookingSuccessPanel } from "@/components/booking/BookingSuccessPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { getPublicBookingSummary } from "@/lib/bookings/queries";
import { validateBookingId } from "@/lib/bookings/validation";
import { createPageMetadata } from "@/lib/seo/metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Booking received",
  description: "Your booking request has been received.",
  path: "/book/success",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{ bookingId?: string; session_id?: string }>;
}

export default async function BookSuccessPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;
  if (!bookingId) {
    return (
      <PageShell
        eyebrow="Booking"
        title="No booking reference"
        description="We couldn't find a booking reference in the URL."
      >
        <EmptyState
          title="Missing booking ID"
          description="If you've just made a booking, please use the link from your confirmation email."
        />
      </PageShell>
    );
  }

  const idCheck = validateBookingId(bookingId);
  if (!idCheck.ok) {
    return (
      <PageShell
        eyebrow="Booking"
        title="Invalid booking reference"
        description="The booking reference in the URL is not valid."
      >
        <EmptyState
          title="Invalid reference"
          description="Please check the link from your confirmation email."
        />
      </PageShell>
    );
  }

  try {
    const summary = await getPublicBookingSummary(idCheck.data.id);
    if (!summary) {
      return (
        <PageShell
          eyebrow="Booking"
          title="Booking not found"
          description="We couldn't find that booking."
        >
          <EmptyState
            title="Not found"
            description="The booking may have been removed, or the link is incorrect."
          />
        </PageShell>
      );
    }
    return (
      <Container maxW="3xl" paddingBlock={{ base: 6, md: 10 }}>
        <Stack gap={6}>
          <BookingSuccessPanel booking={summary} />
        </Stack>
      </Container>
    );
  } catch {
    return (
      <PageShell
        eyebrow="Booking"
        title="Couldn't load your booking"
        description="Please try again in a moment."
      >
        <ErrorState
          title="Something went wrong"
          description="If this keeps happening, please contact us."
        />
      </PageShell>
    );
  }
}
