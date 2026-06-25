const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

/**
 * Format an integer number of pence as a GBP currency string.
 *
 * Money is always carried as integer pence in this codebase to avoid floating
 * point rounding. This helper is the single source of truth for display.
 */
export function formatGBPFromPence(pence: number): string {
  if (!Number.isFinite(pence)) {
    return formatter.format(0);
  }
  const safePence = Math.trunc(pence);
  return formatter.format(safePence / 100);
}

export function poundsToPence(pounds: number): number {
  if (!Number.isFinite(pounds)) {
    return 0;
  }
  return Math.round(pounds * 100);
}
