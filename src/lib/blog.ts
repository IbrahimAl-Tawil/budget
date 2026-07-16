// The otterfund blog: client-safe content + types (pure data, no server imports).
//
// ONE content cluster: choosing a budgeting app and mastering the Needs / Wants /
// Savings (50/30/20) method. Every post is written to genuinely help a reader AND
// to build topical authority around "best budgeting app", "free budgeting app",
// "AI budgeting app", the 50/30/20 rule, and the named alternatives people search
// for after leaving Mint, YNAB, Monarch, Copilot, Rocket Money, and EveryDollar.
//
// Conventions for body copy (enforced by review, not tooling):
//   · The brand name is NEVER written as plain visible text. Use the token
//     `[[of]]`; the renderer swaps it for <Wordmark />. Keep the spaces around it
//     inside the string (e.g. "with [[of]] you can") so spacing survives.
//   · Inline emphasis: wrap in **double asterisks** for <strong>.
//   · NEVER use em dashes or en dashes (— –) anywhere. Use commas, periods,
//     colons, parentheses, or "and". Hyphens in compound words (zero-based,
//     safe-to-spend, bank-grade, 256-bit) are fine.
//   · Competitor facts are kept accurate and fair. We win on the merits: free to
//     start, native 50/30/20, a calm AI advisor, one clear picture of your money.

import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlogCategory = "Method" | "Comparison" | "Roundup";

/** A block of post body. Rendered by blog-post-view's block renderer. */
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; caption?: string; head: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string };

export interface BlogPost {
  slug: string;
  /** Full title, used as the h1, the document title, and the card heading. */
  title: string;
  /** Meta description (aim ≤ 160 chars). */
  description: string;
  /** One-sentence summary for the index card and the article standfirst. */
  excerpt: string;
  category: BlogCategory;
  keywords: string[];
  readMinutes: number;
  /** ISO date (YYYY-MM-DD). Drives sort order and the monthly cadence. */
  publishedAt: string;
  updatedAt: string;
  body: BlogBlock[];
  /** Explicit related slugs; falls back to same-cluster recency. */
  related?: string[];
}

/** Author + publisher facts for Article JSON-LD. */
export const BLOG_AUTHOR = {
  name: `The ${SITE_NAME} team`,
  url: `${SITE_URL}/blog`,
} as const;

// ── Posts ───────────────────────────────────────────────────────────────────
// Ordered oldest → newest in source; getAllPosts() sorts newest-first for display.

export const BLOG_POSTS: BlogPost[] = [
  // 1 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "50-30-20-rule-explained",
    title: "The 50/30/20 Rule, Explained: The Simplest Way to Budget Your Money",
    description:
      "The 50/30/20 rule splits your income across needs, wants, and savings. Learn how it works, how to calculate it, and the easiest app to run it on autopilot.",
    excerpt:
      "Half for needs, a third for wants, a fifth for savings. Here is how the 50/30/20 rule actually works, and how to run it without a spreadsheet.",
    category: "Method",
    keywords: [
      "50/30/20 rule",
      "50 30 20 budget",
      "how to allocate money",
      "needs wants savings",
      "budgeting method",
      "how to budget",
      "monthly budget planner",
    ],
    readMinutes: 8,
    publishedAt: "2025-10-06",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "Most budgets fail for the same reason: they ask you to track forty categories and feel guilty about all of them. The 50/30/20 rule does the opposite. It gives you three buckets, one clear target for each, and permission to stop micromanaging every latte. It is the fastest way to go from no plan to a plan you will actually keep.",
      },
      { type: "h2", text: "What is the 50/30/20 rule?" },
      {
        type: "p",
        text: "The 50/30/20 rule is a budgeting method that splits your after-tax income into three parts. Popularized by Senator Elizabeth Warren, it has become the default starting point for personal budgeting because it is easy to remember and hard to overthink.",
      },
      {
        type: "ul",
        items: [
          "**50% to needs.** Rent or mortgage, utilities, groceries, insurance, minimum debt payments, transport. The things you truly cannot skip.",
          "**30% to wants.** Dining out, streaming, travel, hobbies, the upgrade you do not strictly need. The life part of your money.",
          "**20% to savings.** Emergency fund, retirement, investments, and extra debt payoff beyond the minimums.",
        ],
      },
      { type: "h2", text: "Why the 50/30/20 rule works" },
      {
        type: "p",
        text: "It works because it is a ceiling, not a chore. You are not logging every purchase into a category. You are keeping three running totals and asking one question at the end of the month: did each bucket land near its target? That is a decision you can make in thirty seconds instead of a spreadsheet you dread on Sunday nights.",
      },
      {
        type: "p",
        text: "It also protects the part of budgeting people skip. When savings is a named 20% bucket that gets funded first, it stops being whatever happens to be left over (which, for most people, is nothing). You pay your future self before you pay the restaurant.",
      },
      { type: "h2", text: "What counts as a need, a want, and savings" },
      { type: "h3", text: "Needs (50%)" },
      {
        type: "p",
        text: "A need is an expense you would keep paying even if money were tight this month. If skipping it has real consequences (eviction, a late fee, no way to get to work), it belongs here.",
      },
      {
        type: "ul",
        items: [
          "Housing: rent, mortgage, property tax, essential home insurance",
          "Utilities: electricity, water, heat, basic phone and internet",
          "Groceries and household basics",
          "Transport: car payment, fuel, transit pass, insurance",
          "Minimum payments on loans and credit cards",
        ],
      },
      { type: "h3", text: "Wants (30%)" },
      {
        type: "p",
        text: "A want is everything that makes life good but is technically optional. The trick is honesty: the premium streaming bundle and the nice cut of steak are wants, not needs, even when they feel essential.",
      },
      {
        type: "ul",
        items: [
          "Restaurants, takeout, and coffee runs",
          "Streaming, gaming, subscriptions, and apps",
          "Travel, concerts, and hobbies",
          "Clothes and gadgets beyond the basics",
        ],
      },
      { type: "h3", text: "Savings (20%)" },
      {
        type: "p",
        text: "Savings is money that grows your net worth or shrinks your debt faster than required. If it makes tomorrow safer, it lives here.",
      },
      {
        type: "ul",
        items: [
          "Emergency fund (aim for three to six months of needs)",
          "Retirement and investment contributions",
          "Sinking funds for known future costs (a trip, a car, a down payment)",
          "Extra debt payments above the minimum",
        ],
      },
      { type: "h2", text: "How to calculate your 50/30/20 budget" },
      {
        type: "ol",
        items: [
          "Find your monthly after-tax income (what actually lands in your account).",
          "Multiply by 0.5 for your needs ceiling.",
          "Multiply by 0.3 for your wants ceiling.",
          "Multiply by 0.2 for your savings floor.",
          "Sort last month's spending into the three buckets and compare.",
        ],
      },
      {
        type: "callout",
        title: "A quick example",
        text: "On $4,000 a month after tax, the 50/30/20 rule gives you $2,000 for needs, $1,200 for wants, and $800 for savings. If your needs come to $2,300, you are running hot on essentials, so the fix is either to trim a fixed cost or to borrow a little from wants until it balances.",
      },
      { type: "h2", text: "When to adjust the ratios" },
      {
        type: "p",
        text: "The rule is a starting point, not a straitjacket. If you live in a high-rent city, needs may not fit in 50%, and that is fine. Popular variations keep the same three-bucket simplicity with different targets:",
      },
      {
        type: "ul",
        items: [
          "**70/20/10**: for high fixed costs like big-city rent, this eases the needs ceiling.",
          "**60/20/20**: a steady-saver split for people who want to bank a bit more.",
          "**50/20/30**: an aggressive savings split when you are chasing a goal or paying down debt fast.",
        ],
      },
      { type: "h2", text: "The hard part is not the math, it is the tracking" },
      {
        type: "p",
        text: "You can calculate a 50/30/20 budget on a napkin. Keeping it current, month after month, is the real work. For years the default answer was **Mint**, the free tracker from Intuit, but Mint shut down in March 2024 and pushed users to Credit Karma, which does not budget the way Mint did. Other popular apps are strong tools but pull you away from this simple three-bucket model.",
      },
      {
        type: "p",
        text: "**YNAB** and **EveryDollar** are built around zero-based budgeting, a different and more hands-on philosophy where every dollar gets a job across dozens of categories. **Copilot Money** and **Monarch Money** are trackers that lean on flexible categories rather than a native needs, wants, and savings split, and both are subscription-only with no free tier. If the 50/30/20 rule is the method you actually want to run, most of the market makes you rebuild it yourself.",
      },
      { type: "h2", text: "How otterfund runs the 50/30/20 rule for you" },
      {
        type: "p",
        text: "[[of]] is built on the needs, wants, and savings model from the first screen. You pick a split (50/30/20, 70/20/10, 60/20/20, or an aggressive saver ratio), and every dollar of income is allocated for you. Spending is sorted into the three buckets automatically, so the month-end question answers itself.",
      },
      {
        type: "ul",
        items: [
          "Pick a proven split and [[of]] does the allocation math instantly.",
          "Transactions land in Needs, Wants, or Savings without manual tagging.",
          "Savings is funded by priority across your goals, before you spend.",
          "A calm AI advisor turns your own numbers into plain-language nudges.",
          "It is free to start, with no credit card required.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "The 50/30/20 rule is the simplest budget that works. The only thing that beats doing the math by hand is an app that does it for you and keeps it current. That is exactly what [[of]] is for.",
      },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-allocate-your-paycheck",
    title: "How to Allocate Your Paycheck: A Simple Needs, Wants, and Savings System",
    description:
      "Learn how to split every paycheck across needs, wants, and savings, automate the transfers, and stop wondering where your money went by month's end.",
    excerpt:
      "Every paycheck is a chance to tell your money where to go. Here is a simple system for allocating income the day it lands.",
    category: "Method",
    keywords: [
      "how to allocate my income",
      "how to split your paycheck",
      "income allocation",
      "paycheck budgeting",
      "how to save money each month",
      "automatic savings",
    ],
    readMinutes: 7,
    publishedAt: "2025-11-04",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "The difference between people who save and people who mean to save is rarely income. It is timing. Savers decide where their money goes the moment it arrives, before spending has a chance to fill the space. Here is how to allocate a paycheck so the plan holds all month.",
      },
      { type: "h2", text: "Step 1: Start from take-home pay, not gross" },
      {
        type: "p",
        text: "Allocate the money that actually reaches your account after tax and deductions. Budgeting off your gross salary is the classic mistake, because the number you plan around is not the number you can spend. If your pay varies (freelance, tips, commission), use a conservative average of your lowest recent months.",
      },
      { type: "h2", text: "Step 2: Give every dollar a destination" },
      {
        type: "p",
        text: "The cleanest system is three destinations, the same ones behind the 50/30/20 rule:",
      },
      {
        type: "ul",
        items: [
          "**Needs** cover the non-negotiables: housing, utilities, groceries, transport, insurance, minimum debt payments.",
          "**Wants** cover the life stuff: dining, subscriptions, travel, hobbies.",
          "**Savings** covers your future: emergency fund, investments, and specific goals.",
        ],
      },
      {
        type: "p",
        text: "A common split is 50% needs, 30% wants, 20% savings, but the exact ratio matters less than the habit of assigning every dollar a home on payday.",
      },
      { type: "h2", text: "Step 3: Pay savings first, not last" },
      {
        type: "p",
        text: "This is the one move that changes everything. Treat your savings allocation like a bill that is due the day you get paid. When savings comes out first, you spend what is left guilt-free, because the important part is already done. When savings comes last, it competes with every impulse purchase, and it usually loses.",
      },
      {
        type: "callout",
        title: "The payday routine",
        text: "On $2,000 per paycheck with a 50/30/20 split, move $400 to savings the same day: some to your emergency fund, some to your goals. Then $1,000 covers needs and $600 covers wants. You never have to feel bad about the $600, because it is genuinely yours to spend.",
      },
      { type: "h2", text: "Step 4: Split savings across goals by priority" },
      {
        type: "p",
        text: "Savings is not one pile. It is an emergency fund, a trip, a down payment, and retirement, all pulling at once. Rank them, then fund them in order so the most important goal fills first. This keeps you from spreading money so thin that nothing ever finishes.",
      },
      { type: "h2", text: "Step 5: Automate so willpower is not required" },
      {
        type: "p",
        text: "Every step above works better on autopilot. Automatic transfers on payday remove the daily decision, and a budgeting app that categorizes spending for you removes the tracking. The less the system depends on you remembering, the longer it lasts.",
      },
      {
        type: "p",
        text: "This is where tool choice matters. **Empower** (formerly Personal Capital) tracks net worth, but it barely budgets, offering only a single overall spending goal rather than a real allocation. **Rocket Money** is built around canceling subscriptions and negotiating bills, with budgeting as a side feature. **Goodbudget** uses a manual envelope system that many people find tedious to keep up. None of them is designed around the simple act of allocating a paycheck into needs, wants, and savings.",
      },
      { type: "h2", text: "How otterfund allocates your paycheck automatically" },
      {
        type: "p",
        text: "[[of]] is built for exactly this. Tell it your income and pick a split, and it routes every dollar into Needs, Wants, and Savings, then funds your goals by priority. Spending is categorized for you, so you always know which bucket a purchase came from without lifting a finger.",
      },
      {
        type: "ul",
        items: [
          "Set income once and [[of]] allocates each paycheck automatically.",
          "Savings is funded first and split across goals by priority.",
          "Transactions sort into buckets on their own, no manual tagging.",
          "Connect a bank securely through Plaid or import a statement to start.",
          "Free to begin, so you can build the habit before you ever pay.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Allocating your paycheck is not about restriction. It is about deciding once, on payday, so the rest of the month runs itself. [[of]] makes that decision automatic.",
      },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "best-mint-alternatives",
    title: "The Best Mint Alternatives in 2026 (After the Shutdown)",
    description:
      "Mint shut down in 2024 and Credit Karma is not a real replacement. Here are the best Mint alternatives in 2026, and why a free, calm budgeting app wins.",
    excerpt:
      "Mint is gone and Credit Karma does not budget the way Mint did. Here is where former Mint users should actually go in 2026.",
    category: "Roundup",
    keywords: [
      "mint alternatives",
      "best mint alternative",
      "mint shut down",
      "apps like mint",
      "free budgeting app",
      "mint replacement",
      "credit karma budgeting",
    ],
    readMinutes: 9,
    publishedAt: "2025-12-02",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "For over a decade, **Mint** was the default free budgeting app. Then, in March 2024, Intuit shut it down and pushed its millions of users toward Credit Karma. The problem: Credit Karma is a credit-monitoring product, and it does not budget the way Mint did. If you are still looking for a proper Mint replacement in 2026, here is an honest guide to your options.",
      },
      { type: "h2", text: "Why Credit Karma is not a Mint replacement" },
      {
        type: "p",
        text: "Intuit owns both Mint and Credit Karma, so migrating users there was convenient for Intuit. It was not convenient for budgeters. Credit Karma can show linked accounts, net worth, and transactions, but it does not offer real budgets, custom categories, or the spending-versus-plan view that made Mint useful. For most people, the move felt like losing budgeting entirely and keeping only a credit score.",
      },
      { type: "h2", text: "What to look for in a Mint alternative" },
      {
        type: "ul",
        items: [
          "**A real budget**, not just tracking. Categories and clear targets, so you can see where you stand.",
          "**Automatic categorization**, so you are not tagging transactions by hand.",
          "**A free option**, because Mint was free and paying $100 a year is a big jump.",
          "**Secure bank connections** through a trusted aggregator like Plaid.",
          "**A calm, modern interface**, because Mint's ads and clutter were a big reason people left even before it closed.",
        ],
      },
      { type: "h2", text: "The main Mint alternatives, compared" },
      {
        type: "table",
        caption: "Popular Mint alternatives in 2026 (approximate pricing).",
        head: ["App", "Free tier?", "Paid price", "Best known for"],
        rows: [
          ["[[of]]", "Yes", "From $15/mo optional", "Needs/wants/savings budgeting with an AI advisor"],
          ["Monarch Money", "No", "About $99.99/year", "Net worth and couples tracking"],
          ["YNAB", "No", "$109/year", "Hands-on zero-based budgeting"],
          ["Copilot Money", "No", "$95/year", "Apple-only, no Android app"],
          ["Rocket Money", "Yes (limited)", "About $7 to $14/mo", "Canceling subscriptions"],
          ["Empower", "Yes", "Free dashboard", "Investment and net worth tracking"],
        ],
      },
      { type: "h3", text: "Monarch Money" },
      {
        type: "p",
        text: "**Monarch Money** absorbed a large share of Mint's users, partly because it was co-founded by a former Mint product leader. It is a tracker with net worth views and features aimed at couples. The catch is that it is subscription-only at around $99.99 per year with no free tier, so the very thing Mint users valued most, a free product, is gone.",
      },
      { type: "h3", text: "YNAB (You Need A Budget)" },
      {
        type: "p",
        text: "**YNAB** takes a very different approach from Mint. It uses zero-based budgeting where you assign every dollar a job, which is demanding to keep up. At $109 per year with a steep learning curve, it is a big leap for someone who just wants Mint's simple tracking back.",
      },
      { type: "h3", text: "Copilot Money" },
      {
        type: "p",
        text: "**Copilot Money** is an Apple-focused app with machine-learning categorization. But it has no free tier at $95 per year, and it still has no Android app, so a large slice of former Mint users cannot use it at all.",
      },
      { type: "h3", text: "Rocket Money and Empower" },
      {
        type: "p",
        text: "**Rocket Money** has a free tier, but its focus is subscription cancellation and bill negotiation, not budgeting, and its bill-negotiation service takes a cut of your savings. **Empower** offers a free dashboard, but it is built for tracking investments and net worth, not for budgeting a paycheck, so it leaves the actual budget unsolved.",
      },
      { type: "h2", text: "The closest thing to what Mint should have become" },
      {
        type: "p",
        text: "If you want Mint's original promise, free, automatic, and genuinely helpful, without the ads and clutter, [[of]] is the closest fit in 2026. It keeps the free starting point that made Mint approachable, adds the calm design Mint never had, and does what Credit Karma refuses to: actually budget your money.",
      },
      {
        type: "ul",
        items: [
          "Free to start with unlimited manual accounts and the full needs, wants, and savings budget.",
          "Automatic categorization and secure Plaid bank connections on paid plans.",
          "A native 50/30/20 model instead of a wall of forty categories.",
          "An AI advisor that reads your own numbers and offers quiet, plain-language guidance.",
          "No ads, ever, and your data is never sold.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Mint is not coming back, and Credit Karma is not the answer. If you want free, automatic budgeting with a calmer interface than Mint ever had, [[of]] is the Mint alternative worth switching to.",
      },
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "best-free-budgeting-apps-2026",
    title: "The Best Free Budgeting Apps in 2026",
    description:
      "Most budgeting apps are subscription-only now. Here are the genuinely free budgeting apps in 2026, what each does, and which one to actually pick.",
    excerpt:
      "The budgeting world went subscription-only. These are the apps that still let you start for free, and the one we would choose.",
    category: "Roundup",
    keywords: [
      "best free budgeting app",
      "free budgeting app",
      "budgeting app free",
      "best budgeting app 2026",
      "free budget tracker",
      "no cost budgeting app",
    ],
    readMinutes: 9,
    publishedAt: "2026-01-08",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "When Mint closed in 2024, it took the most popular free budgeting app with it, and the market quietly moved to paid subscriptions. Today the best-known names, YNAB, Monarch, Copilot, and Simplifi, all charge $80 to $110 a year with no free tier. But free budgeting apps still exist in 2026. Here is an honest look at the ones worth your time.",
      },
      { type: "h2", text: "What free really means" },
      {
        type: "p",
        text: "Watch for three flavors of free. Some apps are free forever on a real core product. Some offer a limited free tier meant to nudge you to pay. And some are free because they monetize you in other ways, through ads, lead generation, or upsells into advisory services. All three can be fine, but you should know which one you are choosing.",
      },
      { type: "h2", text: "The genuinely free options in 2026" },
      { type: "h3", text: "otterfund" },
      {
        type: "p",
        text: "[[of]] is free to start with no credit card, and the free plan is a real budget, not a demo. You get unlimited manual accounts and the full needs, wants, and savings model, so you can run a complete 50/30/20 budget without paying anything. Paid plans add automatic bank sync, the AI advisor, and investment tracking when you want them, but the core budgeting is genuinely free.",
      },
      { type: "h3", text: "Empower (formerly Personal Capital)" },
      {
        type: "p",
        text: "**Empower** offers a fully free dashboard for tracking net worth and investments. The trade-off is that it is not really a budgeting app: it gives you a single overall spending goal rather than category budgets, and the free product exists to funnel you toward paid wealth-management services, which means sales calls once your balances grow.",
      },
      { type: "h3", text: "Rocket Money" },
      {
        type: "p",
        text: "**Rocket Money** has a free tier that tracks spending and subscriptions. It can surface forgotten charges, but the free budgeting is thin (just a couple of custom categories), and the product is designed to sell you Premium and a bill-negotiation service that keeps a share of what it saves you.",
      },
      { type: "h3", text: "PocketGuard and Goodbudget" },
      {
        type: "p",
        text: "**PocketGuard** has a free tier built around a 'safe to spend' number, but it is capped at two accounts and two budget categories, which is tight for a real budget. **Goodbudget** offers a free envelope-budgeting plan, but it is limited to twenty envelopes and one account, and it is manual by default, so you enter transactions yourself unless you pay.",
      },
      { type: "h2", text: "Free apps, side by side" },
      {
        type: "table",
        caption: "Free budgeting options in 2026 and their catch.",
        head: ["App", "What's free", "The catch"],
        rows: [
          ["[[of]]", "Full needs/wants/savings budget, unlimited manual accounts", "Bank sync and AI are paid"],
          ["Empower", "Net worth and investment dashboard", "Barely budgets, advisory sales calls"],
          ["Rocket Money", "Spending and subscription tracking", "Thin budgeting, upsells and fee-based services"],
          ["PocketGuard", "'Safe to spend' with limits", "Only 2 accounts and 2 categories free"],
          ["Goodbudget", "20 envelopes, 1 account", "Manual entry, no free bank sync"],
        ],
      },
      { type: "h2", text: "How to choose" },
      {
        type: "p",
        text: "If your only priority is investments and net worth, Empower's free dashboard covers that. If you mostly want to catch runaway subscriptions, Rocket Money's free tier does that. But if you want to actually budget, to allocate your income and see needs, wants, and savings clearly, most free tiers are too limited or too far from budgeting to help.",
      },
      { type: "h2", text: "Why otterfund is the best free budgeting app for most people" },
      {
        type: "p",
        text: "[[of]] is the rare free option where the free plan is a complete budget. You are not renting a taste of the product, and you are not the product being sold to advertisers. You get the whole needs, wants, and savings system, a calm interface, and the room to upgrade only if and when automatic bank sync or the AI advisor becomes worth it to you.",
      },
      {
        type: "ul",
        items: [
          "A full 50/30/20 budget on the free plan, not a trial.",
          "No credit card to start and no ads.",
          "Optional paid upgrades for bank sync, AI insights, and investments.",
          "Your financial data is private by default and never sold.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Free budgeting did not die with Mint. If you want a genuinely free, genuinely complete budget in 2026, start with [[of]] and pay only if you decide the extras are worth it.",
      },
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "otterfund-vs-ynab",
    title: "otterfund vs YNAB: A Calmer, Free Way to Budget",
    description:
      "YNAB is hands-on zero-based budgeting at $109 a year. otterfund is a calmer needs, wants, and savings app that starts free. Here is how they compare.",
    excerpt:
      "YNAB asks you to give every dollar a job across dozens of categories. otterfund asks you to pick a split and lets it do the work. Here is the honest comparison.",
    category: "Comparison",
    keywords: [
      "otterfund vs ynab",
      "ynab alternative",
      "cheaper than ynab",
      "free ynab alternative",
      "ynab vs 50/30/20",
      "best budgeting app",
    ],
    readMinutes: 8,
    publishedAt: "2026-02-05",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "**YNAB** (You Need A Budget) has a devoted following, but it is demanding and subscription-only, and it is not the right fit for everyone. If you have wondered whether there is a calmer, cheaper way to get the same control, here is an honest comparison of [[of]] and YNAB.",
      },
      { type: "h2", text: "The core difference: philosophy" },
      {
        type: "p",
        text: "YNAB is built on zero-based budgeting. You assign every single dollar a job across as many categories as you create, and you re-balance whenever life changes. It is a hands-on method that demands ongoing work. [[of]] is built on the needs, wants, and savings model. You pick a split like 50/30/20, and the app allocates your income into three clear buckets automatically. One approach maximizes control at the cost of effort. The other maximizes calm at the cost of granularity.",
      },
      { type: "h2", text: "Price" },
      {
        type: "p",
        text: "YNAB costs $14.99 per month or $109 per year, with no free tier once the 34-day trial ends. [[of]] is free to start with no credit card, and its paid plans begin at $15 per month only if you want automatic bank sync, the AI advisor, and investment tracking. For anyone who wants to budget without a subscription, that is a meaningful difference.",
      },
      {
        type: "table",
        caption: "otterfund vs YNAB at a glance.",
        head: ["", "otterfund", "YNAB"],
        rows: [
          ["Free tier", "Yes, a full budget", "No, trial only"],
          ["Starting price", "$0", "$14.99/mo or $109/yr"],
          ["Method", "Needs / wants / savings (50/30/20)", "Zero-based, every dollar a job"],
          ["Learning curve", "Minutes", "Steep"],
          ["AI advisor", "Yes", "No"],
          ["Investment tracking", "Yes (paid)", "No"],
          ["Bank sync", "Yes, via Plaid (paid)", "Yes, via Plaid"],
        ],
      },
      { type: "h2", text: "Learning curve" },
      {
        type: "p",
        text: "This is where many people quietly give up on YNAB. Its method is genuinely different from how most of us think about money, and it takes real study to get comfortable. [[of]] is designed to make sense on the first screen: pick a split, connect or import your accounts, and you have a working budget in minutes. If you have started and abandoned budgeting apps before, the difference in friction matters.",
      },
      { type: "h2", text: "AI and insights" },
      {
        type: "p",
        text: "YNAB is deliberately manual and does not include an AI advisor. That is part of its philosophy, and some people love it. But if you want your app to notice patterns for you, [[of]] includes an AI advisor that reads your own spending and savings and offers quiet, plain-language nudges instead of leaving you to interpret every report yourself.",
      },
      { type: "h2", text: "Who should pick which" },
      {
        type: "ul",
        items: [
          "**Pick YNAB** if you love hands-on control, enjoy the zero-based method, and do not mind paying $109 a year for it.",
          "**Pick [[of]]** if you want a calm, automatic budget built on 50/30/20, an AI advisor, and the option to start free.",
        ],
      },
      { type: "h2", text: "Switching from YNAB" },
      {
        type: "p",
        text: "You do not have to give up structure to leave YNAB. [[of]] keeps the discipline of assigning your income a destination, it just does the assigning for you across three buckets instead of asking you to manage dozens of categories. You can start on the free plan, keep YNAB running in parallel for a month, and decide once you see your money laid out calmly.",
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "YNAB is a great tool for people who want maximum control and will do the work. If you want most of the benefit with a fraction of the effort, and the option to start for free, [[of]] is the calmer alternative.",
      },
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "otterfund-vs-monarch-money",
    title: "otterfund vs Monarch Money: Which Budgeting App Wins in 2026?",
    description:
      "Monarch Money is a subscription Mint successor at $99.99 a year. otterfund starts free and budgets with a native 50/30/20 model. See how they compare.",
    excerpt:
      "Monarch became a popular Mint replacement, but it is subscription-only. Here is how it stacks up against a free, method-first alternative.",
    category: "Comparison",
    keywords: [
      "otterfund vs monarch money",
      "monarch money alternative",
      "monarch money review",
      "cheaper than monarch",
      "free monarch alternative",
      "best budgeting app 2026",
    ],
    readMinutes: 8,
    publishedAt: "2026-03-04",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "**Monarch Money** rose fast after Mint's shutdown, helped by a founding team with Mint roots. It is subscription-only, and it takes a different approach to budgeting than a method-first app. Here is how [[of]] and Monarch compare in 2026.",
      },
      { type: "h2", text: "How Monarch Money works" },
      {
        type: "p",
        text: "Monarch shows net worth across all your accounts, supports couples and shared finances, and added an AI assistant and AI-assisted categorization. It is built to be an all-in-one financial dashboard for a household, which is a different job than running a specific budgeting method.",
      },
      { type: "h2", text: "Where the two differ" },
      {
        type: "p",
        text: "Monarch is a flexible tracker: you build your own category budgets and watch the totals. [[of]] is a method-first app: it is built around the needs, wants, and savings split, so you pick a proven ratio and it allocates for you. If you want to run the 50/30/20 rule specifically, [[of]] does it natively, while Monarch asks you to construct and maintain that structure yourself.",
      },
      { type: "h2", text: "Price is the headline" },
      {
        type: "p",
        text: "Monarch is subscription-only at about $14.99 per month or $99.99 per year, with only a short trial and no free tier. [[of]] is free to start, and paid plans (from $15 per month) are optional add-ons for bank sync, AI, and investments. For a lot of people leaving Mint, the ability to keep budgeting for free is the deciding factor.",
      },
      {
        type: "table",
        caption: "otterfund vs Monarch Money at a glance.",
        head: ["", "otterfund", "Monarch Money"],
        rows: [
          ["Free tier", "Yes, a full budget", "No, trial only"],
          ["Starting price", "$0", "About $99.99/yr"],
          ["Method", "Native 50/30/20 buckets", "Flexible custom categories"],
          ["AI advisor", "Yes", "Yes"],
          ["Couples / sharing", "Personal focus", "Strong"],
          ["Net worth tracking", "Yes", "Yes"],
          ["Bank sync", "Yes, via Plaid (paid)", "Yes"],
        ],
      },
      { type: "h2", text: "AI, on both sides" },
      {
        type: "p",
        text: "Both apps use AI, so the question is what it is for. Monarch's assistant lets you ask questions about your data. [[of]]'s advisor is proactive and quiet: it reads your spending and savings and offers plain-language nudges toward your goals, without lecturing. Neither replaces your judgment.",
      },
      { type: "h2", text: "Who should pick which" },
      {
        type: "ul",
        items: [
          "**Pick Monarch** if you want a household dashboard with couples features and do not mind paying about $100 a year for it.",
          "**Pick [[of]]** if you want a native 50/30/20 budget, an AI advisor, and the option to start free before you ever pay.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Monarch is a subscription tracker built for households. If you want a budget built around the needs, wants, and savings method, and you would rather start free, [[of]] is the better fit.",
      },
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "otterfund-vs-copilot-money",
    title: "otterfund vs Copilot Money: The Free, Everywhere Alternative",
    description:
      "Copilot Money is an Apple-first app with no Android and no free tier. otterfund works in any browser and starts free. Here is the comparison.",
    excerpt:
      "Copilot is Apple-only and subscription-only. otterfund runs anywhere and starts free. Here is how they really compare.",
    category: "Comparison",
    keywords: [
      "otterfund vs copilot money",
      "copilot money alternative",
      "copilot money android",
      "copilot money review",
      "free copilot alternative",
      "budgeting app for android",
    ],
    readMinutes: 7,
    publishedAt: "2026-04-07",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "**Copilot Money** is an Apple-first app known for its design and machine-learning categorization. But it has two limitations that rule it out for a lot of people: it has no Android app, and it has no free tier. Here is how [[of]] compares.",
      },
      { type: "h2", text: "The Android problem" },
      {
        type: "p",
        text: "Copilot runs on iPhone, iPad, and Mac, and it added a web app in late 2025, but it still has no Android app. If you carry an Android phone, Copilot is simply not an option for daily use. [[of]] runs in any modern browser, so it works the same on Android, iPhone, Windows, or Mac, with nothing to gatekeep by device.",
      },
      { type: "h2", text: "The price problem" },
      {
        type: "p",
        text: "Copilot has no free tier and costs about $13 per month or $95 per year, a commitment you make before you have even lived with the app. [[of]] is free to start with no credit card, so you can build a real budget first and only pay (from $15 per month) if you want bank sync, the AI advisor, and investment tracking.",
      },
      {
        type: "table",
        caption: "otterfund vs Copilot Money at a glance.",
        head: ["", "otterfund", "Copilot Money"],
        rows: [
          ["Free tier", "Yes, a full budget", "No"],
          ["Starting price", "$0", "$13/mo or $95/yr"],
          ["Android", "Yes (any browser)", "No"],
          ["Method", "Native 50/30/20 buckets", "Flexible categories"],
          ["AI / smart categorization", "Yes", "Yes"],
          ["Household / sharing", "Personal focus", "Single user only"],
        ],
      },
      { type: "h2", text: "Method versus tracking" },
      {
        type: "p",
        text: "Copilot is a tracker with adaptive categorization, but like most trackers it leaves the budgeting framework to you. [[of]] is built around the needs, wants, and savings method, so it does not just record where your money went, it helps you decide where it should go using a proven split. If you want structure rather than just a ledger, that is the difference.",
      },
      { type: "h2", text: "Who should pick which" },
      {
        type: "ul",
        items: [
          "**Pick Copilot** if you are all-in on Apple devices and will pay for a tracker.",
          "**Pick [[of]]** if you use Android or mixed devices, want a native 50/30/20 budget, and would like to start free.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Copilot is an Apple-only app for users who will pay. If you want a budget that works on every device and starts free, [[of]] is the alternative that does not lock you out.",
      },
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "otterfund-vs-rocket-money",
    title: "otterfund vs Rocket Money: Budgeting App or Bill Negotiator?",
    description:
      "Rocket Money focuses on canceling subscriptions but is thin on budgeting, and its bill service takes a cut. otterfund is a full budget that starts free.",
    excerpt:
      "Rocket Money is really a subscription-canceling tool with budgeting bolted on. If you want to actually budget, here is the comparison.",
    category: "Comparison",
    keywords: [
      "otterfund vs rocket money",
      "rocket money alternative",
      "rocket money review",
      "rocket money budgeting",
      "cancel subscriptions app",
      "free budgeting app",
    ],
    readMinutes: 7,
    publishedAt: "2026-05-05",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "**Rocket Money** (formerly Truebill) is a popular app, but it is worth being clear about what it is really for. Its standout features are finding and canceling forgotten subscriptions and negotiating your bills. Budgeting is a secondary feature. If your main goal is a genuine budget, here is how [[of]] compares.",
      },
      { type: "h2", text: "What Rocket Money actually does" },
      {
        type: "p",
        text: "Rocket Money's main function is spotting recurring charges you forgot about and helping you cancel them, and it will attempt to negotiate bills like cable and internet on your behalf. It also tracks spending and net worth. What it is not, primarily, is a budgeting app.",
      },
      { type: "h2", text: "The catches" },
      {
        type: "p",
        text: "Two things surprise people. First, the free tier's budgeting is thin, with only a couple of custom categories, and the fuller features sit behind a Premium plan (a pay-what-you-want range of roughly $7 to $14 per month). Second, the bill-negotiation service is not really free: Rocket Money keeps a significant percentage of the first-year savings it finds. It is a fee dressed as a favor.",
      },
      {
        type: "table",
        caption: "otterfund vs Rocket Money at a glance.",
        head: ["", "otterfund", "Rocket Money"],
        rows: [
          ["Primary purpose", "Budgeting (needs/wants/savings)", "Canceling subscriptions"],
          ["Free tier", "Yes, a full budget", "Yes, but thin budgeting"],
          ["Paid price", "From $15/mo optional", "About $7 to $14/mo"],
          ["Method", "Native 50/30/20", "Basic categories"],
          ["AI advisor", "Yes", "Automated insights"],
          ["Hidden fees", "None", "Bill negotiation takes a cut"],
        ],
      },
      { type: "h2", text: "If budgeting is the goal" },
      {
        type: "p",
        text: "Rocket Money can help you plug leaks, but plugging leaks is not the same as steering the ship. [[of]] is built to be the budget itself: it allocates your income into needs, wants, and savings, funds your goals by priority, and keeps a clear picture of where every dollar goes. You can absolutely use a tool like Rocket Money to cancel a few subscriptions and still run your actual budget in [[of]].",
      },
      { type: "h2", text: "Who should pick which" },
      {
        type: "ul",
        items: [
          "**Use Rocket Money** if your main problem is forgotten subscriptions and you want help canceling them.",
          "**Use [[of]]** if you want a real, method-based budget with an AI advisor that starts free and hides no fees.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "Rocket Money is a subscription cleaner first and a budget second. If you want budgeting to be the point, [[of]] is the free-to-start app built for exactly that.",
      },
    ],
  },

  // 9 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "otterfund-vs-everydollar",
    title: "otterfund vs EveryDollar: Two Very Different Ways to Budget",
    description:
      "EveryDollar uses strict zero-based budgeting from the Ramsey system. otterfund uses a flexible 50/30/20 model and starts free. Here is the honest comparison.",
    excerpt:
      "EveryDollar is zero-based budgeting the Ramsey way, and its free tier is manual only. Here is how a flexible, free-to-start alternative compares.",
    category: "Comparison",
    keywords: [
      "otterfund vs everydollar",
      "everydollar alternative",
      "everydollar review",
      "zero based budgeting vs 50/30/20",
      "free everydollar alternative",
      "budgeting app",
    ],
    readMinutes: 7,
    publishedAt: "2026-06-03",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "**EveryDollar** is the budgeting app from Ramsey Solutions, built tightly around Dave Ramsey's zero-based method and his Baby Steps. Some people prefer that structure, but its approach and its pricing are worth understanding before you commit. Here is how [[of]] compares.",
      },
      { type: "h2", text: "Two different philosophies" },
      {
        type: "p",
        text: "EveryDollar uses strict zero-based budgeting, where income minus expenses must equal zero and every dollar is assigned a category before the month begins. It is prescriptive by design and tied to the Ramsey plan of paying off debt in a set order. [[of]] uses the needs, wants, and savings model, a more flexible framework where you pick a split like 50/30/20 and adjust as life changes. Neither is wrong. They suit different temperaments.",
      },
      { type: "h2", text: "The free-tier catch" },
      {
        type: "p",
        text: "EveryDollar has a free version, but it is manual only: there is no automatic bank connection, so you type in every transaction yourself. Automatic sync requires Premium, which runs about $17.99 per month or $79.99 per year, one of the pricier plans around. [[of]] is free to start with the full needs, wants, and savings budget, and automatic bank sync is available on paid plans that begin at $15 per month.",
      },
      {
        type: "table",
        caption: "otterfund vs EveryDollar at a glance.",
        head: ["", "otterfund", "EveryDollar"],
        rows: [
          ["Method", "Flexible 50/30/20", "Strict zero-based"],
          ["Free tier", "Full budget", "Manual entry only"],
          ["Paid price", "From $15/mo optional", "About $17.99/mo or $79.99/yr"],
          ["Bank sync on free plan", "No (paid)", "No (paid)"],
          ["AI advisor", "Yes", "No"],
          ["Ties to a program", "None", "Ramsey Baby Steps"],
        ],
      },
      { type: "h2", text: "AI and flexibility" },
      {
        type: "p",
        text: "EveryDollar is deliberately manual and does not include an AI advisor, and its structure assumes you follow the Ramsey approach, including its stance against credit cards. [[of]] adds an AI advisor that reads your own numbers and offers quiet guidance, and it does not require you to adopt any particular financial ideology. You keep your own plan and your own cards.",
      },
      { type: "h2", text: "Who should pick which" },
      {
        type: "ul",
        items: [
          "**Pick EveryDollar** if you follow the Ramsey Baby Steps and want an app built specifically around zero-based budgeting.",
          "**Pick [[of]]** if you want a flexible 50/30/20 budget, an AI advisor, free bank-free budgeting to start, and no attached program.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "EveryDollar fits people committed to the Ramsey method and willing to enter transactions by hand or pay for sync. If you want a flexible, AI-assisted budget that starts free, [[of]] is the friendlier choice.",
      },
    ],
  },

  // 10 ────────────────────────────────────────────────────────────────────────
  {
    slug: "best-ai-budgeting-apps-2026",
    title: "The Best AI Budgeting Apps in 2026",
    description:
      "AI budgeting apps promise insights, but most just add a chatbot. Here is what real AI budgeting looks like in 2026 and which apps actually deliver it.",
    excerpt:
      "Everyone claims AI now. Here is the difference between a bolted-on chatbot and an advisor that actually reads your money, plus who does it best.",
    category: "Roundup",
    keywords: [
      "ai budgeting app",
      "best ai budgeting app",
      "ai financial advisor app",
      "ai money management",
      "ai personal finance",
      "ai budget planner",
    ],
    readMinutes: 8,
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-14",
    body: [
      {
        type: "p",
        text: "In 2026, nearly every budgeting app claims to use AI. Some genuinely do something useful with it. Many just added a chatbot to say they have one. This guide separates the two, explains what real AI budgeting should do, and looks at which apps deliver it.",
      },
      { type: "h2", text: "What AI should actually do in a budgeting app" },
      {
        type: "p",
        text: "Good AI in personal finance is not a novelty chat window. It should read your own transactions and savings behavior and turn them into plain-language guidance you would not have spotted yourself. It should categorize spending accurately without constant correction. And it should be quiet, surfacing a nudge when it matters rather than nagging. If an app's AI cannot do those three things, the label is mostly marketing.",
      },
      { type: "h2", text: "How the major apps use AI" },
      { type: "h3", text: "Copilot Money" },
      {
        type: "p",
        text: "**Copilot Money** uses machine learning for categorization that adapts to your habits. That is genuine AI, though it is focused on tidying your ledger rather than advising you, and it is Apple-first with no Android app and no free tier.",
      },
      { type: "h3", text: "Monarch Money" },
      {
        type: "p",
        text: "**Monarch Money** added an AI assistant you can ask questions and AI-assisted categorization. It is subscription-only at about $99.99 per year with no free tier.",
      },
      { type: "h3", text: "PocketGuard and the rest" },
      {
        type: "p",
        text: "**PocketGuard** offers an AI chat on its paid plan, and various apps advertise smart insights that are really rule-based alerts. Meanwhile some big names, notably **YNAB** and **EveryDollar**, deliberately include no AI at all, betting on manual discipline instead. That is a valid choice, just not an AI one.",
      },
      {
        type: "table",
        caption: "AI features across budgeting apps in 2026.",
        head: ["App", "AI categorization", "AI advice", "Free tier"],
        rows: [
          ["[[of]]", "Yes", "Yes, proactive advisor", "Yes"],
          ["Copilot Money", "Yes, strong", "Limited", "No"],
          ["Monarch Money", "Yes", "Ask-a-question assistant", "No"],
          ["PocketGuard", "Basic", "Chat (paid)", "Yes (limited)"],
          ["YNAB", "No", "No", "No"],
          ["EveryDollar", "No", "No", "Yes (manual)"],
        ],
      },
      { type: "h2", text: "What makes otterfund's AI different" },
      {
        type: "p",
        text: "[[of]] pairs AI with a method, which is the part most apps miss. Because it is built on the needs, wants, and savings model, its AI advisor is not floating in a vacuum: it reads your spending against a plan and tells you, in plain language, where you are drifting and what a small change would do. It categorizes transactions into your buckets automatically, and it keeps its guidance calm rather than constant.",
      },
      {
        type: "ul",
        items: [
          "A proactive advisor that reads your own numbers, not a generic chatbot.",
          "Automatic categorization into needs, wants, and savings.",
          "Advice tied to a real budgeting method, so it is actionable.",
          "Available on a free-to-start app, not locked behind a $100 subscription.",
        ],
      },
      { type: "h2", text: "How to choose an AI budgeting app" },
      {
        type: "ol",
        items: [
          "Decide whether you want advice or just tidy categorization.",
          "Check whether the AI is tied to a budgeting method or floating on its own.",
          "Confirm there is a free tier so you can test the AI before paying.",
          "Make sure your financial data is encrypted and never sold.",
        ],
      },
      {
        type: "callout",
        title: "The bottom line",
        text: "The best AI budgeting app is not the one with the flashiest chatbot. It is the one whose AI reads your real money against a real plan and helps quietly. That is what [[of]] is built to do, and you can try it free.",
      },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Newest-first, the display order for the index and sitemap. */
export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

/** Related posts: explicit `related` slugs first, then same-category recency,
    then newest overall. Always excludes the current post. */
export function getRelatedPosts(slug: string, n = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return getAllPosts().slice(0, n);

  const bySlug = new Map(BLOG_POSTS.map((p) => [p.slug, p]));
  const picked: BlogPost[] = [];
  const seen = new Set<string>([slug]);
  const add = (p?: BlogPost | null) => {
    if (p && !seen.has(p.slug)) {
      seen.add(p.slug);
      picked.push(p);
    }
  };

  (current.related ?? []).forEach((s) => add(bySlug.get(s)));
  getAllPosts()
    .filter((p) => p.category === current.category)
    .forEach(add);
  getAllPosts().forEach(add);

  return picked.slice(0, n);
}

/** Absolute canonical URL for a post. */
export function postUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07-14" -> "July 14, 2026". Parsed by hand to avoid timezone drift. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export const BLOG_TITLE = `${SITE_NAME} blog`;
export const BLOG_DESCRIPTION =
  "Guides on budgeting the calm way: the 50/30/20 rule, how to allocate your paycheck, and honest comparisons of the best budgeting apps in 2026.";

/** Approximate word count of a post (for Article JSON-LD). Brand token counts as one word. */
export function postWordCount(post: BlogPost): number {
  const parts: string[] = [post.title, post.excerpt];
  for (const b of post.body) {
    switch (b.type) {
      case "p":
      case "h2":
      case "h3":
        parts.push(b.text);
        break;
      case "ul":
      case "ol":
        parts.push(...b.items);
        break;
      case "callout":
        parts.push(b.title, b.text);
        break;
      case "table":
        parts.push(...b.head, ...b.rows.flat());
        if (b.caption) parts.push(b.caption);
        break;
    }
  }
  return parts
    .join(" ")
    .replace(/\[\[of\]\]/g, "otterfund")
    .replace(/\*\*/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

// ── JSON-LD builders ──────────────────────────────────────────────────────────
// Rendered with <JsonLd data={...} />. Reference the site-wide Organization node
// (defined in seo.ts) by @id so the graph stays connected.

const BLOG_IMAGE = absoluteUrl("/otterfund-logo.png");

/** Blog schema for the /blog index, listing every post. */
export function blogListingLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}/blog#blog`,
    name: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: absoluteUrl("/blog"),
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
    blogPost: getAllPosts().map((p) => ({
      "@type": "BlogPosting",
      "@id": `${postUrl(p.slug)}#article`,
      headline: p.title,
      description: p.description,
      url: postUrl(p.slug),
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
    })),
  };
}

/** BlogPosting (Article) schema for a single post. */
export function blogPostingLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl(post.slug)}#article`,
    headline: post.title,
    description: post.description,
    url: postUrl(post.slug),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "en",
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    wordCount: postWordCount(post),
    image: BLOG_IMAGE,
    author: { "@type": "Organization", name: BLOG_AUTHOR.name, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post.slug) },
    isPartOf: { "@id": `${SITE_URL}/blog#blog` },
  };
}

/** BreadcrumbList: Home › Blog › Post. */
export function blogBreadcrumbLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl(post.slug) },
    ],
  };
}
