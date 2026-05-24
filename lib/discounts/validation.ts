import { z } from "zod";

import type { ValidationResult } from "@/lib/validations/menu";

function fail(
  message: string,
  fields?: Record<string, string>,
  code = "VALIDATION_FAILED",
  status = 400,
) {
  return {
    ok: false as const,
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

const CODE_RE = /^[A-Z0-9_-]{3,40}$/;

const baseSchema = z.object({
  code: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(
      z
        .string()
        .regex(CODE_RE, "Code must be 3–40 chars (A–Z, 0–9, - or _)."),
    ),
  title: z.string().trim().min(2).max(160),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().min(1).max(1_000_000),
  minOrderPence: z.number().int().min(0).max(1_000_000).default(0),
  startsAt: z
    .union([z.string().datetime({ offset: true }), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v !== "" ? v : null)),
  endsAt: z
    .union([z.string().datetime({ offset: true }), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v !== "" ? v : null)),
  active: z.boolean().default(true),
  appliesToDelivery: z.boolean().default(true),
  appliesToCollection: z.boolean().default(true),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
  if (data.type === "percentage" && (data.value < 1 || data.value > 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["value"],
      message: "Percentage must be 1–100.",
    });
  }
});

export type CreateDiscountInput = z.infer<typeof createSchema>;

export function validateCreateDiscountInput(
  input: unknown,
): ValidationResult<CreateDiscountInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = createSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid discount payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

const updateSchema = baseSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Body must contain at least one field to update." },
);

export type UpdateDiscountInput = z.infer<typeof updateSchema>;

export function validateUpdateDiscountInput(
  input: unknown,
): ValidationResult<UpdateDiscountInput> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid discount payload.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}

const applySchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotalPence: z.number().int().min(0).max(10_000_000),
  orderType: z.enum(["delivery", "collection"]),
});

export type ApplyDiscountRequest = z.infer<typeof applySchema>;

export function validateApplyDiscountInput(
  input: unknown,
): ValidationResult<ApplyDiscountRequest> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return fail("Request body must be a JSON object.");
  }
  const parsed = applySchema.safeParse(input);
  if (!parsed.success)
    return fail("Invalid request.", flatten(parsed.error));
  return { ok: true, data: parsed.data };
}
