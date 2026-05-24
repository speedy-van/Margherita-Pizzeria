"use client";

import {
  LandingHero,
  type LandingHeroProps,
} from "@/components/landing/LandingHero";

export type LandingCollectionHeroProps = Omit<LandingHeroProps, "variant">;

export function LandingCollectionHero(props: LandingCollectionHeroProps) {
  return <LandingHero {...props} variant="collection" />;
}
