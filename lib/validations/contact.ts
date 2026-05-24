import { z } from "zod";

import type {
  ValidationFailure,
  ValidationResult,
} from "@/lib/validations/menu";

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name.")
    .max(160, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(5, "Please enter your email.")
    .max(255, "Email is too long.")
    .email("Enter a valid email."),
  subject: z
    .string()
    .trim()
    .min(3, "Please add a subject.")
    .max(180, "Subject is too long."),
  message: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail.")
    .max(2000, "Message is too long (max 2000 characters)."),
  companyWebsite: z.string().max(2000).optional(),
});

function flatten(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in fields)) fields[path] = issue.message;
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

export function validateContactMessageInput(
  input: unknown,
): ValidationResult<ContactMessageInput> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", flatten(parsed.error));
  }

  // Honeypot: a real user never sees or fills this field.
  if (parsed.data.companyWebsite && parsed.data.companyWebsite.trim() !== "") {
    return fail(
      "Your message could not be accepted.",
      undefined,
      "HONEYPOT_TRIGGERED",
      400,
    );
  }

  return {
    ok: true,
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  };
}
