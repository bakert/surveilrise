export * from "./types";
export * from "./parser";
export * from "./queryBuilder";

import { parseQuery } from "./parser";
import { QueryBuilder } from "./queryBuilder";
import { SearchQuery } from "./types";

export function parseSearchQuery(query: string): SearchQuery {
  const tokens = parseQuery(query);
  const builder = new QueryBuilder();
  return builder.build(tokens);
}
