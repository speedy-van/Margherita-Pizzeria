import type { ReactElement } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import type { PublicMenuResponse } from "@/lib/menu/types";
import { buildMenuSchema } from "@/lib/seo/schemas";

export interface MenuJsonLdProps {
  menu: Pick<PublicMenuResponse, "categories">;
  id?: string;
}

export function MenuJsonLd({ menu, id = "ld-menu" }: MenuJsonLdProps): ReactElement | null {
  const hasItems = menu.categories.some((c) => c.items.length > 0);
  if (!hasItems) return null;
  return <JsonLd data={buildMenuSchema(menu)} id={id} />;
}
