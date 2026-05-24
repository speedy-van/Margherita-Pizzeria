import type { ReactElement } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import type { FaqItem } from "@/lib/content/faq";
import { buildFaqSchema } from "@/lib/seo/schemas";

export interface FaqJsonLdProps {
  faqs: readonly FaqItem[];
  id?: string;
}

export function FaqJsonLd({ faqs, id = "ld-faq" }: FaqJsonLdProps): ReactElement | null {
  if (faqs.length === 0) return null;
  return <JsonLd data={buildFaqSchema(faqs)} id={id} />;
}
