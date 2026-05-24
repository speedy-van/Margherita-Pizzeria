import type {
  TrackingCoordinates,
  UpdateDriverLocationInput,
} from "@/lib/tracking/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

export function validateOrderId(id: string): ValidationResult<string> {
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return {
      ok: false,
      error: { code: "INVALID_ID", message: "Invalid order id." },
    };
  }
  return { ok: true, value: id };
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function validateDriverLocationInput(
  input: unknown,
): ValidationResult<UpdateDriverLocationInput> {
  if (!input || typeof input !== "object") {
    return {
      ok: false,
      error: {
        code: "INVALID_BODY",
        message: "Expected JSON body with lat and lng.",
      },
    };
  }

  const obj = input as { lat?: unknown; lng?: unknown };
  const fields: Record<string, string> = {};

  if (!isFiniteNumber(obj.lat)) {
    fields.lat = "lat must be a finite number.";
  } else if (obj.lat < -90 || obj.lat > 90) {
    fields.lat = "lat must be between -90 and 90.";
  }

  if (!isFiniteNumber(obj.lng)) {
    fields.lng = "lng must be a finite number.";
  } else if (obj.lng < -180 || obj.lng > 180) {
    fields.lng = "lng must be between -180 and 180.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_COORDINATES",
        message: "Invalid driver coordinates.",
        fields,
      },
    };
  }

  const coords: TrackingCoordinates = {
    lat: obj.lat as number,
    lng: obj.lng as number,
  };
  return { ok: true, value: coords };
}
