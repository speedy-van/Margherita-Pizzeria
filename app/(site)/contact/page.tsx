import type { Metadata } from "next";

import { ContactPageClient } from "@/components/contact/ContactPageClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageShell } from "@/components/ui/PageShell";
import { getKeywordsForPath } from "@/lib/seo/keywords";
import { createPageMetadata } from "@/lib/seo/metadata";
import { buildContactPageSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = createPageMetadata({
  title: "Contact Margherita Pizzeria | Glasgow G31",
  description:
    "Contact Margherita Pizzeria about orders, delivery area, collection, and table booking.",
  path: "/contact",
  keywords: getKeywordsForPath("/contact"),
});

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch"
      description="For order questions, booking changes, allergens, press or partnerships — drop us a message and we'll come back to you."
      maxW="container.xl"
    >
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <JsonLd data={buildContactPageSchema()} id="ld-contact" />
      <ContactPageClient />
    </PageShell>
  );
}
