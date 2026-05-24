import type { CSSProperties, ReactElement, ReactNode } from "react";

import { emailBrand } from "./tokens";

export interface EmailInfoRowProps {
  label: string;
  value: ReactNode;
}

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  padding: "6px 0",
  fontSize: "14px",
  lineHeight: 1.5,
};

const labelStyle: CSSProperties = {
  color: emailBrand.muted,
  paddingRight: "12px",
};

const valueStyle: CSSProperties = {
  color: emailBrand.fg,
  maxWidth: "60%",
  textAlign: "right",
  wordBreak: "break-word",
};

export function EmailInfoRow({
  label,
  value,
}: EmailInfoRowProps): ReactElement {
  return (
    <div style={row}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

export default EmailInfoRow;
