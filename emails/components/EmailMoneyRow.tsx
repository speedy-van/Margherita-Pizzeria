import type { CSSProperties, ReactElement } from "react";

import { emailBrand } from "./tokens";

export interface EmailMoneyRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  padding: "6px 0",
  fontSize: "14px",
};

const emphasisRow: CSSProperties = {
  ...row,
  padding: "10px 0 0",
  marginTop: "10px",
  borderTop: `1px solid ${emailBrand.border}`,
  fontWeight: 700,
  fontSize: "16px",
};

export function EmailMoneyRow({
  label,
  value,
  emphasis = false,
}: EmailMoneyRowProps): ReactElement {
  return (
    <div style={emphasis ? emphasisRow : row}>
      <span style={{ color: emphasis ? emailBrand.fg : emailBrand.muted }}>
        {label}
      </span>
      <span style={{ color: emailBrand.fg }}>{value}</span>
    </div>
  );
}

export default EmailMoneyRow;
