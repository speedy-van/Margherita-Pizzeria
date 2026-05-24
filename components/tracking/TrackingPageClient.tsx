"use client";

import { SimpleGrid, Stack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { TrackingMap } from "@/components/tracking/TrackingMap";
import { TrackingStatusCard } from "@/components/tracking/TrackingStatusCard";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import type {
  PublicTrackingSummary,
  TrackingApiResponse,
  TrackingOrderStatus,
} from "@/lib/tracking/types";

const POLL_INTERVAL_MS = 10_000;

const TERMINAL_STATUSES: ReadonlySet<TrackingOrderStatus> = new Set([
  "delivered",
  "cancelled",
  "rejected",
]);

function isTerminal(status: TrackingOrderStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export interface TrackingPageClientProps {
  initialSummary: PublicTrackingSummary;
}

export function TrackingPageClient({ initialSummary }: TrackingPageClientProps) {
  const [summary, setSummary] = useState<PublicTrackingSummary>(initialSummary);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkWarning, setNetworkWarning] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const refreshOnce = useCallback(async (orderId: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/track`, {
        signal: controller.signal,
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      const json = (await res.json()) as TrackingApiResponse;
      if (!mountedRef.current) return;
      if (json.ok) {
        setSummary(json.data);
        setNetworkWarning(false);
      } else {
        setNetworkWarning(true);
      }
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }
      if (mountedRef.current) setNetworkWarning(true);
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
        setLastCheckedAt(new Date());
      }
    }
  }, []);

  const scheduleNext = useCallback(
    (orderId: string) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        if (typeof document !== "undefined" && document.hidden) return;
        await refreshOnce(orderId);
        if (mountedRef.current && !isTerminal(summary.status)) {
          scheduleNext(orderId);
        }
      }, POLL_INTERVAL_MS);
    },
    [refreshOnce, summary.status],
  );

  // Polling lifecycle
  useEffect(() => {
    mountedRef.current = true;
    const orderId = summary.orderId;

    if (isTerminal(summary.status)) {
      stopPolling();
      return () => {
        mountedRef.current = false;
        stopPolling();
      };
    }

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediate refresh on becoming visible, then resume schedule.
        void refreshOnce(orderId).then(() => {
          if (mountedRef.current && !isTerminal(summary.status)) {
            scheduleNext(orderId);
          }
        });
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    // Kick off polling
    scheduleNext(orderId);

    return () => {
      mountedRef.current = false;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      stopPolling();
    };
    // Only re-bind when terminal status flips or order id changes.
  }, [summary.orderId, summary.status, refreshOnce, scheduleNext, stopPolling]);

  return (
    <Stack gap={{ base: 6, md: 8 }}>
      {summary.type === "delivery" ? (
        <TrackingMap summary={summary} />
      ) : null}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 6, lg: 6 }}>
        <TrackingStatusCard
          summary={summary}
          lastCheckedAt={lastCheckedAt}
          isRefreshing={isRefreshing}
          networkWarning={networkWarning}
        />
        <TrackingTimeline summary={summary} />
      </SimpleGrid>
    </Stack>
  );
}
