import { parseQuery } from "./parser";
import { QueryBuilder } from "./queryBuilder";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

describe("Query Integration Tests", () => {
  async function runQueryTest(query: string): Promise<
    Array<{
      oracleId: string;
      name: string;
      colors: string[];
      typeLine: string;
      power: string | null;
      toughness: string | null;
      oracleText: string | null;
      manaValue: Prisma.Decimal | null;
      printings: Array<{ artist: string | null }>;
      legalities: Array<{ format: string; legal: boolean }>;
    }>
  > {
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
        manaValue: true,
        printings: {
          select: {
            artist: true,
          },
        },
        legalities: {
          select: {
            format: true,
            legal: true,
          },
        },
      },
      take: 20,
    });

    return results;
  }

  it("should find red cards", async () => {
    const results = await runQueryTest("c:r");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((card) => card.colors.includes("R"))).toBe(true);
  });

  it("should find pirate cards", async () => {
    const results = await runQueryTest("t:pirate");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) => card.typeLine.toLowerCase().includes("pirate"))
    ).toBe(true);
  });

  it("should find cards with power 2", async () => {
    const results = await runQueryTest("pow:2");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((card) => card.power === "2")).toBe(true);
  });

  it('should find cards matching "Burst Lightning"', async () => {
    const results = await runQueryTest("Burst Lightning");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((card) =>
        card.name.toLowerCase().includes("burst lightning")
      )
    ).toBe(true);
  });

  it("should find instants", async () => {
    const results = await runQueryTest("t:instant");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) => card.typeLine.toLowerCase().includes("instant"))
    ).toBe(true);
  });

  it("should find cards via rules text", async () => {
    const results = await runQueryTest(
      'o:"rEtUrN up to THREE target LAND cards"'
    );
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((card) =>
        card.oracleText
          ?.toLowerCase()
          .includes("return up to three target land cards")
      )
    ).toBe(true);
  });

  it("should find cards by artist", async () => {
    const results = await runQueryTest('artist:"John Avon"');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) =>
        card.printings.some((printing) =>
          printing.artist?.toLowerCase().includes("john avon")
        )
      )
    ).toBe(true);
  });

  it("should find cards by artist when combined with other fields", async () => {
    const results = await runQueryTest('artist:"John Avon" t:island');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) =>
        card.printings.some(
          (printing) =>
            printing.artist?.toLowerCase().includes("john avon") &&
            card.typeLine.toLowerCase().includes("island")
        )
      )
    ).toBe(true);
  });

  it('should find instants with "Burst Lightning" in name', async () => {
    const results = await runQueryTest("Burst Lightning t:instant");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.name.toLowerCase().includes("burst lightning") &&
          card.typeLine.toLowerCase().includes("instant")
      )
    ).toBe(true);
  });

  it("should find cards legal in Vintage format", async () => {
    const results = await runQueryTest("f:vintage");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) =>
        card.legalities.some(
          (legality) =>
            legality.format.toLowerCase() === "vintage" &&
            legality.legal === true
        )
      )
    ).toBe(true);
  });

  it("should find cards legal in Pioneer using full format name", async () => {
    const results = await runQueryTest("format:pioneer");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((card) =>
        card.legalities.some(
          (legality) =>
            legality.format.toLowerCase() === "pioneer" &&
            legality.legal === true
        )
      )
    ).toBe(true);
  });

  it("should handle format queries combined with other criteria", async () => {
    const results = await runQueryTest("f:vintage t:creature");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.legalities.some(
            (legality) =>
              legality.format.toLowerCase() === "vintage" &&
              legality.legal === true
          ) && card.typeLine.toLowerCase().includes("creature")
      )
    ).toBe(true);
  });

  it("should handle negation of colors", async () => {
    const results = await runQueryTest("t:dragon -c:r");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.typeLine.toLowerCase().includes("dragon") &&
          !card.colors.includes("R")
      )
    ).toBe(true);
  });

  it("should handle negation of types", async () => {
    const results = await runQueryTest("c:r -t:creature");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.colors.includes("R") &&
          !card.typeLine.toLowerCase().includes("creature")
      )
    ).toBe(true);
  });

  it("should handle multiple negations", async () => {
    const results = await runQueryTest("t:instant -c:r -c:b");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.typeLine.toLowerCase().includes("instant") &&
          !card.colors.includes("R") &&
          !card.colors.includes("B")
      )
    ).toBe(true);
  });

  it("should handle negation with oracle text", async () => {
    const results = await runQueryTest('t:creature -o:"flying"');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.typeLine.toLowerCase().includes("creature") &&
          (!card.oracleText ||
            !card.oracleText.toLowerCase().includes("flying"))
      )
    ).toBe(true);
  });

  it("should handle negation with NOT keyword", async () => {
    const results = await runQueryTest("t:creature NOT c:r");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          card.typeLine.toLowerCase().includes("creature") &&
          !card.colors.includes("R")
      )
    ).toBe(true);
  });

  it("should handle query starting with negation followed by multiple criteria", async () => {
    const results = await runQueryTest("-f:pioneer c:u cmc=1 t:instant o:draw");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (card) =>
          // Not legal in pioneer
          !card.legalities.some(
            (legality) =>
              legality.format.toLowerCase() === "pioneer" &&
              legality.legal === true
          ) &&
          // Blue instant with cmc 1 that mentions draw
          card.colors.includes("U") &&
          card.manaValue?.equals(1) &&
          card.typeLine.toLowerCase().includes("instant") &&
          card.oracleText?.toLowerCase().includes("draw")
      )
    ).toBe(true);
  });
});
