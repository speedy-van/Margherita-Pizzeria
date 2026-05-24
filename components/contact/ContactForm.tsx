"use client";

import {
  Box,
  Button,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useState } from "react";

export interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot — must remain empty. */
  companyWebsite: string;
}

export interface ContactFormProps {
  onSubmitted: (message: string) => void;
}

type FieldErrors = Partial<Record<keyof ContactFormValues, string>>;

interface ContactApiSuccess {
  ok: true;
  data: { message: string };
}
interface ContactApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
type ContactApiResponse = ContactApiSuccess | ContactApiError;

const EMPTY: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
  companyWebsite: "",
};

export function ContactForm({ onSubmitted }: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setSubmitError(null);
      setErrors({});

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });

        let data: ContactApiResponse | null = null;
        try {
          data = (await res.json()) as ContactApiResponse;
        } catch {
          data = null;
        }

        if (!res.ok || !data || !data.ok) {
          if (data && !data.ok) {
            if (data.error.fields) {
              setErrors(data.error.fields as FieldErrors);
            }
            setSubmitError(data.error.message);
          } else {
            setSubmitError(
              "We could not send your message right now. Please try again shortly.",
            );
          }
          return;
        }

        onSubmitted(data.data.message);
        setValues(EMPTY);
      } catch {
        setSubmitError(
          "We could not reach the server. Please check your connection and try again.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitted, submitting, values],
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        padding={{ base: 5, md: 6 }}
      >
      <Stack gap={4}>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
          <Field
            id="contact-name"
            label="Your name"
            placeholder="e.g. Alex Brown"
            autoComplete="name"
            value={values.name}
            onChange={(v) => setField("name", v)}
            error={errors.name}
            required
          />
          <Field
            id="contact-email"
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={values.email}
            onChange={(v) => setField("email", v)}
            error={errors.email}
            required
          />
        </SimpleGrid>

        <Field
          id="contact-subject"
          label="Subject"
          placeholder="e.g. Allergy question, group booking…"
          value={values.subject}
          onChange={(v) => setField("subject", v)}
          error={errors.subject}
          required
        />

        <Stack gap={1}>
          <label
            htmlFor="contact-message"
            style={{
              fontSize: "0.875rem",
              color: "var(--margherita-colors-fg-default)",
            }}
          >
            Message
          </label>
          <Textarea
            id="contact-message"
            placeholder="How can we help?"
            rows={6}
            value={values.message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setField("message", e.target.value)
            }
            bg="bg"
            borderColor={errors.message ? "brand.solid" : "border"}
            color="fg.default"
            _placeholder={{ color: "fg.muted" }}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            maxLength={2000}
            required
          />
          {errors.message ? (
            <Text id="contact-message-error" fontSize="xs" color="brand.fg">
              {errors.message}
            </Text>
          ) : null}
        </Stack>

        {/* Honeypot: hidden from real users and screen readers, but present in the DOM
            for naive bots that fill every field. */}
        <Box
          aria-hidden
          position="absolute"
          left="-9999px"
          width="1px"
          height="1px"
          overflow="hidden"
        >
          <label htmlFor="contact-website">Leave this field blank</label>
          <input
            id="contact-website"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.companyWebsite}
            onChange={(e) => setField("companyWebsite", e.target.value)}
          />
        </Box>

        {submitError ? (
          <Box
            role="alert"
            bg="brand.subtle"
            borderWidth="1px"
            borderColor="brand.muted"
            borderRadius="md"
            padding={3}
          >
            <Text color="fg.default" fontSize="sm">
              {submitError}
            </Text>
          </Box>
        ) : null}

        <Box>
          <Button
            type="submit"
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.emphasized" }}
            loading={submitting}
            loadingText="Sending…"
            size="lg"
          >
            Send message
          </Button>
        </Box>

        <Text color="fg.muted" fontSize="xs">
          By sending this message you agree we can contact you about your enquiry.
        </Text>
      </Stack>
      </Box>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
  type?: "text" | "email" | "tel";
  error?: string;
  required?: boolean;
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  type,
  error,
  required,
}: FieldProps) {
  return (
    <Stack gap={1}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.875rem",
          color: "var(--margherita-colors-fg-default)",
        }}
      >
        {label}
        {required ? " *" : ""}
      </label>
      <Input
        id={id}
        type={type ?? "text"}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        bg="bg"
        borderColor={error ? "brand.solid" : "border"}
        color="fg.default"
        _placeholder={{ color: "fg.muted" }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
      />
      {error ? (
        <Text id={`${id}-error`} fontSize="xs" color="brand.fg">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
