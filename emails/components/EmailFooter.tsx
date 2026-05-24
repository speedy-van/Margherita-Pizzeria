import type { CSSProperties, ReactElement } from "react";

import { siteConfig } from "@/lib/config/site";
import { buildAbsoluteUrl } from "@/lib/resend/email-copy";

import { emailBrand } from "./tokens";

const wrap: CSSProperties = {
  marginTop: "32px",
  paddingTop: "20px",
  borderTop: `1px solid ${emailBrand.border}`,
  color: emailBrand.muted,
  fontSize: "12px",
  lineHeight: 1.6,
};

const linkRow: CSSProperties = {
  margin: "8px 0 0",
};

const link: CSSProperties = {
  color: emailBrand.brand,
  textDecoration: "none",
  marginRight: "12px",
};

export function EmailFooter(): ReactElement {
  return (
    <div style={wrap}>
      <p style={{ margin: 0 }}>
        {siteConfig.name} · {siteConfig.address}
      </p>
      <p style={{ margin: "6px 0 0" }}>
        You received this email because a request was made through{" "}
        {siteConfig.domain}.
      </p>
      <p style={linkRow}>
        <a href={buildAbsoluteUrl("/")} style={link}>
          Home
        </a>
        <a href={buildAbsoluteUrl("/menu")} style={link}>
          Menu
        </a>
        <a href={buildAbsoluteUrl("/contact")} style={link}>
          Contact
        </a>
      </p>
    </div>
  );
}

export default EmailFooter;
