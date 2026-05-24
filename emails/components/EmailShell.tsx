import type { CSSProperties, ReactElement, ReactNode } from "react";

import { siteConfig } from "@/lib/config/site";

import { EmailFooter } from "./EmailFooter";
import { emailBrand, emailFont } from "./tokens";

export { emailBrand, emailFont } from "./tokens";

const styles: Record<string, CSSProperties> = {
  body: {
    backgroundColor: emailBrand.bg,
    color: emailBrand.fg,
    fontFamily: emailFont,
    margin: 0,
    padding: 0,
  },
  preview: {
    display: "none",
    overflow: "hidden",
    lineHeight: 1,
    opacity: 0,
    maxHeight: 0,
    maxWidth: 0,
    color: "transparent",
  },
  wrap: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  brand: {
    color: emailBrand.brand,
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    fontWeight: 700,
    margin: 0,
  },
  brandLocation: {
    color: emailBrand.muted,
    fontSize: "12px",
    margin: "4px 0 0",
  },
  h1: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "26px",
    lineHeight: 1.2,
    margin: "12px 0 8px",
    color: emailBrand.fg,
  },
};

export interface EmailShellProps {
  preview: string;
  title: string;
  children: ReactNode;
}

export function EmailShell({
  preview,
  title,
  children,
}: EmailShellProps): ReactElement {
  return (
    <html lang="en-GB">
      <body style={styles.body}>
        {/* Preview text — surfaced by most inboxes, hidden in the rendered body. */}
        <div style={styles.preview}>{preview}</div>
        <div style={styles.wrap}>
          <p style={styles.brand}>{siteConfig.name}</p>
          <p style={styles.brandLocation}>
            Alexandra Parade · Glasgow G31
          </p>
          <h1 style={styles.h1}>{title}</h1>
          {children}
          <EmailFooter />
        </div>
      </body>
    </html>
  );
}

export default EmailShell;
