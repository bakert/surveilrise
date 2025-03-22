export * from './types';
export * from './parser';
export * from './queryBuilder';

import { lex } from './parser';
import { QueryBuilder } from './queryBuilder';

export function parseSearchQuery(query: string) {
  const tokens = lex(query);
  const builder = new QueryBuilder();
  return builder.build(tokens);
}