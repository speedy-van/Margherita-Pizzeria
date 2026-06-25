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

type SuggestionKind =
  | "address"
  | "postcode"
  | "place"
  | "locality"
  | "neighborhood"
  | "other";

interface Suggestion {
  id: string;
  label: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
  kind: SuggestionKind;
  hasHouseNumber: boolean;
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
  /**
   * Called whenever the address block can't yet produce a validated address.
   * The reason is a short, human-readable string suitable for the Place-order
   * disabled message (e.g. "Add your house / door number."). `null` means the
   * step is satisfied.
   */
  onPendingReason?: (reason: string | null) => void;
}

const MIN_QUERY_LEN = 3;
const DEBOUNCE_MS = 300;

// UK postcode: outward (1–2 letters + digit + optional letter/digit) + space
// + inward (digit + 2 letters). Case-insensitive; we normalise to uppercase.
const UK_FULL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

function isFullUkPostcode(value: string): boolean {
  return UK_FULL_POSTCODE.test(value.trim());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function DeliveryAddressStep({
  address,
  onAddressChange,
  validated,
  onValidated,
  externalError,
  onSwitchToCollection,
  onPendingReason,
}: DeliveryAddressStepProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const doorId = useId();
  const flatId = useId();
  const postcodeId = useId();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const [validating, setValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // House/door number is required when the picked suggestion didn't already
  // contain one (e.g. user picked a postcode). Flat/apartment is always
  // optional. These are prepended to the address sent to the kitchen.
  const [door, setDoor] = useState("");
  const [flat, setFlat] = useState("");
  const [postcode, setPostcode] = useState("");
  // The partial postcode (or whole-postcode area) the suggestion came with,
  // so we can splice the user-entered full postcode into the formatted
  // address that came back from the geocoder.
  const [suggestionPostcode, setSuggestionPostcode] = useState<string | null>(null);
  const [needsDoor, setNeedsDoor] = useState(false);
  // Raw geocoded address from the server, before we prefix door/flat.
  const [baseValidated, setBaseValidated] = useState<ValidatedAddress | null>(null);

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
    setBaseValidated(null);
    setNeedsDoor(false);
    setDoor("");
    setFlat("");
    setPostcode("");
    setSuggestionPostcode(null);
  };

  const handlePick = async (s: Suggestion) => {
    pickedRef.current = s.address;
    onAddressChange(s.address);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setSuggestError(null);
    setDoor("");
    setFlat("");
    setPostcode(s.postcode ?? "");
    setSuggestionPostcode(s.postcode ?? null);
    setNeedsDoor(!s.hasHouseNumber);

    setValidating(true);
    setValidationError(null);
    setValidationMessage(null);
    onValidated(null);
    setBaseValidated(null);
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
      setBaseValidated({
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

  // Combine the geocoded base address with door/flat into the value we
  // bubble up to the parent. While the picked suggestion needs a door and
  // none has been typed, we keep validated=null so the submit stays disabled.
  useEffect(() => {
    if (!baseValidated) {
      onPendingReason?.(null);
      return;
    }
    if (!baseValidated.withinRadius) {
      onPendingReason?.(null);
      return;
    }
    const doorTrim = door.trim();
    const flatTrim = flat.trim();
    const postcodeTrim = postcode.trim().toUpperCase();
    if (needsDoor && doorTrim.length === 0) {
      onValidated(null);
      onPendingReason?.("Add your house / door number to continue.");
      return;
    }
    if (postcodeTrim.length === 0) {
      onValidated(null);
      onPendingReason?.("Add your postcode to continue.");
      return;
    }
    if (!isFullUkPostcode(postcodeTrim)) {
      onValidated(null);
      onPendingReason?.("Enter your full postcode (e.g. G32 6AB).");
      return;
    }
    // Splice the user-typed full postcode into the formatted address
    // (replacing the partial one Mapbox returned), so the kitchen and the
    // driver see the complete postcode.
    let addressWithPostcode = baseValidated.address;
    const partial = (suggestionPostcode ?? "").trim();
    if (partial && addressWithPostcode.toUpperCase().includes(partial.toUpperCase())) {
      const re = new RegExp(escapeRegExp(partial), "i");
      addressWithPostcode = addressWithPostcode.replace(re, postcodeTrim);
    } else if (!addressWithPostcode.toUpperCase().includes(postcodeTrim)) {
      addressWithPostcode = `${addressWithPostcode}, ${postcodeTrim}`;
    }
    const parts: string[] = [];
    if (flatTrim) parts.push(`Flat ${flatTrim}`);
    if (doorTrim) parts.push(doorTrim);
    const prefix = parts.join(", ");
    const finalAddress = prefix
      ? `${prefix}, ${addressWithPostcode}`
      : addressWithPostcode;
    onValidated({ ...baseValidated, address: finalAddress });
    onPendingReason?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseValidated, door, flat, postcode, needsDoor, suggestionPostcode]);

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
      <style>{`
        @keyframes doorPulse {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(1.08); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .door-pulse-wrap > [aria-hidden] { animation: none !important; opacity: 0.4 !important; }
        }
      `}</style>
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

      {baseValidated && baseValidated.withinRadius ? (
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
            {baseValidated.address} · ~{baseValidated.milesFromRestaurant} miles
          </Text>
        </Box>
      ) : null}

      {baseValidated && !baseValidated.withinRadius ? (
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
              `${baseValidated.address} · ~${baseValidated.milesFromRestaurant} miles away.`}
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

      {baseValidated && baseValidated.withinRadius ? (
        <Stack gap={3}>
          {needsDoor ? (
            <Box
              borderWidth="1px"
              borderColor={door.trim().length === 0 ? "brand.muted" : "border"}
              bg={door.trim().length === 0 ? "brand.subtle" : "bg.subtle"}
              borderRadius="md"
              padding={3}
            >
              <Text fontSize="sm" color="fg.default" fontWeight="600" marginBlockEnd={1}>
                {door.trim().length === 0
                  ? "Please add your house / door number"
                  : "Add your house / door number"}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                We have your street — just add the house number so the driver
                can find you.
              </Text>
            </Box>
          ) : null}

          <Stack
            direction={{ base: "column", sm: "row" }}
            gap={3}
          >
            <Stack gap={1} flex="1 1 0">
              <Box fontSize="sm" color="fg.default">
                <label htmlFor={doorId}>
                  House / door number{needsDoor ? " *" : " (optional)"}
                </label>
              </Box>
              <Box
                position="relative"
                className={
                  needsDoor && door.trim().length === 0
                    ? "door-pulse-wrap"
                    : undefined
                }
              >
                <Input
                  id={doorId}
                  value={door}
                  onChange={(e) => setDoor(e.target.value)}
                  placeholder="e.g. 12 or 12A"
                  autoComplete="off"
                  inputMode="text"
                  minH="48px"
                  bg="bg"
                  borderColor={needsDoor && door.trim().length === 0 ? "brand.muted" : "border"}
                  color="fg.default"
                  required={needsDoor}
                  aria-required={needsDoor}
                  aria-invalid={needsDoor && door.trim().length === 0}
                  position="relative"
                  zIndex={1}
                />
                {needsDoor && door.trim().length === 0 ? (
                  <>
                    <Box
                      aria-hidden
                      position="absolute"
                      inset={0}
                      borderRadius="md"
                      borderWidth="2px"
                      borderColor="brand.solid"
                      pointerEvents="none"
                      zIndex={0}
                      css={{ animation: "doorPulse 1.6s ease-out infinite" }}
                    />
                    <Box
                      aria-hidden
                      position="absolute"
                      inset={0}
                      borderRadius="md"
                      borderWidth="2px"
                      borderColor="brand.solid"
                      pointerEvents="none"
                      zIndex={0}
                      css={{
                        animation: "doorPulse 1.6s ease-out infinite",
                        animationDelay: "0.8s",
                      }}
                    />
                  </>
                ) : null}
              </Box>
            </Stack>

            <Stack gap={1} flex="1 1 0">
              <Box fontSize="sm" color="fg.default">
                <label htmlFor={flatId}>Flat / apartment (optional)</label>
              </Box>
              <Input
                id={flatId}
                value={flat}
                onChange={(e) => setFlat(e.target.value)}
                placeholder="e.g. 3 or 2/2"
                autoComplete="off"
                inputMode="text"
                minH="48px"
                bg="bg"
                borderColor="border"
                color="fg.default"
              />
            </Stack>
          </Stack>

          <Stack gap={1}>
            <Box fontSize="sm" color="fg.default">
              <label htmlFor={postcodeId}>Postcode *</label>
            </Box>
            <Input
              id={postcodeId}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="e.g. G32 6AB"
              autoComplete="postal-code"
              autoCapitalize="characters"
              inputMode="text"
              minH="48px"
              bg="bg"
              borderColor={
                postcode.trim().length === 0 || !isFullUkPostcode(postcode)
                  ? "brand.muted"
                  : "border"
              }
              color="fg.default"
              required
              aria-required
              aria-invalid={
                postcode.trim().length > 0 && !isFullUkPostcode(postcode)
              }
              maxW={{ base: "100%", sm: "260px" }}
            />
            {postcode.trim().length > 0 && !isFullUkPostcode(postcode) ? (
              <Text fontSize="xs" color="fg.muted">
                Enter the full postcode (e.g. G32 6AB) so the driver finds you.
              </Text>
            ) : null}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
