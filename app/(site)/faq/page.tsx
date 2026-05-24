import type { Metadata } from "next";

import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { faqItems } from "@/lib/content/faq";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Pizza Delivery & Booking FAQ | Margherita Pizzeria Glasgow",
  description:
    "Answers about delivery radius, collection, payments, allergies, table booking, and order tracking.",
  path: "/faq",
  keywords: getKeywordsForPath("/faq"),
});

export default function FaqPage() {
  return (
    <PageShell
      eyebrow="FAQ"
      title="Frequently asked questions"
      description="If you don't see your question here, drop us a message on the contact page."
      maxW="container.lg"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <FaqAccordion items={faqItems} />
      <FaqJsonLd faqs={faqItems} />
    </PageShell>
  );
}
