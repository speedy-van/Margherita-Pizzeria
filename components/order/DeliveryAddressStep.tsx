"use client";

import {
  Box,
  Button,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";

export interface ValidatedAddress {
  address: string;
  lat: number;
  lng: number;
  milesFromRestaurant: number;
  withinRadius: boolean;
}

interface Suggestion {
  id: string;
  label: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
}

interface AutocompleteResponse {
  ok: boolean;
  data?: { suggestions: Suggestion[] };
  error?: { code: string; message: string };
}

interface ValidateResponse {
  ok: boolean;
  data?: ValidatedAddress & { message?: string };
  error?: { code: string; message: string };
}

export interface DeliveryAddressStepProps {
  address: string;
  onAddressChange: (v: string) => void;
  validated: ValidatedAddress | null;
  onValidated: (v: ValidatedAddress | null) => void;
  externalError?: string;
  onSwitchToCollection?: () => void;
}

const MIN_QUERY_LEN = 3;
const DEBOUNCE_MS = 300;

export function DeliveryAddressStep({
  address,
  onAddressChange,
  validated,
  onValidated,
  externalError,
  onSwitchToCollection,
}: DeliveryAddressStepProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track the last text the user explicitly picked from the dropdown so we
  // don't immediately re-query for suggestions after a selection.
  const pickedRef = useRef<string | null>(null);
  // Abort in-flight requests when the user keeps typing.
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounced autocomplete fetch.
  useEffect(() => {
    const trimmed = address.trim();
    if (pickedRef.current && trimmed === pickedRef.current) {
      // Skip — user just picked this suggestion.
      return;
    }
    if (trimmed.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setSuggestError(null);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    setSuggestError(null);
    const handle = window.setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      fetch(`/api/address/autocomplete?q=${encodeURIComponent(trimmed)}`, {
        method: "GET",
        signal: ctrl.signal,
      })
        .then((res) => res.json())
        .then((json: AutocompleteResponse) => {
          if (ctrl.signal.aborted) return;
          if (!json.ok || !json.data) {
            setSuggestError(json.error?.message ?? "Couldn't load suggestions.");
            setSuggestions([]);
            return;
          }
          setSuggestions(json.data.suggestions);
          setActiveIndex(json.data.suggestions.length > 0 ? 0 : -1);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSuggestError("Network problem — please try again.");
          setSuggestions([]);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setSuggestLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [address]);

  // Close the dropdown on outside click / tap (mobile-friendly).
  useEffect(() => {
    if (!showSuggestions) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showSuggestions]);

  const handleChange = (value: string) => {
    pickedRef.current = null;
    onAddressChange(value);
    if (validated) {
      onValidated(null);
      setValidationMessage(null);
    }
    setValidationError(null);
    setShowSuggestions(true);
  };

  const handlePick = async (s: Suggestion) => {
    pickedRef.current = s.address;
    onAddressChange(s.address);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setSuggestError(null);

    setValidating(true);
    setValidationError(null);
    setValidationMessage(null);
    onValidated(null);
    try {
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: s.address, lat: s.lat, lng: s.lng }),
      });
      const json = (await res.json()) as ValidateResponse;
      if (!json.ok || !json.data) {
        setValidationError(json.error?.message ?? "We couldn't check that address.");
        return;
      }
      if (json.data.message) setValidationMessage(json.data.message);
      onValidated({
        address: json.data.address,
        lat: json.data.lat,
        lng: json.data.lng,
        milesFromRestaurant: json.data.milesFromRestaurant,
        withinRadius: json.data.withinRadius,
      });
    } catch {
      setValidationError("Network problem — please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        void handlePick(suggestions[activeIndex]!);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const trimmed = address.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LEN;
  const showEmptyState =
    showSuggestions &&
    !suggestLoading &&
    !suggestError &&
    suggestions.length === 0 &&
    trimmed.length >= MIN_QUERY_LEN &&
    pickedRef.current !== trimmed;

  return (
    <Stack gap={3}>
      <Stack gap={1} ref={containerRef} position="relative">
        <label
          htmlFor={inputId}
          style={{ fontSize: "0.875rem", color: "var(--chakra-colors-fg-default)" }}
        >
          Delivery address
        </label>

        <Box position="relative">
          <Input
            id={inputId}
            placeholder="Start typing your postcode or street…"
            value={address}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            inputMode="text"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 && suggestions[activeIndex]
                ? `${listboxId}-opt-${activeIndex}`
                : undefined
            }
            bg="bg"
            borderColor="border"
            color="fg.default"
            _placeholder={{ color: "fg.muted" }}
            minH="48px"
            fontSize={{ base: "md", md: "sm" }}
            paddingInlineEnd={suggestLoading || validating ? "2.5rem" : undefined}
          />
          {(suggestLoading || validating) && (
            <Box
              position="absolute"
              top="50%"
              insetInlineEnd="0.75rem"
              transform="translateY(-50%)"
              pointerEvents="none"
            >
              <Spinner size="sm" color="brand.fg" />
            </Box>
          )}

          {showSuggestions &&
            (suggestions.length > 0 || showEmptyState || suggestError) && (
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
                maxH="min(360px, 50vh)"
                overflowY="auto"
                overscrollBehavior="contain"
              >
                {suggestions.map((s, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <Box
                      key={s.id}
                      id={`${listboxId}-opt-${idx}`}
                      role="option"
                      aria-selected={active}
                      onPointerDown={(e) => {
                        // Prevent input blur stealing the tap on mobile.
                        e.preventDefault();
                      }}
                      onClick={() => void handlePick(s)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      paddingBlock={3}
                      paddingInline={3}
                      cursor="pointer"
                      minH="48px"
                      bg={active ? "bg.subtle" : "transparent"}
                      borderTopWidth={idx === 0 ? "0" : "1px"}
                      borderTopColor="border"
                      _hover={{ bg: "bg.subtle" }}
                    >
                      <Text fontSize="sm" color="fg.default" fontWeight="500">
                        {s.label}
                      </Text>
                      {s.postcode ? (
                        <Text fontSize="xs" color="fg.muted">
                          {s.postcode}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}

                {showEmptyState && (
                  <Box paddingBlock={3} paddingInline={3}>
                    <Text fontSize="sm" color="fg.muted">
                      No matching addresses found. Try a postcode and street name.
                    </Text>
                  </Box>
                )}

                {suggestError && (
                  <Box paddingBlock={3} paddingInline={3}>
                    <Text fontSize="sm" color="fg.default">
                      {suggestError}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
        </Box>

        {tooShort ? (
          <Text fontSize="xs" color="fg.muted">
            Keep typing — at least {MIN_QUERY_LEN} characters.
          </Text>
        ) : null}
      </Stack>

      {externalError ? (
        <Box
          borderWidth="1px"
          borderColor="brand.muted"
          bg="brand.subtle"
          borderRadius="md"
          padding={3}
        >
          <Text fontSize="sm" color="fg.default">
            {externalError}
          </Text>
        </Box>
      ) : null}

      {validationError ? (
        <Box
          role="alert"
          borderWidth="1px"
          borderColor="brand.muted"
          bg="brand.subtle"
          borderRadius="md"
          padding={3}
        >
          <Text fontSize="sm" color="fg.default">
            {validationError}
          </Text>
        </Box>
      ) : null}

      {validated && validated.withinRadius ? (
        <Box
          role="status"
          borderWidth="1px"
          borderColor="border"
          bg="bg.subtle"
          borderRadius="md"
          padding={3}
        >
          <Text fontSize="sm" color="fg.default" fontWeight="600">
            ✓ Good news, we deliver to this address.
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {validated.address} · ~{validated.milesFromRestaurant} miles
          </Text>
        </Box>
      ) : null}

      {validated && !validated.withinRadius ? (
        <Box
          role="alert"
          borderWidth="1px"
          borderColor="brand.muted"
          bg="brand.subtle"
          borderRadius="md"
          padding={3}
        >
          <Text fontSize="sm" color="fg.default" fontWeight="600">
            Sorry, this address is outside our 5-mile delivery area.
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {validationMessage ??
              `${validated.address} · ~${validated.milesFromRestaurant} miles away.`}
          </Text>
          <Text fontSize="xs" color="fg.muted" marginBlockStart={1}>
            You can still order for collection.
          </Text>
          {onSwitchToCollection ? (
            <Button
              type="button"
              onClick={onSwitchToCollection}
              size="sm"
              marginBlockStart={3}
              bg="brand.solid"
              color="brand.contrast"
              _hover={{ bg: "brand.emphasized" }}
            >
              Switch to collection
            </Button>
          ) : null}
        </Box>
      ) : null}
    </Stack>
  );
}
