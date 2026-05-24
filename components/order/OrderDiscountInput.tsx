"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

import { formatGBPFromPence } from "@/lib/utils/currency";

export interface AppliedDiscount {
  code: string;
  title: string;
  discountPence: number;
}

interface ApiOkResponse {
  ok: true;
  data: { code: string; title: string; discountPence: number };
}
interface ApiErrResponse {
  ok: false;
  error: { code: string; message: string };
}
type ApiResponse = ApiOkResponse | ApiErrResponse;

export interface OrderDiscountInputProps {
  orderMode: "delivery" | "collection";
  subtotalPence: number;
  applied: AppliedDiscount | null;
  onApplied: (discount: AppliedDiscount | null) => void;
  disabled?: boolean;
}

const CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;

export function OrderDiscountInput({
  orderMode,
  subtotalPence,
  applied,
  onApplied,
  disabled,
}: OrderDiscountInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async () => {
    const normalised = code.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalised)) {
      setError("Enter a valid discount code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discounts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalised,
          orderType: orderMode,
          subtotalPence,
        }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!json.ok) {
        setError(json.error.message);
        onApplied(null);
        return;
      }
      onApplied({
        code: json.data.code,
        title: json.data.title,
        discountPence: json.data.discountPence,
      });
      setCode("");
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setLoading(false);
    }
  }, [code, orderMode, subtotalPence, onApplied]);

  const remove = useCallback(() => {
    onApplied(null);
    setError(null);
  }, [onApplied]);

  if (applied) {
    return (
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
        padding={3}
      >
        <HStack justify="space-between" gap={3} flexWrap="wrap">
          <Stack gap={0}>
            <Text fontSize="sm" fontWeight="700" color="fg.default">
              {applied.code} applied
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {applied.title} — saves {formatGBPFromPence(applied.discountPence)}
            </Text>
          </Stack>
          <Button
            type="button"
            size="xs"
            variant="outline"
            borderColor="border"
            color="fg.default"
            onClick={remove}
            disabled={disabled || loading}
          >
            Remove
          </Button>
        </HStack>
      </Box>
    );
  }

  return (
    <Stack gap={2}>
      <HStack gap={2} align="stretch">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          aria-label="Discount code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          size="sm"
          disabled={disabled || loading}
        />
        <Button
          type="button"
          size="sm"
          bg="brand.solid"
          color="brand.contrast"
          _hover={{ bg: "brand.emphasized" }}
          onClick={apply}
          loading={loading}
          disabled={disabled || code.trim().length === 0}
        >
          Apply
        </Button>
      </HStack>
      {error ? (
        <Text role="alert" fontSize="xs" color="brand.fg">
          {error}
        </Text>
      ) : null}
    </Stack>
  );
}
