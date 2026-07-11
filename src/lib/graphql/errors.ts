import { GraphQLError } from "graphql";
import type { GraphQLContext } from "./context";

/**
 * Asserts an authenticated user and returns their id. Mirrors the old
 * `getApiUser() → 401` guard from the REST routes. Throws UNAUTHENTICATED
 * (surfaced to the client as a GraphQL error with http status 401).
 */
export function requireUser(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw new GraphQLError("You must be signed in.", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }
  return ctx.userId;
}

/** Throw a NOT_FOUND error — used after an ownership check fails. */
export function notFound(message = "Not found."): never {
  throw new GraphQLError(message, {
    extensions: { code: "NOT_FOUND", http: { status: 404 } },
  });
}

/** Throw a BAD_REQUEST error for invalid input the schema can't express. */
export function badRequest(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: "BAD_REQUEST", http: { status: 400 } },
  });
}

/**
 * Throw an UPGRADE_REQUIRED error when a user's plan doesn't include a feature.
 * The client reads `extensions.code === "UPGRADE_REQUIRED"` (+ `feature` /
 * `requiredTier`) to open the paywall modal instead of showing a raw error.
 */
export function upgradeRequired(
  feature: string,
  requiredTier: string,
  message = "Upgrade your plan to use this feature.",
): never {
  throw new GraphQLError(message, {
    extensions: {
      code: "UPGRADE_REQUIRED",
      http: { status: 402 },
      feature,
      requiredTier,
    },
  });
}

/** Throw a RATE_LIMITED error (mirrors the old tooManyRequests HTTP response). */
export function rateLimited(
  retryAfterSec?: number,
  message = "Too many requests. Please wait a moment.",
): never {
  throw new GraphQLError(message, {
    extensions: {
      code: "RATE_LIMITED",
      http: { status: 429 },
      ...(retryAfterSec != null && { retryAfterSec }),
    },
  });
}
