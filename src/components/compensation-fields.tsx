"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatMoney,
  locationShareAmount,
  SIX_CLUB_COMMISSION_PERCENT,
  sixClubCommissionAmount,
} from "@/lib/money";

export type DealValue = "RENT" | "10" | "20";

type DealFields = {
  deal: DealValue;
  rentAmount?: string;
  revenue?: string;
};

export function dealFromRecord(record?: {
  compensationType?: string | null;
  profitPercent?: number | null;
  rentAmount?: number | null;
  revenue?: number | null;
} | null): { deal: DealValue; rentAmount: string; revenue: string } {
  const deal: DealValue =
    record?.compensationType === "RENT"
      ? "RENT"
      : record?.profitPercent === 20
        ? "20"
        : "10";
  return {
    deal,
    rentAmount: record?.rentAmount ? String(record.rentAmount) : "",
    revenue: record?.revenue ? String(record.revenue) : "",
  };
}

export function CompensationFields<T extends DealFields>({
  register,
  control,
  deal,
  rentAmount,
  revenue,
  errors,
  showSixClubCommission = false,
}: {
  register: UseFormRegister<T>;
  control: Control<T>;
  deal: DealValue;
  rentAmount?: string;
  revenue?: string;
  errors: FieldErrors<T>;
  showSixClubCommission?: boolean;
}) {
  const revenueValue = Number(revenue) || 0;
  const rentValue = Number(rentAmount) || 0;
  const compensationType = deal === "RENT" ? "RENT" : "PROFIT";
  const profitPercent = deal === "RENT" ? null : Number(deal);
  const share = locationShareAmount({
    compensationType,
    profitPercent,
    rentAmount: rentValue,
    revenue: revenueValue,
  });
  const commission = sixClubCommissionAmount(revenueValue);
  const rentError = errors.rentAmount?.message;

  return (
    <div className="space-y-4 rounded-md border p-4">
      <p className="text-sm font-medium">Revenue</p>
      <div className="space-y-2">
        <Label>Deal</Label>
        <Controller
          name={"deal" as never}
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RENT">Rent</SelectItem>
                <SelectItem value="10">10% profit</SelectItem>
                <SelectItem value="20">20% profit</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      {deal === "RENT" && (
        <div className="space-y-2">
          <Label htmlFor="rentAmount">Rent amount</Label>
          <Input id="rentAmount" type="number" min={0} step="0.01" {...register("rentAmount" as never)} />
          {typeof rentError === "string" && <p className="text-sm text-destructive">{rentError}</p>}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="revenue">Revenue</Label>
        <Input id="revenue" type="number" min={0} step="0.01" {...register("revenue" as never)} />
      </div>
      <p className="text-sm text-muted-foreground">
        {deal === "RENT" ? "Rent" : "Location share"}:{" "}
        <span className="font-medium text-foreground">{formatMoney(share)}</span>
      </p>
      {showSixClubCommission && (
        <p className="text-sm text-muted-foreground">
          6ixClubs commission ({SIX_CLUB_COMMISSION_PERCENT}%):{" "}
          <span className="font-medium text-foreground">{formatMoney(commission)}</span>
        </p>
      )}
    </div>
  );
}
