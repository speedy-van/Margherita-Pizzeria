import type { ReactElement } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildRestaurantSchema,
  buildLocalBusinessSchema,
} from "@/lib/seo/schemas";

export interface RestaurantJsonLdProps {
  /** When true, also emits the LocalBusiness graph node. Default: true. */
  includeLocalBusiness?: boolean;
  id?: string;
}

/**
 * Restaurant + LocalBusiness JSON-LD. Render at most once per page; the
 * default placement is the root layout.
 */
export function RestaurantJsonLd({
  includeLocalBusiness = true,
  id = "ld-restaurant",
}: RestaurantJsonLdProps): ReactElement {
  const graph: Record<string, unknown>[] = [buildRestaurantSchema()];
  if (includeLocalBusiness) {
    graph.push(buildLocalBusinessSchema());
  }
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@graph": graph,
  };
  return <JsonLd data={payload} id={id} />;
}
