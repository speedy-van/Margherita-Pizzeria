// Shared formatting + style helpers.

export function formatMoney(pence: number | undefined | null): string {
  const value = typeof pence === "number" ? pence : 0;
  return `£${(value / 100).toFixed(2)}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short human-friendly "5m ago" / "2h ago" / "Yesterday" / date. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
}

/** "Today" / "Yesterday" / "Older" bucket for grouping list rows. */
export function dayBucket(
  iso: string | null | undefined,
): "Today" | "Yesterday" | "Older" {
  if (!iso) return "Older";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Older";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 3600 * 1000;
  const t = d.getTime();
  if (t >= startOfToday) return "Today";
  if (t >= startOfYesterday) return "Yesterday";
  return "Older";
}

export function statusTone(
  status: string,
): { bg: string; fg: string; label: string } {
  const s = status.toLowerCase();
  const label = s.replace(/_/g, " ");
  if (["received", "pending", "pending_payment"].includes(s)) {
    return { bg: "#fef3c7", fg: "#92400e", label };
  }
  if (["making", "ready", "confirmed", "out_for_delivery"].includes(s)) {
    return { bg: "#dbeafe", fg: "#1e40af", label };
  }
  if (["delivered", "completed"].includes(s)) {
    return { bg: "#dcfce7", fg: "#166534", label };
  }
  if (["cancelled", "rejected"].includes(s)) {
    return { bg: "#fee2e2", fg: "#991b1b", label };
  }
  return { bg: "#e2e8f0", fg: "#334155", label };
}

export const palette = {
  bg: "#f6f5f1",
  surface: "#ffffff",
  surfaceAlt: "#fbfaf6",
  border: "#e7e3da",
  text: "#1a120b",
  textMuted: "#6b6357",
  primary: "#b91c1c",
  primaryDark: "#7f1d1d",
  primaryText: "#ffffff",
  accent: "#0f766e",
  success: "#166534",
  successBg: "#dcfce7",
  warning: "#b45309",
  warningBg: "#fef3c7",
  danger: "#dc2626",
  dangerBg: "#fee2e2",
  dangerFg: "#991b1b",
  info: "#1e40af",
  infoBg: "#dbeafe",
  shadow: "rgba(15, 23, 42, 0.06)",
};

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
