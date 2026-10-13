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
const MAX_RETRY_DELAY_MS = 60_000;

const TERMINAL_STATUSES: ReadonlySet<TrackingOrderStatus> = new Set([
  "delivered",
  "cancelled",
  "rejected",
]);

function isTerminal(status: TrackingOrderStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return null;
  return Math.max(0, dateMs - Date.now());
}

function retryDelayMs(failureCount: number, retryAfterMs: number | null): number {
  if (retryAfterMs != null) return Math.ceil(retryAfterMs);
  const attempts = Math.max(0, failureCount - 1);
  const base = Math.min(MAX_RETRY_DELAY_MS, POLL_INTERVAL_MS * 2 ** attempts);
  const jitter = Math.floor(base * 0.2 * Math.random());
  return Math.min(MAX_RETRY_DELAY_MS, base + jitter);
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
  const inFlightRef = useRef(false);
  const failureCountRef = useRef(0);
  const nextAllowedAtRef = useRef(0);
  const statusRef = useRef(initialSummary.status);

  useEffect(() => {
    statusRef.current = summary.status;
  }, [summary.status]);

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

  const refreshOnce = useCallback(async (
    orderId: string,
  ): Promise<TrackingOrderStatus | null> => {
    if (inFlightRef.current) return null;
    inFlightRef.current = true;
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
      if (!mountedRef.current) return null;
      if (json.ok) {
        failureCountRef.current = 0;
        nextAllowedAtRef.current = 0;
        setSummary(json.data);
        statusRef.current = json.data.status;
        setNetworkWarning(false);
        return json.data.status;
      } else {
        failureCountRef.current += 1;
        nextAllowedAtRef.current =
          Date.now() +
          retryDelayMs(
            failureCountRef.current,
            res.status === 429 ? parseRetryAfterMs(res.headers.get("retry-after")) : null,
          );
        setNetworkWarning(true);
      }
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return null;
      }
      if (mountedRef.current) {
        failureCountRef.current += 1;
        nextAllowedAtRef.current =
          Date.now() + retryDelayMs(failureCountRef.current, null);
        setNetworkWarning(true);
      }
    } finally {
      inFlightRef.current = false;
      if (abortRef.current === controller) abortRef.current = null;
      if (mountedRef.current) {
        setIsRefreshing(false);
        setLastCheckedAt(new Date());
      }
    }
    return null;
  }, []);

  const scheduleNext = useCallback(
    (orderId: string) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      const delayMs = Math.max(
        POLL_INTERVAL_MS,
        nextAllowedAtRef.current - Date.now(),
      );
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        if (typeof document !== "undefined" && document.hidden) return;
        const nextStatus = await refreshOnce(orderId);
        const currentStatus = nextStatus ?? statusRef.current;
        if (mountedRef.current && !isTerminal(currentStatus)) {
          scheduleNext(orderId);
        }
      }, delayMs);
    },
    [refreshOnce],
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
        void refreshOnce(orderId).then((nextStatus) => {
          const currentStatus = nextStatus ?? statusRef.current;
          if (mountedRef.current && !isTerminal(currentStatus)) {
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
