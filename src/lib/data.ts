export const TRANSACTIONS = [
  { id: 1, name: "Loblaws", category: "Groceries", date: "Apr 23", amount: -142.3, icon: "shopping-cart", color: "#e8f4ed" },
  { id: 2, name: "Salary Deposit", category: "Income", date: "Apr 22", amount: 3100.0, icon: "briefcase", color: "#e8f0f8" },
  { id: 3, name: "Netflix", category: "Subscriptions", date: "Apr 21", amount: -22.99, icon: "tv", color: "#fdf0ea" },
  { id: 4, name: "Shell Gas", category: "Transport", date: "Apr 20", amount: -68.4, icon: "fuel", color: "#fdf0ea" },
  { id: 5, name: "Tim Hortons", category: "Dining", date: "Apr 19", amount: -14.75, icon: "coffee", color: "#fdf5e8" },
  { id: 6, name: "Spotify", category: "Subscriptions", date: "Apr 18", amount: -11.99, icon: "music", color: "#e8f4ed" },
  { id: 7, name: "LCBO", category: "Entertainment", date: "Apr 17", amount: -48.2, icon: "wine", color: "#fdf0ea" },
  { id: 8, name: "Freelance Payment", category: "Income", date: "Apr 16", amount: 850.0, icon: "lightbulb", color: "#e8f0f8" },
  { id: 9, name: "Rogers Mobile", category: "Bills", date: "Apr 15", amount: -89.0, icon: "smartphone", color: "#e8f0f8" },
  { id: 10, name: "Cineplex", category: "Entertainment", date: "Apr 14", amount: -32.0, icon: "clapperboard", color: "#fdf5e8" },
  { id: 11, name: "Shoppers Drug Mart", category: "Health", date: "Apr 13", amount: -27.15, icon: "pill", color: "#e8f4ed" },
  { id: 12, name: "OC Transpo", category: "Transport", date: "Apr 12", amount: -128.0, icon: "bus", color: "#e8f0f8" },
];

export const GOALS = [
  { name: "House Down Payment", emoji: "🏠", saved: 21000, target: 50000, color: "oklch(60% 0.09 155)", deadline: "Dec 2027" },
  { name: "Japan Trip", emoji: "🎋", saved: 3400, target: 5000, color: "oklch(50% 0.07 245)", deadline: "Aug 2026" },
  { name: "Emergency Fund", emoji: "🚨", saved: 9100, target: 10000, color: "oklch(63% 0.1 38)", deadline: "Jun 2026" },
  { name: "New Car", emoji: "🚗", saved: 4200, target: 18000, color: "oklch(58% 0.09 290)", deadline: "Mar 2028" },
];

export const BILLS = [
  { name: "Rogers Internet", due: "Apr 28", amount: 79.99, urgent: true },
  { name: "TD Visa", due: "May 3", amount: 1240.0, urgent: false },
  { name: "Ontario Hydro", due: "May 5", amount: 118.4, urgent: false },
  { name: "Rent", due: "May 1", amount: 2100.0, urgent: false },
  { name: "Car Insurance", due: "May 15", amount: 165.0, urgent: false },
];

export const SUBSCRIPTIONS = [
  { name: "Netflix", cycle: "Monthly", amount: 22.99, icon: "tv", color: "#fde8e8" },
  { name: "Spotify", cycle: "Monthly", amount: 11.99, icon: "music", color: "#e8f4ed" },
  { name: "Adobe CC", cycle: "Monthly", amount: 67.99, icon: "palette", color: "#fdf0ea" },
  { name: "iCloud+", cycle: "Monthly", amount: 4.99, icon: "cloud", color: "#e8f0f8" },
  { name: "ChatGPT Plus", cycle: "Monthly", amount: 27.99, icon: "sparkles", color: "#f4e8fd" },
  { name: "Globe & Mail", cycle: "Annual", amount: 8.25, icon: "newspaper", color: "#fdf5e8" },
];

export const ACCOUNTS = [
  { name: "TD Chequing", num: "·· 4821", balance: 8420.3, change: "+$340 this month", bg: "linear-gradient(135deg, oklch(18% 0.012 260), oklch(28% 0.015 260))" },
  { name: "TD Savings", num: "·· 2034", balance: 21000.0, change: "+$1,200 this month", bg: "linear-gradient(135deg, oklch(52% 0.08 155), oklch(62% 0.09 170))" },
  { name: "TFSA — Wealthsimple", num: "·· 8801", balance: 58420.0, change: "+3.2% this quarter", bg: "linear-gradient(135deg, oklch(44% 0.07 245), oklch(56% 0.08 255))" },
  { name: "TD Visa", num: "·· 3341", balance: -3248.7, change: "Min. $65 due May 3", bg: "linear-gradient(135deg, oklch(55% 0.09 38), oklch(65% 0.1 50))" },
  { name: "RRSP — Wealthsimple", num: "·· 6627", balance: 61250.0, change: "+$500 contributed", bg: "linear-gradient(135deg, oklch(60% 0.07 290), oklch(52% 0.09 280))" },
  { name: "FHSA", num: "·· 9910", balance: 8450.0, change: "Max: $40,000", bg: "linear-gradient(135deg, oklch(58% 0.09 210), oklch(50% 0.08 220))" },
];

export const SPEND_CATS = [
  { name: "Housing", amount: 2100, budget: 2100, pct: 40, color: "oklch(60% 0.09 155)" },
  { name: "Groceries", amount: 362, budget: 500, pct: 23, color: "oklch(50% 0.07 245)" },
  { name: "Dining Out", amount: 264, budget: 300, pct: 13, color: "oklch(63% 0.1 38)" },
  { name: "Transport", amount: 196, budget: 250, pct: 9, color: "oklch(58% 0.09 290)" },
  { name: "Subscriptions", amount: 136, budget: 150, pct: 7, color: "oklch(62% 0.09 210)" },
  { name: "Entertainment", amount: 80, budget: 200, pct: 4, color: "oklch(65% 0.08 60)" },
  { name: "Health", amount: 42, budget: 100, pct: 2, color: "oklch(58% 0.08 330)" },
  { name: "Other", amount: 50, budget: 100, pct: 2, color: "oklch(68% 0.04 80)" },
];

export const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
export const INCOME_DATA = [5800, 6100, 5900, 6200, 6500, 6200, 6200];
export const EXPENSE_DATA = [3800, 4200, 5100, 3900, 4400, 4180, 4180];
export const NW_DATA = [138000, 140200, 141800, 143000, 144800, 146900, 148290];

export const TABS = ["Overview", "Spending", "Goals", "Transactions", "Subscriptions", "Accounts", "Insights"] as const;
export type Tab = (typeof TABS)[number];

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2 }).format(Math.abs(n));

export const fmtShort = (n: number) => "$" + (Math.abs(n) / 1000).toFixed(1) + "K";
