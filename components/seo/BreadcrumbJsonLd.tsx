import type { ReactElement } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/schemas";

export interface BreadcrumbJsonLdProps {
  items: readonly BreadcrumbItem[];
  id?: string;
}

export function BreadcrumbJsonLd({
  items,
  id = "ld-breadcrumb",
}: BreadcrumbJsonLdProps): ReactElement | null {
  if (items.length === 0) return null;
  return <JsonLd data={buildBreadcrumbSchema(items)} id={id} />;
}
