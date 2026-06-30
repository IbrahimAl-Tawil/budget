// Shared domain constants. Single source of truth so add/edit forms,
// onboarding, and settings can't drift apart.

export const ACCOUNT_TYPES = [
  "Chequing",
  "Savings",
  "TFSA",
  "RRSP",
  "FHSA",
  "Credit Card",
  "Investment",
  "Other",
] as const;

export const CURRENCIES = ["CAD", "USD", "EUR", "GBP"] as const;
