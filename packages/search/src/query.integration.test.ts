import { parseQuery } from './parser';
import { QueryBuilder } from './queryBuilder';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Query Integration Tests', () => {
  async function runQueryTest(query: string) {
    const tokens = parseQuery(query);
    const builder = new QueryBuilder();
    const searchQuery = builder.build(tokens);

    const results = await prisma.card.findMany({
      where: searchQuery.where,
      select: {
        oracleId: true,
        name: true,
        colors: true,
        typeLine: true,
        power: true,
        toughness: true,
        oracleText: true,
        printings: {
          select: {
            artist: true
          }
        }
      },
      take: 20
    });

    return results;
  }

  it('should find red cards', async () => {
    const results = await runQueryTest('c:r');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.colors.includes('R'))).toBe(true);
  });

  it('should find pirate cards', async () => {
    const results = await runQueryTest('t:pirate');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.typeLine.toLowerCase().includes('pirate'))).toBe(true);
  });

  it('should find cards with power 2', async () => {
    const results = await runQueryTest('pow:2');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.power === '2')).toBe(true);
  });

  it('should find cards matching "Burst Lightning"', async () => {
    const results = await runQueryTest('Burst Lightning');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(card => card.name.toLowerCase().includes('burst lightning'))).toBe(true);
  });

  it('should find instants', async () => {
    const results = await runQueryTest('t:instant');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.typeLine.toLowerCase().includes('instant'))).toBe(true);
  });

  it('should find cards via rules text', async () => {
    const results = await runQueryTest('o:"rEtUrN up to THREE target LAND cards"');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(card => card.oracleText?.toLowerCase().includes('return up to three target land cards'))).toBe(true);
  });

  it('should find cards by artist', async () => {
    const results = await runQueryTest('artist:"John Avon"');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.printings.some(printing => printing.artist?.toLowerCase().includes('john avon')))).toBe(true);
  });

  it('should find cards by artist when combined with other fields', async () => {
    const results = await runQueryTest('artist:"John Avon" t:island');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card => card.printings.some(printing => printing.artist?.toLowerCase().includes('john avon') && card.typeLine.toLowerCase().includes('island')))).toBe(true);
  });

  it('should find instants with "Burst Lightning" in name', async () => {
    const results = await runQueryTest('Burst Lightning t:instant');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(card =>
      card.name.toLowerCase().includes('burst lightning') &&
      card.typeLine.toLowerCase().includes('instant')
    )).toBe(true);
  });
});
