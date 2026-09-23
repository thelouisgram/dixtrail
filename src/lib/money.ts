export function computeTheirCut(grossRevenue: number, cutPercentage: number) {
  const gross = Number.isFinite(grossRevenue) ? grossRevenue : 0;
  const percent = Number.isFinite(cutPercentage) ? cutPercentage : 0;
  return Math.round(gross * (percent / 100) * 100) / 100;
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value ?? 0);
}

export function formatPercent(value: number | null | undefined) {
  return `${(value ?? 0).toLocaleString("en-CA", { maximumFractionDigits: 2 })}%`;
}
