import SchemaBuilder from "@pothos/core";
import { JSONResolver } from "graphql-scalars";
import type { GraphQLContext } from "./context";

/**
 * Code-first Pothos schema builder. Queries + mutations are View-shaped object
 * refs over the existing src/lib/db + src/lib/ai service layer. The JSON scalar
 * carries the variable-shape AI results (recurring suggestions, insights, import
 * previews) verbatim, matching what the old REST endpoints returned.
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    JSON: { Input: unknown; Output: unknown };
    File: { Input: File; Output: never };
  };
}>({});

builder.addScalarType("JSON", JSONResolver);

// Upload scalar. GraphQL Yoga natively implements the multipart request spec and
// populates the variable with a Web File before the resolver runs; this scalar
// just validates it. Input-only — never serialized in a response.
builder.scalarType("File", {
  serialize: () => {
    throw new Error("File is an input-only scalar and cannot be serialized.");
  },
  parseValue: (value) => {
    if (value instanceof File) return value;
    throw new Error("Expected a file upload.");
  },
});

builder.queryType({});
builder.mutationType({});
