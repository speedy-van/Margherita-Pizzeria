import type { ReactElement } from "react";

export interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  id?: string;
}

/**
 * Safely render JSON-LD. We never accept user input here; data must originate
 * from server-side, vetted sources. We still escape `</` to prevent any
 * accidental early `</script>` termination.
 */
export function JsonLd({ data, id }: JsonLdProps): ReactElement {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      id={id}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
