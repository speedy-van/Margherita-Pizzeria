"use client";

import { Badge } from "@chakra-ui/react";

export interface AllergenBadgeProps {
  allergen: string;
}

const SEVERITY_TONE: Record<string, { bg: string; color: string; border: string }> = {
  gluten: { bg: "#3a2e1a", color: "#f1d28a", border: "#4a3a22" },
  milk: { bg: "#1e2c3a", color: "#a8d2f5", border: "#26384a" },
  egg: { bg: "#2c2a1a", color: "#e8d97a", border: "#3a3622" },
  nuts: { bg: "#2c1a1a", color: "#f0b89a", border: "#3a2222" },
  peanuts: { bg: "#2c1a1a", color: "#f0b89a", border: "#3a2222" },
  sesame: { bg: "#2c2418", color: "#d8c094", border: "#3a3020" },
  soy: { bg: "#1a2a1f", color: "#a8d8b8", border: "#223a28" },
  sulphites: { bg: "#2a1a2c", color: "#d6a8e0", border: "#36223a" },
  fish: { bg: "#1a2a2c", color: "#a8d8e0", border: "#223a3a" },
  shellfish: { bg: "#1a2a2c", color: "#a8d8e0", border: "#223a3a" },
};

const DEFAULT_TONE = { bg: "#2a2a2a", color: "#e8e8e8", border: "#3a3a3a" };

export function AllergenBadge({ allergen }: AllergenBadgeProps) {
  const tone = SEVERITY_TONE[allergen.toLowerCase()] ?? DEFAULT_TONE;
  return (
    <Badge
      aria-label={`Contains ${allergen}`}
      bg={tone.bg}
      color={tone.color}
      borderWidth="1px"
      borderColor={tone.border}
      borderRadius="full"
      paddingInline="2"
      paddingBlock="0.5"
      fontSize="2xs"
      textTransform="capitalize"
      fontWeight="600"
    >
      {allergen}
    </Badge>
  );
}
