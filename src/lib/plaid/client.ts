// Plaid Node SDK singleton. Server-only (never import into a client component).
// Mirrors the lazy-singleton pattern in src/lib/ai/client.ts.

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  CountryCode,
  Products,
} from "plaid";

const globalForPlaid = globalThis as unknown as { plaid?: PlaidApi };

function createPlaidClient(): PlaidApi {
  const env = (process.env.PLAID_ENV || "sandbox").toLowerCase();
  const basePath =
    env === "production"
      ? PlaidEnvironments.production
      : PlaidEnvironments.sandbox;

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
        "Plaid-Version": "2020-09-14",
      },
    },
  });
  return new PlaidApi(configuration);
}

export const plaid = globalForPlaid.plaid || createPlaidClient();

if (process.env.NODE_ENV !== "production") globalForPlaid.plaid = plaid;

/** Required product (cheapest: balances ride along for free). Kept minimal so
 * Link never blocks a bank that lacks another product. */
export const PLAID_PRODUCTS: Products[] = [Products.Transactions];

/**
 * Products requested best-effort: fetched + billed ONLY when the institution and
 * the account the user selects actually support them, and never a barrier to
 * linking (see `optional_products` in linkTokenCreate). Investments lets a
 * brokerage connection (e.g. Wealthsimple) itemize its real holdings. Gated to
 * entitled users at the call site so we don't incur Plaid's Investments billing
 * for plans that can't see the feature.
 */
export const PLAID_OPTIONAL_PRODUCTS: Products[] = [Products.Investments];

const COUNTRY_CODE_MAP: Record<string, CountryCode> = {
  US: CountryCode.Us,
  CA: CountryCode.Ca,
  GB: CountryCode.Gb,
};

/** Country codes from env (PLAID_COUNTRY_CODES, e.g. "US,CA"). */
export function plaidCountryCodes(): CountryCode[] {
  return (process.env.PLAID_COUNTRY_CODES || "US,CA")
    .split(",")
    .map((c) => COUNTRY_CODE_MAP[c.trim().toUpperCase()])
    .filter((c): c is CountryCode => Boolean(c));
}

/** The webhook URL to register on link tokens, or undefined for local dev. */
export function plaidWebhookUrl(): string | undefined {
  const url = process.env.PLAID_WEBHOOK_URL?.trim();
  return url ? url : undefined;
}
