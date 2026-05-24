import type { CSSProperties, ReactElement } from "react";

import { emailBrand, emailFont } from "./tokens";

export interface EmailButtonProps {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
}

const base: CSSProperties = {
  display: "inline-block",
  padding: "12px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
  fontFamily: emailFont,
  marginRight: "8px",
  marginBottom: "8px",
};

const variants: Record<"primary" | "secondary", CSSProperties> = {
  primary: {
    backgroundColor: emailBrand.crimson,
    color: emailBrand.fg,
    border: `1px solid ${emailBrand.crimson}`,
  },
  secondary: {
    backgroundColor: "transparent",
    color: emailBrand.fg,
    border: `1px solid ${emailBrand.border}`,
  },
};

export function EmailButton({
  href,
  children,
  variant = "primary",
}: EmailButtonProps): ReactElement {
  return (
    <a href={href} style={{ ...base, ...variants[variant] }}>
      {children}
    </a>
  );
}

export default EmailButton;
