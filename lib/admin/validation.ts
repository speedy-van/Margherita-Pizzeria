import { z } from "zod";

import type {
  ValidationFailure,
  ValidationResult,
} from "@/lib/validations/menu";
import { validateOpeningHours } from "@/lib/utils/shop-hours";
import type { OpeningHours, OrderStatus, OrderType } from "@/types/database";

/**
 * Admin validation. All inputs validated server-side before any DB write.
 * Money is integer pence. No floats.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function fail(
  message: string,
  fields?: Record<string, string>,
  code = "VALIDATION_FAILED",
  status = 400,
): ValidationFailure {
  return {
    ok: false,
    status,
    error: { code, message, ...(fields ? { fields } : {}) },
  };
}

function flatten(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) fields[path] = issue.message;
  }
  return fields;
}

export function validateUuid(
  id: string,
  fieldName = "id",
): ValidationResult<string> {
  if (!id || !UUID_RE.test(id)) {
    return fail(`Invalid ${fieldName}.`, { [fieldName]: "Invalid id." }, "INVALID_ID");
  }
  return { ok: true, data: id };
}

/* ─────────── Order status update ─────────── */

export const ADMIN_ORDER_STATUSES = [
  "received",
  "making",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
] as const;

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: [],
  received: ["making", "ready", "rejected", "cancelled"],
  making: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function canTransitionAdminOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  orderType: OrderType,
): boolean {
  if (!ORDER_TRANSITIONS[currentStatus].includes(nextStatus)) return false;
  if (orderType === "collection" && nextStatus === "out_for_delivery") return false;
  if (
    orderType === "delivery" &&
    currentStatus === "ready" &&
    nextStatus === "delivered"
  ) {
    return false;
  }
  return true;
}

export function getAdminOrderNextStatuses(
  currentStatus: OrderStatus,
  orderType: OrderType,
): OrderStatus[] {
  return ADMIN_ORDER_STATUSES.filter((status) =>
    canTransitionAdminOrderStatus(currentStatus, status, orderType),
  );
}

const orderStatusSchema = z.object({
  status: z.enum(ADMIN_ORDER_STATUSES),
});

export type AdminOrderStatusInput = z.infer<typeof orderStatusSchema>;

export function validateAdminOrderStatusInput(
  input: unknown,
): ValidationResult<AdminOrderStatusInput> {
  const parsed = orderStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid status payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

/* ─────────── Booking status update ─────────── */

export const ADMIN_BOOKING_STATUSES = [
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
] as const;

const bookingStatusSchema = z.object({
  status: z.enum(ADMIN_BOOKING_STATUSES),
});

export type AdminBookingStatusInput = z.infer<typeof bookingStatusSchema>;

export function validateAdminBookingStatusInput(
  input: unknown,
): ValidationResult<AdminBookingStatusInput> {
  const parsed = bookingStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid status payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

/* ─────────── Menu category ─────────── */

const trimmedString = (max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(max));

const createMenuCategorySchema = z.object({
  name: trimmedString(120).pipe(z.string().min(2, "Name is too short.")),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
  active: z.boolean().default(true),
});

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;

const updateMenuCategorySchema = createMenuCategorySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update.",
  });

export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;

export function validateCreateMenuCategoryInput(
  input: unknown,
): ValidationResult<CreateMenuCategoryInput> {
  const parsed = createMenuCategorySchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid category payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

export function validateUpdateMenuCategoryInput(
  input: unknown,
): ValidationResult<UpdateMenuCategoryInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = updateMenuCategorySchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid category payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

/* ─────────── Settings ─────────── */

const positiveInt = (max: number) => z.number().int().min(0).max(max);

const settingsSchema = z
  .object({
    acceptingOnlineOrders: z.boolean(),
    collectionOpen: z.boolean(),
    deliveryOpen: z.boolean(),
    busyMode: z.enum(["normal", "busy", "very_busy"]),
    minDeliveryOrderPence: positiveInt(100_000),
    deliveryFeePence: positiveInt(50_000),
    prepTimeMinutes: positiveInt(360),
    deliveryTimeMinutes: positiveInt(360),
    customerMessage: z.string().trim().max(240),
    depositEnabled: z.boolean(),
    depositAmountPence: positiveInt(50_000),
    openingHours: z.unknown(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update.",
  });

export interface AdminSettingsUpdateInput {
  acceptingOnlineOrders?: boolean;
  collectionOpen?: boolean;
  deliveryOpen?: boolean;
  busyMode?: "normal" | "busy" | "very_busy";
  minDeliveryOrderPence?: number;
  deliveryFeePence?: number;
  prepTimeMinutes?: number;
  deliveryTimeMinutes?: number;
  customerMessage?: string;
  depositEnabled?: boolean;
  depositAmountPence?: number;
  openingHours?: OpeningHours;
}

export function validateAdminSettingsInput(
  input: unknown,
): ValidationResult<AdminSettingsUpdateInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid settings payload.", flatten(parsed.error));

  const data = parsed.data;
  let openingHours: OpeningHours | undefined;
  if (typeof data.openingHours !== "undefined") {
    const validatedOpeningHours = validateOpeningHours(data.openingHours);
    if (!validatedOpeningHours) {
      return fail("Invalid settings payload.", {
        openingHours:
          "Opening hours must include every weekday with valid HH:mm open/close times. Close must be after open; use 00:00 for midnight.",
      });
    }
    openingHours = validatedOpeningHours;
  }

  const out: AdminSettingsUpdateInput = {};
  if (typeof data.acceptingOnlineOrders === "boolean")
    out.acceptingOnlineOrders = data.acceptingOnlineOrders;
  if (typeof data.collectionOpen === "boolean")
    out.collectionOpen = data.collectionOpen;
  if (typeof data.deliveryOpen === "boolean")
    out.deliveryOpen = data.deliveryOpen;
  if (data.busyMode) out.busyMode = data.busyMode;
  if (typeof data.minDeliveryOrderPence === "number")
    out.minDeliveryOrderPence = data.minDeliveryOrderPence;
  if (typeof data.deliveryFeePence === "number")
    out.deliveryFeePence = data.deliveryFeePence;
  if (typeof data.prepTimeMinutes === "number")
    out.prepTimeMinutes = data.prepTimeMinutes;
  if (typeof data.deliveryTimeMinutes === "number")
    out.deliveryTimeMinutes = data.deliveryTimeMinutes;
  if (typeof data.customerMessage === "string")
    out.customerMessage = data.customerMessage;
  if (typeof data.depositEnabled === "boolean")
    out.depositEnabled = data.depositEnabled;
  if (typeof data.depositAmountPence === "number")
    out.depositAmountPence = data.depositAmountPence;
  if (openingHours) out.openingHours = openingHours;

  return { ok: true, data: out };
}

/* ─────────── Time slot ─────────── */

const timeSlotSchema = z.object({
  type: z.enum(["collection", "booking"]),
  time: z.string().regex(HHMM_RE, "Use HH:mm."),
  active: z.boolean().default(true),
});

export type AdminTimeSlotInput = z.infer<typeof timeSlotSchema>;

const updateTimeSlotSchema = z
  .object({
    active: z.boolean().optional(),
    time: z.string().regex(HHMM_RE, "Use HH:mm.").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update.",
  });

export type AdminUpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;

export function validateAdminTimeSlotInput(
  input: unknown,
): ValidationResult<AdminTimeSlotInput> {
  const parsed = timeSlotSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid time slot payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

export function validateAdminUpdateTimeSlotInput(
  input: unknown,
): ValidationResult<AdminUpdateTimeSlotInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = updateTimeSlotSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid time slot payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

/* ─────────── Tables ─────────── */

const updateTableSchema = z
  .object({
    maxCovers: z.number().int().min(1).max(12).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update.",
  });

export type AdminUpdateTableInput = z.infer<typeof updateTableSchema>;

export function validateAdminUpdateTableInput(
  input: unknown,
): ValidationResult<AdminUpdateTableInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = updateTableSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid table payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

/* ─────────── Images ─────────── */

const updateImageSchema = z
  .object({
    label: trimmedString(120).pipe(z.string().min(1, "Label is required.")).optional(),
    section: trimmedString(80).pipe(z.string().min(1, "Section is required.")).optional(),
    url: z.string().url("Must be a valid URL.").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update.",
  });

export type AdminUpdateImageInput = z.infer<typeof updateImageSchema>;

export function validateAdminUpdateImageInput(
  input: unknown,
): ValidationResult<AdminUpdateImageInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = updateImageSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid image payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

const createImageSchema = z.object({
  label: trimmedString(120).pipe(z.string().min(1, "Label is required.")),
  section: trimmedString(80).pipe(z.string().min(1, "Section is required.")),
  url: z.string().max(2048).optional(),
});

export type AdminCreateImageInput = z.infer<typeof createImageSchema>;

export function validateAdminCreateImageInput(
  input: unknown,
): ValidationResult<AdminCreateImageInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = createImageSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid image payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}
