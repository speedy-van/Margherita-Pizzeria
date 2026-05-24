import type { Metadata } from "next";

import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingMenuPreview } from "@/components/landing/LandingMenuPreview";
import { LandingOfferCards } from "@/components/landing/LandingOfferCards";
import { LandingShell } from "@/components/landing/LandingShell";
import { LandingStickyCta } from "@/components/landing/LandingStickyCta";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { landingFaqs, orderNowLandingContent } from "@/lib/content/landing";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Order Pizza Now in Glasgow | Margherita Pizzeria",
  description:
    "Order pizza for delivery within 5 miles of G31 or collection from Alexandra Parade.",
  path: "/lp/order-now",
  noIndex: true,
});

export default function OrderNowLandingPage() {
  const c = orderNowLandingContent;
  return (
    <LandingShell
      bottomCta={
        <LandingStickyCta
          label={c.stickyCta.label}
          href={c.stickyCta.href}
          source={c.source}
          helperText="Check live availability"
        />
      }
    >
      <LandingHero
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
          eventName: i === 0 ? ("menu" as const) : ("book" as const),
        }))}
        variant="delivery"
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
