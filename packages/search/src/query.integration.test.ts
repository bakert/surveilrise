import { lex } from '../../parser';
import { QueryBuilder } from '../../queryBuilder';
import { prisma } from 'database';
import { Key, Operator, Criterion } from '../../types';

describe('Query Integration Tests', () => {
  async function runQueryTest(query: string) {
    // Debug token matching
    console.log('\n=== Testing query:', query, '===\n');
    console.log('Debug token matching:');
    console.log('Key.match("' + query + '"):', Key.match(query));
    console.log('Key.tokenLength("' + query + '"):', Key.tokenLength(query));
    console.log('Operator.match("' + query + '"):', Operator.match(query));
    console.log('Criterion.match("' + query + '"):', Criterion.match(query));

    const tokens = lex(query);

    // Log the tokens
    console.log('\nTokens:');
    tokens.tokens.forEach((token, i) => {
      console.log(`${i}: ${token.constructor.name} - ${token.toString()}`);
    });

    // Build the query
    const builder = new QueryBuilder();
    const searchQuery = builder.build(tokens);
    console.log('\nBuilt query:', JSON.stringify(searchQuery, null, 2));

    // Execute the query
    console.log('\nExecuting query...');
    const results = await prisma.card.findMany({
      where: searchQuery.where,
      select: {
        oracleId: true,
        name: true,
        colors: true,
        typeLine: true
      },
      take: 20
    });

    console.log('\nResults:');
    console.log(`Found ${results.length} cards`);
    results.forEach(card => {
      console.log(`${card.name} (${card.oracleId}) - Type: ${card.typeLine} - Colors: ${card.colors.join(', ')}`);
    });

    return results;
  }

  it('should find cards matching "burst lightning"', async () => {
    const results = await runQueryTest('burst lightning');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(card => card.name.toLowerCase().includes('burst lightning'))).toBe(true);
  });

  it('should find instant cards', async () => {
    const results = await runQueryTest('t:instant');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.typeLine.toLowerCase().includes('instant'))).toBe(true);
  });

  it('should find instant cards with "burst lightning" in name', async () => {
    const results = await runQueryTest('burst lightning t:instant');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card =>
      card.name.toLowerCase().includes('burst lightning') &&
      card.typeLine.toLowerCase().includes('instant')
    )).toBe(true);
  });
});