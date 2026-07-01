import { ClientError, GraphQLClient } from "graphql-request";

/**
 * graphql-request v7 wraps the endpoint in `new URL()` before fetching, which
 * rejects a bare path ("/api/graphql" cannot be parsed as a URL). So resolve to
 * an absolute same-origin URL in the browser; SSR of the client tree evaluates
 * this module too, but requests only ever fire in the browser, so the server
 * placeholder is never actually used.
 */
const GRAPHQL_ENDPOINT =
  typeof window === "undefined"
    ? "http://localhost/api/graphql"
    : new URL("/api/graphql", window.location.origin).toString();

/**
 * Shared browser-side GraphQL client. Same-origin, so the Supabase auth cookies
 * ride along automatically (credentials:'include' makes that explicit). Client
 * modals call `gqlClient.request(query, variables)`; file-upload variables switch
 * to a multipart request automatically. Mutations still trigger router.refresh()
 * to re-run the RSC — this client does not maintain a normalized cache.
 */
export const gqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  credentials: "include",
  // Custom header satisfies the server's CSRF-prevention plugin on any
  // non-preflighted request. (JSON requests are preflight-protected + blocked by
  // cors:false; the plugin only enforces the header on simple content types.)
  headers: { "x-graphql-csrf": "1" },
});

/**
 * File-upload GraphQL request. graphql-request sends `application/json` only and
 * cannot transmit a File (it would serialize to `{}`), so uploads use fetch +
 * FormData following the GraphQL multipart-request spec. `files` maps each File
 * to its variable path (e.g. "variables.file" or "variables.files.0"); those
 * paths must be null in `variables`. Sends `x-graphql-csrf` because
 * multipart/form-data IS a non-preflighted content type the CSRF plugin guards.
 */
// Default T = any mirrors graphql-request's own loosely-typed `request()` so
// callers can destructure the JSON result exactly as they do elsewhere.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function gqlUpload<T = any>(
  query: string,
  variables: Record<string, unknown>,
  files: { path: string; file: File }[],
): Promise<T> {
  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables }));
  const map: Record<string, string[]> = {};
  files.forEach((f, i) => {
    map[String(i)] = [f.path];
  });
  form.append("map", JSON.stringify(map));
  files.forEach((f, i) => form.append(String(i), f.file));

  const res = await fetch("/api/graphql", {
    method: "POST",
    credentials: "include",
    headers: { "x-graphql-csrf": "1" },
    body: form,
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

/**
 * Extract a user-facing message from a failed `gqlClient.request`. A GraphQL
 * error (auth, validation, rate-limit) arrives as a ClientError carrying the
 * resolver's message; anything else falls back to a generic line. Mirrors the
 * old `data.error` reads from the REST handlers.
 */
export function errMessage(e: unknown): string {
  if (e instanceof ClientError) {
    return e.response.errors?.[0]?.message ?? "Something went wrong.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}
