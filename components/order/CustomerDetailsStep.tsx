"use client";

import { Box, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useId, useMemo, useRef, useState } from "react";

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
        <EmailField
          value={value.email}
          onChange={(v) => onChange({ ...value, email: v })}
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

const EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "yahoo.com",
  "yahoo.co.uk",
  "icloud.com",
  "me.com",
  "live.co.uk",
  "live.com",
  "btinternet.com",
  "sky.com",
  "virginmedia.com",
  "aol.com",
  "msn.com",
  "googlemail.com",
  "proton.me",
  "protonmail.com",
];

interface EmailFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function EmailField({ value, onChange, error }: EmailFieldProps) {
  const id = "customer-email";
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo(() => {
    const at = value.indexOf("@");
    if (at < 0) return [] as string[];
    const local = value.slice(0, at);
    if (local.length === 0) return [] as string[];
    const domainPart = value.slice(at + 1).toLowerCase();
    const matches =
      domainPart.length === 0
        ? EMAIL_DOMAINS
        : EMAIL_DOMAINS.filter(
            (d) => d.startsWith(domainPart) && d !== domainPart,
          );
    return matches.slice(0, 6).map((d) => `${local}@${d}`);
  }, [value]);

  const showList = open && suggestions.length > 0;

  const pick = (s: string) => {
    onChange(s);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (activeIndex >= 0) {
        e.preventDefault();
        pick(suggestions[activeIndex]!);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Stack gap={1} ref={containerRef} position="relative">
      <label
        htmlFor={id}
        style={{ fontSize: "0.875rem", color: "var(--chakra-colors-fg-default)" }}
      >
        Email
      </label>
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="you@example.com"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        bg="bg"
        borderColor={error ? "brand.solid" : "border"}
        color="fg.default"
        _placeholder={{ color: "fg.muted" }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />
      {showList ? (
        <Box
          id={listboxId}
          role="listbox"
          position="absolute"
          top="calc(100% + 4px)"
          insetInline={0}
          zIndex={20}
          bg="bg"
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          boxShadow="lg"
          maxH="240px"
          overflowY="auto"
        >
          {suggestions.map((s, idx) => {
            const active = idx === activeIndex;
            return (
              <Box
                key={s}
                role="option"
                aria-selected={active}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                onMouseEnter={() => setActiveIndex(idx)}
                paddingBlock={2}
                paddingInline={3}
                cursor="pointer"
                minH="40px"
                bg={active ? "bg.subtle" : "transparent"}
                _hover={{ bg: "bg.subtle" }}
              >
                <Text fontSize="sm" color="fg.default">
                  {s}
                </Text>
              </Box>
            );
          })}
        </Box>
      ) : null}
      {error ? (
        <Text id={`${id}-error`} fontSize="xs" color="brand.fg">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
