import type { Metadata } from "next";

import { AboutStory } from "@/components/about/AboutStory";
import { AboutValues } from "@/components/about/AboutValues";
import { AboutVisitCta } from "@/components/about/AboutVisitCta";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { aboutContent } from "@/lib/content/about";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About Margherita Pizzeria | Alexandra Parade Glasgow",
  description:
    "A local Glasgow pizzeria serving 24hr sourdough pizza, halal kebabs, smashburgers and grills for delivery, collection and dine-in on Alexandra Parade, Dennistoun.",
  path: "/about",
  keywords: getKeywordsForPath("/about"),
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow={aboutContent.hero.eyebrow}
      title={aboutContent.hero.title}
      description={aboutContent.hero.description}
      maxW="container.lg"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <AboutStory />
      <AboutValues />
      <AboutVisitCta />
    </PageShell>
  );
}
