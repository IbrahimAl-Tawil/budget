// Pure mappings from Plaid shapes onto Bulga's domain. Server-only.

import { AccountType } from "plaid";
import { CATEGORY_ICON_MAP } from "@/lib/ai/categorize";

/**
 * Map a Plaid account type/subtype onto Bulga's account-type string
 * (lowercase-hyphenated, matching what the manual Add-account form stores).
 */
export function mapPlaidAccountType(
  type: string,
  subtype: string | null
): string {
  const sub = (subtype || "").toLowerCase();
  if (sub === "tfsa" || sub === "rrsp" || sub === "fhsa") return sub;

  switch (type) {
    case AccountType.Depository:
      return sub === "savings" ? "savings" : "chequing";
    case AccountType.Credit:
      return "credit-card";
    case AccountType.Investment:
    case AccountType.Brokerage:
      return "investment";
    case AccountType.Loan:
    case AccountType.Other:
    default:
      return "other";
  }
}

/** True for account types that represent debt (balance shown as negative). */
export function isDebtAccount(type: string): boolean {
  return type === AccountType.Credit || type === AccountType.Loan;
}

// Plaid personal_finance_category.primary → Bulga category name.
const PFC_TO_BULGA: Record<string, string> = {
  INCOME: "Income",
  ENTERTAINMENT: "Entertainment",
  TRANSPORTATION: "Transport",
  TRAVEL: "Transport",
  MEDICAL: "Health",
  PERSONAL_CARE: "Health",
  LOAN_PAYMENTS: "Bills",
  BANK_FEES: "Bills",
  GOVERNMENT_AND_NON_PROFIT: "Bills",
  HOME_IMPROVEMENT: "Housing",
};

/**
 * Map Plaid's personal-finance category onto Bulga's fixed category set.
 * Uses the `detailed` code to split the two ambiguous primaries
 * (food → groceries vs dining; rent/utilities → housing vs bills).
 */
export function plaidCategoryToBulga(primary?: string, detailed?: string): string {
  const p = (primary || "").toUpperCase();
  const d = (detailed || "").toUpperCase();
  if (p === "FOOD_AND_DRINK") return d.includes("GROCERIES") ? "Groceries" : "Dining Out";
  if (p === "RENT_AND_UTILITIES") return d.includes("RENT") ? "Housing" : "Bills";
  return PFC_TO_BULGA[p] || "Other";
}

/** Icon + display color for a Bulga category (reuses the import pipeline's map). */
export function iconColorFor(category: string): { icon: string; color: string } {
  return CATEGORY_ICON_MAP[category] || CATEGORY_ICON_MAP.Other;
}
