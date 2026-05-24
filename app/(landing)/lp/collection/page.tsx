import type { Metadata } from "next";

import { LandingCollectionHero } from "@/components/landing/LandingCollectionHero";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingMenuPreview } from "@/components/landing/LandingMenuPreview";
import { LandingOfferCards } from "@/components/landing/LandingOfferCards";
import { LandingShell } from "@/components/landing/LandingShell";
import { LandingStickyCta } from "@/components/landing/LandingStickyCta";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { collectionLandingContent, landingFaqs } from "@/lib/content/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Pizza Collection in Glasgow G31 | Margherita Pizzeria",
  description:
    "Order pizza for collection from 652 Alexandra Parade, Glasgow.",
  path: "/lp/collection",
  noIndex: true,
});

export default function CollectionLandingPage() {
  const c = collectionLandingContent;
  return (
    <LandingShell
      bottomCta={
        <LandingStickyCta
          label={c.stickyCta.label}
          href={c.stickyCta.href}
          source={c.source}
          helperText="Pickup from G31"
        />
      }
    >
      <LandingCollectionHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        body={c.hero.body}
        primaryCta={{
          label: c.hero.primaryCta.label,
          href: c.hero.primaryCta.href,
          eventSource: c.source,
        }}
        secondaryCtas={c.hero.secondaryCtas.map((cta, i) => ({
          label: cta.label,
          href: cta.href,
          eventName: i === 0 ? ("menu" as const) : ("directions" as const),
        }))}
      />
      <LandingTrustBar items={c.trust} />
      <LandingOfferCards source={c.source} offers={c.offers} />
      <LandingMenuPreview
        source={c.source}
        title={c.menuPreview.title}
        body={c.menuPreview.body}
        items={c.menuPreview.items}
        cta={c.menuPreview.cta}
      />
      <LandingHowItWorks title={c.howItWorks.title} steps={c.howItWorks.steps} />
      <LandingFaq items={landingFaqs} />
    </LandingShell>
  );
}
