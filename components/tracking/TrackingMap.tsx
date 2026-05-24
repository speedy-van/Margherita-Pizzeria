"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import {
  createDestinationPinElement,
  createDriverPinElement,
} from "@/components/tracking/DriverPin";
import { TrackingUnavailable } from "@/components/tracking/TrackingUnavailable";
import type { PublicTrackingSummary } from "@/lib/tracking/types";

type MapboxModule = typeof import("mapbox-gl");
type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;

export interface TrackingMapProps {
  summary: PublicTrackingSummary;
  height?: string;
}

const FALLBACK_CENTER: [number, number] = [-4.2169, 55.8717]; // 652 Alexandra Parade

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function TrackingMap({ summary, height = "360px" }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<MapboxModule | null>(null);
  const destMarkerRef = useRef<MapboxMarker | null>(null);
  const driverMarkerRef = useRef<MapboxMarker | null>(null);
  const driverCoordsRef = useRef<[number, number] | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  // Init map once
  useEffect(() => {
    if (!token) return;
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = token;
        mapboxRef.current = { default: mapboxgl } as unknown as MapboxModule;

        const initialCenter: [number, number] =
          summary.destination.lng !== null && summary.destination.lat !== null
            ? [summary.destination.lng, summary.destination.lat]
            : FALLBACK_CENTER;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: initialCenter,
          zoom: 13,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.on("load", () => {
          if (cancelled) return;
          setMapReady(true);
        });

        map.on("error", (e: { error?: { message?: string } }) => {
          console.error("[TrackingMap] mapbox error:", e?.error?.message ?? e);
        });

        mapRef.current = map;
      } catch (err: unknown) {
        console.error("[TrackingMap] init failed:", err);
        if (!cancelled) setLoadError("Map failed to load.");
      }
    })();

    return () => {
      cancelled = true;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      destMarkerRef.current?.remove();
      driverMarkerRef.current?.remove();
      destMarkerRef.current = null;
      driverMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // Map lifecycle is tied to mount only; markers update in subsequent effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Destination marker
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current?.default;
    if (!map || !mapbox || !mapReady) return;

    const destLat = summary.destination.lat;
    const destLng = summary.destination.lng;
    if (destLat === null || destLng === null) {
      destMarkerRef.current?.remove();
      destMarkerRef.current = null;
      return;
    }

    if (!destMarkerRef.current) {
      destMarkerRef.current = new mapbox.Marker({
        element: createDestinationPinElement(),
      })
        .setLngLat([destLng, destLat])
        .addTo(map);
    } else {
      destMarkerRef.current.setLngLat([destLng, destLat]);
    }
  }, [
    mapReady,
    summary.destination.lat,
    summary.destination.lng,
  ]);

  // Driver marker + animation
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current?.default;
    if (!map || !mapbox || !mapReady) return;

    const driver = summary.driverLocation;
    if (!driver) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      driverCoordsRef.current = null;
      return;
    }

    const target: [number, number] = [driver.lng, driver.lat];

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapbox.Marker({
        element: createDriverPinElement(),
      })
        .setLngLat(target)
        .addTo(map);
      driverCoordsRef.current = target;
    } else {
      const from = driverCoordsRef.current ?? target;
      if (prefersReducedMotion()) {
        driverMarkerRef.current.setLngLat(target);
        driverCoordsRef.current = target;
      } else {
        const start = performance.now();
        const duration = 600;
        const marker = driverMarkerRef.current;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const lng = from[0] + (target[0] - from[0]) * eased;
          const lat = from[1] + (target[1] - from[1]) * eased;
          marker.setLngLat([lng, lat]);
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(step);
          } else {
            driverCoordsRef.current = target;
            animFrameRef.current = null;
          }
        };
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
        }
        animFrameRef.current = requestAnimationFrame(step);
      }
    }
  }, [
    mapReady,
    summary.driverLocation,
  ]);

  // Fit bounds when both points known, else center on destination
  useEffect(() => {
    const map = mapRef.current;
    const mapbox = mapboxRef.current?.default;
    if (!map || !mapbox || !mapReady) return;

    const dest = summary.destination;
    const driver = summary.driverLocation;

    if (
      dest.lat !== null &&
      dest.lng !== null &&
      driver
    ) {
      const bounds = new mapbox.LngLatBounds(
        [dest.lng, dest.lat],
        [dest.lng, dest.lat],
      );
      bounds.extend([driver.lng, driver.lat]);
      map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 600 });
    } else if (dest.lat !== null && dest.lng !== null) {
      map.easeTo({ center: [dest.lng, dest.lat], zoom: 14, duration: 400 });
    }
  }, [
    mapReady,
    summary.destination,
    summary.driverLocation,
  ]);

  if (!token) {
    return (
      <TrackingUnavailable
        title="Live map unavailable"
        description="The map can't be displayed right now. You can still follow your order status below."
      />
    );
  }

  if (loadError) {
    return (
      <TrackingUnavailable
        title="Live map unavailable"
        description={loadError}
      />
    );
  }

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border"
      bg="bg.muted"
      position="relative"
    >
      <Box ref={containerRef} height={height} width="100%" />
      {!mapReady ? (
        <Box
          position="absolute"
          inset="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Text fontSize="sm" color="fg.muted">
            Loading map…
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
