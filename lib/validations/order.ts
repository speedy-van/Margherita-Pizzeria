import { z } from "zod";

import type { CreateOrderInput } from "@/lib/orders/types";

import type {
  ValidationFailure,
  ValidationResult,
} from "@/lib/validations/menu";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Reasonably permissive email — keep server-side parsing only.
const emailSchema = z
  .string()
  .trim()
  .min(5, "Email is too short")
  .max(255, "Email is too long")
  .email("Enter a valid email");

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(40, "Phone number is too long");

const finiteNumber = (label: string) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .refine((v) => Number.isFinite(v), `${label} must be a finite number`);

const cartItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item id"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(20, "Quantity is too large"),
});

const baseSchema = z.object({
  type: z.enum(["delivery", "collection"]),
  customerName: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(160, "Name is too long"),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  paymentMethod: z.enum(["stripe_card", "cash_on_delivery"]),
  cartItems: z
    .array(cartItemSchema)
    .min(1, "Cart cannot be empty")
    .max(50, "Cart has too many items"),
  deliveryAddress: z.string().trim().min(5).max(300).optional(),
  deliveryLat: finiteNumber("Latitude").optional(),
  deliveryLng: finiteNumber("Longitude").optional(),
  collectionTime: z.string().trim().min(1).max(80).optional(),
  discountCode: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : undefined)),
});

function flattenFieldErrors(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

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

export function validateCreateOrderInput(
  input: unknown,
): ValidationResult<CreateOrderInput> {
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Invalid order payload.", flattenFieldErrors(parsed.error));
  }

  const data = parsed.data;
  const fields: Record<string, string> = {};

  if (data.type === "delivery") {
    if (!data.deliveryAddress || data.deliveryAddress.length < 5) {
      fields.deliveryAddress = "Delivery address is required";
    }
    if (typeof data.deliveryLat !== "number") {
      fields.deliveryLat = "Delivery latitude is required";
    } else if (data.deliveryLat < -90 || data.deliveryLat > 90) {
      fields.deliveryLat = "Invalid latitude";
    }
    if (typeof data.deliveryLng !== "number") {
      fields.deliveryLng = "Delivery longitude is required";
    } else if (data.deliveryLng < -180 || data.deliveryLng > 180) {
      fields.deliveryLng = "Invalid longitude";
    }
  } else {
    // collection
    if (!data.collectionTime) {
      fields.collectionTime = "Choose a collection time";
    } else if (data.collectionTime !== "asap" && !HHMM.test(data.collectionTime)) {
      fields.collectionTime = "Invalid collection time";
    }
  }

  if (Object.keys(fields).length > 0) {
    return fail("Some fields need attention.", fields);
  }

  // Build clean typed output. Cast through zod-parsed `data`.
  const out: CreateOrderInput = {
    type: data.type,
    customerName: data.customerName,
    customerEmail: data.customerEmail.toLowerCase(),
    customerPhone: data.customerPhone,
    paymentMethod: data.paymentMethod,
    cartItems: data.cartItems.map((c) => ({
      menuItemId: c.menuItemId,
      quantity: c.quantity,
    })),
    ...(data.type === "delivery"
      ? {
          deliveryAddress: data.deliveryAddress,
          deliveryLat: data.deliveryLat,
          deliveryLng: data.deliveryLng,
        }
      : {
          collectionTime: data.collectionTime,
        }),
    ...(data.discountCode ? { discountCode: data.discountCode } : {}),
  };  return { ok: true, data: out };
}
