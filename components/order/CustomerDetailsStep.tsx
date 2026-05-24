"use client";

import { Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface CustomerDetailsStepProps {
  value: CustomerDetails;
  onChange: (next: CustomerDetails) => void;
  errors?: Partial<Record<keyof CustomerDetails, string>>;
}

export function CustomerDetailsStep({
  value,
  onChange,
  errors,
}: CustomerDetailsStepProps) {
  return (
    <Stack gap={4}>
      <Field
        id="customer-name"
        label="Full name"
        placeholder="Your name"
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
        autoComplete="name"
        error={errors?.name}
      />
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
        <Field
          id="customer-email"
          label="Email"
          placeholder="you@example.com"
          value={value.email}
          onChange={(v) => onChange({ ...value, email: v })}
          autoComplete="email"
          inputMode="email"
          type="email"
          error={errors?.email}
        />
        <Field
          id="customer-phone"
          label="Phone"
          placeholder="07…"
          value={value.phone}
          onChange={(v) => onChange({ ...value, phone: v })}
          autoComplete="tel"
          inputMode="tel"
          type="tel"
          error={errors?.phone}
        />
      </SimpleGrid>
    </Stack>
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
}: FieldProps) {
  return (
    <Stack gap={1}>
      <label htmlFor={id} style={{ fontSize: "0.875rem", color: "var(--chakra-colors-fg-default)" }}>
        {label}
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
      />
      {error ? (
        <Text id={`${id}-error`} fontSize="xs" color="brand.fg">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
