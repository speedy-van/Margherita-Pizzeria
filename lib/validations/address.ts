import { z } from "zod";

import type { ValidationResult } from "@/lib/validations/menu";

const addressSchema = z.object({
  address: z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(5, "Address is too short")
        .max(300, "Address is too long"),
    ),
  lat: z.number().finite().gte(-90).lte(90).optional(),
  lng: z.number().finite().gte(-180).lte(180).optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export function validateAddressInput(
  input: unknown,
): ValidationResult<AddressInput> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      status: 400,
      error: {
        code: "VALIDATION_FAILED",
        message: issue?.message ?? "Invalid address.",
        fields: { address: issue?.message ?? "Invalid address" },
      },
    };
  }
  return { ok: true, data: parsed.data };
}
