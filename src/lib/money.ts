export const PROFIT_PERCENTS = [10, 20] as const;
export const SIX_CLUB_COMMISSION_PERCENT = 5;

export type ProfitPercent = (typeof PROFIT_PERCENTS)[number];

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeTheirCut(grossRevenue: number, cutPercentage: number) {
  const gross = Number.isFinite(grossRevenue) ? grossRevenue : 0;
  const percent = Number.isFinite(cutPercentage) ? cutPercentage : 0;
  return roundMoney(gross * (percent / 100));
}

export function locationShareAmount(input: {
  compensationType: "RENT" | "PROFIT";
  profitPercent?: number | null;
  rentAmount?: number | null;
  revenue?: number | null;
}) {
  if (input.compensationType === "RENT") {
    return roundMoney(input.rentAmount ?? 0);
  }
  return computeTheirCut(input.revenue ?? 0, input.profitPercent ?? 0);
}

export function sixClubCommissionAmount(revenue: number) {
  return computeTheirCut(revenue, SIX_CLUB_COMMISSION_PERCENT);
}

export function compensationAmounts(input: {
  compensationType: "RENT" | "PROFIT";
  profitPercent?: number | null;
  rentAmount?: number | null;
  revenue?: number | null;
}) {
  const profitPercent = input.compensationType === "PROFIT" ? input.profitPercent ?? null : null;
  const rentAmount = input.compensationType === "RENT" ? input.rentAmount ?? 0 : 0;
  const revenue = input.revenue ?? 0;
  return {
    compensationType: input.compensationType,
    profitPercent,
    rentAmount,
    revenue,
    locationShare: locationShareAmount({
      compensationType: input.compensationType,
      profitPercent,
      rentAmount,
      revenue,
    }),
    sixClubCommission: sixClubCommissionAmount(revenue),
  };
}

export function formatDeal(
  compensationType?: string | null,
  profitPercent?: number | null
) {
  if (compensationType === "RENT") return "Rent";
  if (profitPercent === 10 || profitPercent === 20) return `${profitPercent}% profit`;
  return "—";
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
