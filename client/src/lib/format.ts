/** USD cost with adaptive precision. Returns "—" when cost is unknown. */
export function formatCost(usd: number | null | undefined): string {
  if (usd == null) return '—';
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}
