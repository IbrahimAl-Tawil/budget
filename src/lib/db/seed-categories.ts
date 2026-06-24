export const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "home", color: "oklch(60% 0.09 155)" },
  { name: "Groceries", icon: "shopping-cart", color: "oklch(50% 0.07 245)" },
  { name: "Dining Out", icon: "coffee", color: "oklch(63% 0.1 38)" },
  { name: "Transport", icon: "fuel", color: "oklch(58% 0.09 290)" },
  { name: "Subscriptions", icon: "tv", color: "oklch(62% 0.09 210)" },
  { name: "Entertainment", icon: "music", color: "oklch(65% 0.08 60)" },
  { name: "Health", icon: "pill", color: "oklch(58% 0.08 330)" },
  { name: "Bills", icon: "smartphone", color: "oklch(55% 0.07 200)" },
  { name: "Income", icon: "briefcase", color: "oklch(60% 0.09 155)" },
  { name: "Other", icon: "circle", color: "oklch(68% 0.04 80)" },
] as const;

export const DEFAULT_BUDGET_SPLITS: Record<string, number> = {
  Housing: 0.35,
  Groceries: 0.12,
  "Dining Out": 0.08,
  Transport: 0.06,
  Subscriptions: 0.04,
  Entertainment: 0.05,
  Health: 0.03,
  Bills: 0.12,
  Other: 0.05,
};
