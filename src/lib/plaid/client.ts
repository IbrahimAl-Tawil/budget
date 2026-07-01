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

/** The only Plaid product we enable (cheapest: balances ride along for free). */
export const PLAID_PRODUCTS: Products[] = [Products.Transactions];

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
