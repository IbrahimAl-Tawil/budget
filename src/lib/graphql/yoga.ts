import { createYoga } from "graphql-yoga";
// Aliased away from the `use*` name so the react-hooks lint rule doesn't
// mistake these Yoga/Envelop plugin factories for React hooks.
import { useCSRFPrevention as csrfPreventionPlugin } from "@graphql-yoga/plugin-csrf-prevention";
import { useDisableIntrospection as disableIntrospectionPlugin } from "@graphql-yoga/plugin-disable-introspection";
import { maxDepthPlugin } from "@escape.tech/graphql-armor-max-depth";
import { maxAliasesPlugin } from "@escape.tech/graphql-armor-max-aliases";
import { costLimitPlugin } from "@escape.tech/graphql-armor-cost-limit";
import { schema } from "./schema";
import { createContext } from "./context";

const isProd = process.env.NODE_ENV === "production";

// GraphQL Yoga instance. Runs as a Next.js Route Handler (see app/api/graphql).
// handleRequest is pre-bound, so destructuring is safe (per Yoga's Next.js guide).
export const { handleRequest } = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  // Next.js provides the Fetch API Response globally; hand it to Yoga explicitly.
  fetchAPI: { Response },
  // The only browser client is same-origin (`/api/graphql`), so cross-origin CORS
  // is pure attack surface. Disabling it removes Yoga's default reflect-any-origin
  // + Access-Control-Allow-Credentials:true behavior.
  cors: false,
  // GraphiQL IDE + introspection only in development.
  graphiql: !isProd,
  // Batched operation arrays would let one request sidestep the per-operation
  // alias cap; keep them off (also Yoga's default).
  batching: false,
  plugins: [
    // Bound per-request work: block deep nesting, alias amplification (running the
    // same expensive resolver N× in one op), and pathologically costly queries.
    maxDepthPlugin({ n: 12, ignoreIntrospection: true }),
    maxAliasesPlugin({ n: 20 }),
    costLimitPlugin({ maxCost: 50000, ignoreIntrospection: true }),
    // In production, require a custom header on non-preflighted requests
    // (form-urlencoded/multipart/text) — the CSRF vector the audit found, since a
    // cross-site page can't set a custom header without a preflight that cors:false
    // denies. JSON requests are exempt (preflight-protected). Also hide the schema.
    // The browser gqlClient + gqlUpload both send `x-graphql-csrf`.
    ...(isProd
      ? [
          csrfPreventionPlugin({ requestHeaders: ["x-graphql-csrf"] }),
          disableIntrospectionPlugin(),
        ]
      : []),
  ],
});
