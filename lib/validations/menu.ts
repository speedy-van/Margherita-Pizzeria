import { z } from "zod";

/**
 * Menu item validation for admin mutation routes.
 *
 * Uses zod (already a Phase 1 dependency). Returns a typed result discriminated
 * by `ok` so route handlers can branch without try/catch.
 */

export type ValidationFailure = {
  ok: false;
  status: number;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export type ValidationSuccess<T> = { ok: true; data: T };

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const trimmedString = (max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(max));

const allergensSchema = z
  .array(z.string().min(1).max(40))
  .max(20)
  .default([]);

const createMenuItemSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  name: trimmedString(160).pipe(z.string().min(2, "Name is too short")),
  description: trimmedString(1200).nullable(),
  pricePence: z
    .number()
    .int("Price must be an integer (pence)")
    .min(1, "Price must be at least 1p")
    .max(5000, "Price must not exceed 5000p (£50.00)"),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .or(z.literal("").transform(() => null)),
  available: z.boolean(),
  allergens: allergensSchema,
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

const updateMenuItemSchema = createMenuItemSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Body must contain at least one field to update",
  });

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

const uuidSchema = z.string().uuid();

function flattenFieldErrors(
  err: z.ZodError,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

export function validateCreateMenuItemInput(
  input: unknown,
): ValidationResult<CreateMenuItemInput> {
  const parsed = createMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid menu item payload.",
        fields: flattenFieldErrors(parsed.error),
      },
    };
  }
  return { ok: true, data: parsed.data };
}

export function validateUpdateMenuItemInput(
  input: unknown,
): ValidationResult<UpdateMenuItemInput> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "VALIDATION_FAILED",
        message: "Request body must be a JSON object.",
      },
    };
  }
  const parsed = updateMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid menu item update payload.",
        fields: flattenFieldErrors(parsed.error),
      },
    };
  }
  return { ok: true, data: parsed.data };
}

export function validateMenuItemId(id: string): ValidationResult<string> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: {
        code: "INVALID_ID",
        message: "Menu item id must be a valid UUID.",
      },
    };
  }
  return { ok: true, data: parsed.data };
}
