export * from './types';
export * from './parser';
export * from './queryBuilder';

import { lex } from './parser';
import { QueryBuilder } from './queryBuilder';

// BAKERT at some pointin the process we want to exclude art cards and tokens and such
// probably playtest cards and maybe even "funny" cards

export function parseSearchQuery(query: string) {
  const tokens = lex(query);
  const builder = new QueryBuilder();
  return builder.build(tokens);
}