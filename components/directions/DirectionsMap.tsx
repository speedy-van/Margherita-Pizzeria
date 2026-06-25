"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { restaurantLocation } from "@/lib/config/site";
import { directionsContent } from "@/lib/content/directions";

type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;

const CENTER: [number, number] = [
  restaurantLocation.longitude,
  restaurantLocation.latitude,
];

const PULSE_STYLE_ID = "directions-map-pulse";

function injectPulseStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PULSE_STYLE_ID;
  style.textContent = `
@keyframes directions-radar-pulse {
  0% { transform: scale(0.4); opacity: 0.7; }
  100% { transform: scale(3.2); opacity: 0; }
}`;
  document.head.appendChild(style);
}

function createMarkerElement(): HTMLDivElement {
  injectPulseStyles();

  const wrap = document.createElement("div");
  wrap.style.position = "relative";
  wrap.style.width = "20px";
  wrap.style.height = "20px";

  // Staggered radar pulse — two concentric rings expanding and fading.
  for (const delay of ["0s", "0.8s"]) {
    const ring = document.createElement("div");
    ring.style.position = "absolute";
    ring.style.inset = "0";
    ring.style.borderRadius = "50%";
    ring.style.border = "2px solid rgba(192, 57, 43, 0.6)";
    ring.style.background = "rgba(192, 57, 43, 0.25)";
    ring.style.animation = "directions-radar-pulse 1.6s ease-out infinite";
    ring.style.animationDelay = delay;
    wrap.appendChild(ring);
  }

  const dot = document.createElement("div");
  dot.style.position = "absolute";
  dot.style.inset = "0";
  dot.style.borderRadius = "50%";
  dot.style.background = "#C0392B";
  dot.style.border = "2px solid #fff";
  dot.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
  wrap.appendChild(dot);

  return wrap;
}

export function DirectionsMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const [loadError, setLoadError] = useState(false);

  const addr = directionsContent.address;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  useEffect(() => {
    if (!token || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: CENTER,
          zoom: 15,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        markerRef.current = new mapboxgl.Marker({ element: createMarkerElement() })
          .setLngLat(CENTER)
          .addTo(map);

        map.on("load", () => {
          map.resize();
        });

        map.on("error", (e: { error?: { message?: string } }) => {
          console.error("[DirectionsMap] mapbox error:", e?.error?.message ?? e);
        });

        mapRef.current = map;
      } catch (err: unknown) {
        console.error("[DirectionsMap] init failed:", err);
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  return (
    <Box
      as="section"
      position="relative"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      bg="bg.subtle"
      height={{ base: "320px", md: "420px" }}
    >
      {token && !loadError ? (
        <Box
          ref={containerRef}
          position="absolute"
          inset={0}
          height="100%"
          width="100%"
          css={{
            "& .mapboxgl-ctrl-logo": { opacity: 0.6 },
            "& .mapboxgl-canvas": { outline: "none" },
          }}
        />
      ) : (
        <Box
          aria-hidden
          position="absolute"
          inset={0}
          opacity={0.5}
          backgroundImage="radial-gradient(circle at 30% 30%, rgba(192,57,43,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(230,126,34,0.18), transparent 60%), linear-gradient(135deg, #161210 0%, #1A1A1A 100%)"
        />
      )}

      <Stack
        position="absolute"
        bottom={0}
        left={0}
        gap={2}
        align="flex-start"
        padding={{ base: 5, md: 6 }}
        maxW={{ base: "100%", md: "360px" }}
        bg="rgba(15, 12, 11, 0.82)"
        borderTopRightRadius="2xl"
        backdropFilter="blur(4px)"
        pointerEvents="none"
      >
        <Text
          textTransform="uppercase"
          letterSpacing="0.2em"
          fontSize="xs"
          color="brand.fg"
          fontWeight="700"
        >
          You&apos;ll find us at
        </Text>
        <Heading as="h2" size={{ base: "md", md: "lg" }} color="fg.default" fontFamily="heading">
          {addr.line}
        </Heading>
        <Text color="fg.muted">
          {addr.city}, {addr.postcode}
          <br />
          {addr.country}
        </Text>
      </Stack>
    </Box>
  );
}
