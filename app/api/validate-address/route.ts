import { NextResponse } from "next/server";

import {
  geocodeAddressForDelivery,
  measureCoordinatesAgainstDelivery,
} from "@/lib/mapbox/geocode";
import { validateAddressInput } from "@/lib/validations/address";
import { siteConfig } from "@/lib/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
      },
      { status: 400 },
    );
  }

  const validation = validateAddressInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  // Fast path: if the client has already picked a suggestion from the
  // autocomplete dropdown, it sends lat/lng alongside the address. We can
  // skip the second Mapbox round-trip and just verify the radius.
  if (
    typeof validation.data.lat === "number" &&
    typeof validation.data.lng === "number"
  ) {
    const measurement = await measureCoordinatesAgainstDelivery({
      lat: validation.data.lat,
      lng: validation.data.lng,
    });
    if (!measurement.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: measurement.code, message: measurement.message },
        },
        { status: 500 },
      );
    }
    const message = measurement.withinRadius
      ? `Great — you're about ${measurement.milesFromRestaurant} miles away.`
      : `Sorry — that's outside our ${siteConfig.deliveryRadiusMiles}-mile delivery zone (about ${measurement.milesFromRestaurant} miles).`;
    return NextResponse.json(
      {
        ok: true,
        data: {
          address: validation.data.address,
          lat: validation.data.lat,
          lng: validation.data.lng,
          milesFromRestaurant: measurement.milesFromRestaurant,
          withinRadius: measurement.withinRadius,
          message,
        },
      },
      { status: 200 },
    );
  }

  const result = await geocodeAddressForDelivery(validation.data.address);
  if (!result.ok) {
    const status =
      result.code === "ADDRESS_NOT_FOUND" || result.code === "ADDRESS_INVALID_COORDS"
        ? 200
        : 500;
    if (status === 200) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: result.code, message: result.message },
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: result.code, message: result.message },
      },
      { status },
    );
  }

  const message = result.withinRadius
    ? `Great — you're about ${result.milesFromRestaurant} miles away.`
    : `Sorry — that's outside our ${siteConfig.deliveryRadiusMiles}-mile delivery zone (about ${result.milesFromRestaurant} miles).`;

  return NextResponse.json(
    {
      ok: true,
      data: {
        address: result.address,
        lat: result.lat,
        lng: result.lng,
        milesFromRestaurant: result.milesFromRestaurant,
        withinRadius: result.withinRadius,
        message,
      },
    },
    { status: 200 },
  );
}
