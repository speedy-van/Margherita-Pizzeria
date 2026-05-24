import type { CSSProperties, ReactElement } from "react";

import { formatGBPFromPence } from "@/lib/utils/currency";
import type { OrderItemSnapshot } from "@/types/database";

import { emailBrand } from "./tokens";

export interface EmailItemsTableProps {
  items: ReadonlyArray<OrderItemSnapshot>;
}

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
  color: emailBrand.fg,
};

const th: CSSProperties = {
  color: emailBrand.muted,
  fontWeight: 600,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  textAlign: "left",
  padding: "0 0 8px",
  borderBottom: `1px solid ${emailBrand.border}`,
};

const td: CSSProperties = {
  padding: "10px 0",
  borderBottom: `1px solid ${emailBrand.border}`,
  verticalAlign: "top",
};

export function EmailItemsTable({
  items,
}: EmailItemsTableProps): ReactElement {
  return (
    <table style={table} role="presentation" cellPadding={0} cellSpacing={0}>
      <thead>
        <tr>
          <th style={th}>Item</th>
          <th style={{ ...th, textAlign: "center", width: "60px" }}>Qty</th>
          <th style={{ ...th, textAlign: "right", width: "90px" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.menuItemId}>
            <td style={td}>{item.name}</td>
            <td style={{ ...td, textAlign: "center" }}>{item.quantity}</td>
            <td style={{ ...td, textAlign: "right" }}>
              {formatGBPFromPence(item.totalPence)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default EmailItemsTable;
