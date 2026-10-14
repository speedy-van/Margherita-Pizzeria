const DELIVERY_FEE_TIERS: ReadonlyArray<{ maxMiles: number; feePence: number }> = [
  { maxMiles: 1, feePence: 195 },
  { maxMiles: 2, feePence: 225 },
  { maxMiles: 3, feePence: 335 },
  { maxMiles: 4, feePence: 449 },
];

export function tieredDeliveryFeePence(distanceMiles: number): number {
  for (const tier of DELIVERY_FEE_TIERS) {
    if (distanceMiles <= tier.maxMiles) return tier.feePence;
  }
  return DELIVERY_FEE_TIERS[DELIVERY_FEE_TIERS.length - 1]!.feePence;
}
