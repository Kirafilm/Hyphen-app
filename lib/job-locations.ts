export const jobLocations = ["香港", "澳門", "台灣", "新加坡", "英國"] as const;

export type JobLocation = (typeof jobLocations)[number];

type BudgetTier = {
  label: string;
  min: number;
  max: number;
};

type JobLocationConfig = {
  currency: string;
  tiers: BudgetTier[];
};

function tier(currency: string, symbol: string, min: number, max: number | "open"): BudgetTier {
  const fmt = (n: number) => n.toLocaleString("en-US");
  if (max === "open") {
    return { label: `${currency} ${symbol}${fmt(min)}+`, min, max: min };
  }
  return { label: `${currency} ${symbol}${fmt(min)} - ${symbol}${fmt(max)}`, min, max };
}

/** Location → currency and locally sensible freelance budget tiers. */
export const jobLocationConfig: Record<JobLocation, JobLocationConfig> = {
  香港: {
    currency: "HKD",
    tiers: [
      tier("HKD", "$", 500, 2000),
      tier("HKD", "$", 2000, 5000),
      tier("HKD", "$", 5000, 10000),
      tier("HKD", "$", 10000, 50000),
      tier("HKD", "$", 50000, "open"),
    ],
  },
  澳門: {
    currency: "MOP",
    tiers: [
      tier("MOP", "$", 500, 2000),
      tier("MOP", "$", 2000, 5000),
      tier("MOP", "$", 5000, 10000),
      tier("MOP", "$", 10000, 50000),
      tier("MOP", "$", 50000, "open"),
    ],
  },
  台灣: {
    currency: "TWD",
    tiers: [
      tier("TWD", "$", 2000, 8000),
      tier("TWD", "$", 8000, 20000),
      tier("TWD", "$", 20000, 40000),
      tier("TWD", "$", 40000, 200000),
      tier("TWD", "$", 200000, "open"),
    ],
  },
  新加坡: {
    currency: "SGD",
    tiers: [
      tier("SGD", "$", 100, 400),
      tier("SGD", "$", 400, 1000),
      tier("SGD", "$", 1000, 2000),
      tier("SGD", "$", 2000, 8000),
      tier("SGD", "$", 8000, "open"),
    ],
  },
  英國: {
    currency: "GBP",
    tiers: [
      tier("GBP", "£", 50, 200),
      tier("GBP", "£", 200, 500),
      tier("GBP", "£", 500, 1000),
      tier("GBP", "£", 1000, 5000),
      tier("GBP", "£", 5000, "open"),
    ],
  },
};

export function isJobLocation(location: string): location is JobLocation {
  return (jobLocations as readonly string[]).includes(location);
}

export function getBudgetRangesForLocation(location: string): string[] {
  const config = jobLocationConfig[location as JobLocation];
  if (!config) return jobLocationConfig.香港.tiers.map((t) => t.label);
  return config.tiers.map((t) => t.label);
}

export function getCurrencyForLocation(location: string): string {
  const config = jobLocationConfig[location as JobLocation];
  return config?.currency ?? "HKD";
}

export function parseBudgetForLocation(location: string, label: string) {
  const config = jobLocationConfig[location as JobLocation] ?? jobLocationConfig.香港;
  const tierMatch = config.tiers.find((t) => t.label === label);
  if (tierMatch) {
    return { currency: config.currency, min: tierMatch.min, max: tierMatch.max };
  }
  return { currency: config.currency, min: 0, max: 0 };
}

export function isBudgetRangeValidForLocation(location: string, label: string): boolean {
  if (!label) return false;
  return getBudgetRangesForLocation(location).includes(label);
}

function currencySymbol(currency: string): string {
  return currency === "GBP" ? "£" : "$";
}

/** Format stored budget for UI. Open-ended tiers are saved as min === max (e.g. HKD $50,000+). */
export function formatJobBudget(
  budget: { currency: string; min: number; max: number },
  options?: { pendingLabel?: string },
): string {
  const { currency, min, max } = budget;
  const symbol = currencySymbol(currency);
  const invalid =
    !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0 || max < min;
  if (invalid) {
    return `${currency} ${symbol}${options?.pendingLabel ?? "—"}`;
  }

  const fmt = (n: number) => n.toLocaleString("en-US");
  if (min === max) {
    return `${currency} ${symbol}${fmt(min)}+`;
  }
  return `${currency} ${symbol}${fmt(min)}-${fmt(max)}`;
}
