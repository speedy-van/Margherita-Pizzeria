"use client";

import {
  Box,
  Container,
  HStack,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingCoversStep } from "@/components/booking/BookingCoversStep";
import { BookingCustomerStep, type BookingCustomerDetails } from "@/components/booking/BookingCustomerStep";
import { BookingDateStep } from "@/components/booking/BookingDateStep";
import { BookingDepositStep } from "@/components/booking/BookingDepositStep";
import { BookingSubmitBar } from "@/components/booking/BookingSubmitBar";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { BookingTimeSlotGrid } from "@/components/booking/BookingTimeSlotGrid";
import type {
  BookingAvailabilityResponse,
  BookingSettings,
  CreateBookingResponse,
} from "@/lib/bookings/types";
import { formatGBPFromPence } from "@/lib/utils/currency";

export interface BookingPageClientProps {
  initialSettings: BookingSettings;
  initialDate: string;
  minDate: string;
  maxDate: string;
}

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

const DEFAULT_COVERS = 2;

export function BookingPageClient({
  initialSettings,
  initialDate,
  minDate,
  maxDate,
}: BookingPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  const [date, setDate] = useState<string>(initialDate);
  const [covers, setCovers] = useState<number>(DEFAULT_COVERS);
  const [availability, setAvailability] =
    useState<BookingAvailabilityResponse | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [customer, setCustomer] = useState<BookingCustomerDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [payDeposit, setPayDeposit] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSelectedTimeSlot(null);
    setAvailability(null);
    setAvailabilityError(null);

    if (!date) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setAvailabilityLoading(true);
    fetch(
      `/api/bookings/availability?date=${encodeURIComponent(date)}&covers=${covers}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        const body = (await res.json()) as ApiEnvelope<BookingAvailabilityResponse>;
        if (!body.ok || !body.data) {
          throw new Error(body.error?.message ?? "Failed to load availability.");
        }
        setAvailability(body.data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load availability.";
        setAvailabilityError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAvailabilityLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [date, covers]);

  const customerErrors = useMemo(() => {
    const errs: Partial<Record<keyof BookingCustomerDetails, string>> = {};
    if (customer.name && customer.name.trim().length < 2) {
      errs.name = "Please enter your full name.";
    }
    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email.trim())) {
      errs.email = "Please enter a valid email.";
    }
    if (customer.phone && customer.phone.trim().length < 7) {
      errs.phone = "Please enter a valid phone number.";
    }
    return errs;
  }, [customer]);

  const customerComplete =
    customer.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(customer.email.trim()) &&
    customer.phone.trim().length >= 7 &&
    Object.keys(customerErrors).length === 0;

  const canSubmit =
    Boolean(date) &&
    Boolean(selectedTimeSlot) &&
    covers >= 1 &&
    customerComplete &&
    !submitting;

  const disabledReason = !date
    ? "Pick a date."
    : !selectedTimeSlot
      ? "Choose an available time."
      : !customerComplete
        ? "Add your name, email and phone."
        : undefined;

  const submitLabel = useMemo(() => {
    if (
      initialSettings.depositEnabled &&
      payDeposit &&
      initialSettings.depositAmountPence > 0
    ) {
      return `Pay ${formatGBPFromPence(initialSettings.depositAmountPence)} & request table`;
    }
    return "Request booking";
  }, [initialSettings.depositAmountPence, initialSettings.depositEnabled, payDeposit]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !selectedTimeSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          timeSlot: selectedTimeSlot,
          covers,
          customerName: customer.name.trim(),
          customerEmail: customer.email.trim(),
          customerPhone: customer.phone.trim(),
          payDeposit,
        }),
      });
      const body = (await res.json()) as CreateBookingResponse;
      if (!body.ok) {
        throw new Error(body.error?.message ?? "Couldn't create booking.");
      }
      if (body.data.paymentRequired) {
        window.location.href = body.data.checkoutUrl;
        return;
      }
      router.push(body.data.redirectUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Couldn't create booking.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, covers, customer, date, payDeposit, router, selectedTimeSlot]);

  const slots = availability?.slots ?? [];

  return (
    <Container maxW="5xl" paddingBlock={{ base: 6, md: 10 }}>
      <Stack gap={{ base: 6, md: 8 }}>
        <Stack gap={2}>
          <Heading as="h1" size={{ base: "lg", md: "xl" }} color="fg.default">
            Book a table
          </Heading>
          <Text color="fg.muted" maxW="2xl">
            Reserve one of our six tables. Pick a date, time, party size and
            we&apos;ll confirm by email.
          </Text>
        </Stack>

        {cancelled ? (
          <Box
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            bg="bg.subtle"
            padding={4}
          >
            <Text fontSize="sm" color="fg.default">
              Payment cancelled. Your booking was not submitted — adjust your
              details and try again.
            </Text>
          </Box>
        ) : null}

        <HStack
          align="flex-start"
          gap={{ base: 6, md: 8 }}
          flexDirection={{ base: "column", lg: "row" }}
          width="full"
        >
          <Stack gap={6} flex="1" width="full">
            <BookingDateStep
              value={date}
              onChange={setDate}
              minDate={minDate}
              maxDate={maxDate}
            />
            <BookingCoversStep value={covers} onChange={setCovers} />

            <Stack gap={3}>
              <Heading as="h2" size="sm" color="fg.default">
                Pick a time
              </Heading>
              {availabilityError ? (
                <Box
                  role="alert"
                  borderWidth="1px"
                  borderColor="brand.solid"
                  borderRadius="lg"
                  bg="bg.subtle"
                  padding={3}
                >
                  <Text fontSize="sm" color="fg.default">
                    {availabilityError}
                  </Text>
                </Box>
              ) : null}
              <BookingTimeSlotGrid
                loading={availabilityLoading}
                slots={slots}
                selected={selectedTimeSlot}
                onSelect={setSelectedTimeSlot}
              />
            </Stack>

            <Stack gap={3}>
              <Heading as="h2" size="sm" color="fg.default">
                Your details
              </Heading>
              <BookingCustomerStep
                value={customer}
                onChange={setCustomer}
                errors={customerErrors}
              />
            </Stack>

            <Stack gap={3}>
              <Heading as="h2" size="sm" color="fg.default">
                Deposit
              </Heading>
              <BookingDepositStep
                depositEnabled={initialSettings.depositEnabled}
                depositAmountPence={initialSettings.depositAmountPence}
                payDeposit={payDeposit}
                onChange={setPayDeposit}
              />
            </Stack>
          </Stack>

          <Box width={{ base: "full", lg: "360px" }} flexShrink={0}>
            <Stack gap={4} position={{ lg: "sticky" }} top={{ lg: 6 }}>
              <BookingSummaryCard
                date={date}
                timeSlot={selectedTimeSlot}
                covers={covers}
                depositEnabled={initialSettings.depositEnabled}
                depositAmountPence={initialSettings.depositAmountPence}
                payDeposit={payDeposit}
              />
              {submitError ? (
                <Box
                  role="alert"
                  borderWidth="1px"
                  borderColor="brand.solid"
                  borderRadius="lg"
                  bg="bg.subtle"
                  padding={3}
                >
                  <Text fontSize="sm" color="fg.default">
                    {submitError}
                  </Text>
                </Box>
              ) : null}
            </Stack>
          </Box>
        </HStack>

        <BookingSubmitBar
          disabled={!canSubmit}
          disabledReason={disabledReason}
          loading={submitting}
          submitLabel={submitLabel}
          onSubmit={handleSubmit}
        />
      </Stack>
    </Container>
  );
}
