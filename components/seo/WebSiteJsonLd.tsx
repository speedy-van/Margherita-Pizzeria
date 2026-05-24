import type { ReactElement } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { buildWebSiteSchema } from "@/lib/seo/schemas";

export interface WebSiteJsonLdProps {
  id?: string;
}

/** Site-wide WebSite JSON-LD. Render once, from the root layout. */
export function WebSiteJsonLd({ id = "ld-website" }: WebSiteJsonLdProps = {}): ReactElement {
  return <JsonLd data={buildWebSiteSchema()} id={id} />;
}
