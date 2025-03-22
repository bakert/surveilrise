import { prisma } from "./client";
import type { ScryfallCard } from "types";
import { Decimal } from "@prisma/client/runtime/library";
import type { Prisma, PrismaClient, ScryfallMeta } from "@prisma/client";

type TransactionalPrismaClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function getLastUpdated(): Promise<string | null> {
  const meta = (await prisma.scryfallMeta.findFirst({
    where: { key: "last_updated" },
    select: { value: true },
  })) as ScryfallMeta | null;
  return meta?.value ?? null;
}

export async function setLastUpdated(value: string): Promise<void> {
  await prisma.scryfallMeta.upsert({
    where: { key: "last_updated" },
    create: { key: "last_updated", value },
    update: { value },
  });
}

export async function updateCards(entries: ScryfallCard[]): Promise<void> {
  const BATCH_SIZE = 1000;
  const seenOracleIds = new Set<string>();

  await prisma.$transaction(
    async (tx: TransactionalPrismaClient) => {
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);

        // Collect operations for this batch
        const cardUpserts: Array<Prisma.CardUpsertArgs> = [];
        const legalityDeletes: Array<Prisma.LegalityDeleteManyArgs> = [];
        const legalityCreates: Array<Prisma.LegalityCreateManyInput> = [];
        const printingUpserts: Array<Prisma.PrintingUpsertArgs> = [];

        for (const entry of batch) {
          if (!entry.oracle_id) {
            console.log("Skipping card without oracle_id:", entry.name);
            continue;
          }

          if (!seenOracleIds.has(entry.oracle_id)) {
            seenOracleIds.add(entry.oracle_id);

            // Queue card upsert
            cardUpserts.push({
              where: { oracleId: entry.oracle_id },
              create: {
                name: entry.name,
                manaCost: entry.mana_cost,
                typeLine: entry.type_line,
                oracleText: entry.oracle_text,
                colors: entry.colors,
                oracleId: entry.oracle_id,
                power: entry.power,
                powerValue: statValue(entry.power),
                toughness: entry.toughness,
                toughnessValue: statValue(entry.toughness),
              },
              update: {
                name: entry.name,
                manaCost: entry.mana_cost,
                typeLine: entry.type_line,
                oracleText: entry.oracle_text,
                colors: entry.colors,
                power: entry.power,
                powerValue: statValue(entry.power),
                toughness: entry.toughness,
                toughnessValue: statValue(entry.toughness),
              },
            });

            // Queue legality operations
            legalityDeletes.push({
              where: { oracleId: entry.oracle_id },
            });

            const legalityEntries = Object.entries(entry.legalities);
            for (const [format, status] of legalityEntries) {
              legalityCreates.push({
                oracleId: entry.oracle_id,
                format,
                legal: status === "legal",
              });
            }
          }

          // Queue printing upsert
          printingUpserts.push({
            where: {
              oracleId_setCode_collectorNumber: {
                oracleId: entry.oracle_id,
                setCode: entry.set,
                collectorNumber: entry.collector_number,
              },
            },
            create: {
              oracleId: entry.oracle_id,
              setCode: entry.set,
              releasedAt: new Date(entry.released_at),
              collectorNumber: entry.collector_number,
              rarity: entry.rarity,
              imageUrl: entry.image_uris?.border_crop ?? null,
              usd: entry.prices.usd ? parseFloat(entry.prices.usd) : null,
              usdFoil: entry.prices.usd_foil
                ? parseFloat(entry.prices.usd_foil)
                : null,
              usdEtched: entry.prices.usd_etched
                ? parseFloat(entry.prices.usd_etched)
                : null,
              eur: entry.prices.eur ? parseFloat(entry.prices.eur) : null,
              eurFoil: entry.prices.eur_foil
                ? parseFloat(entry.prices.eur_foil)
                : null,
              tix: entry.prices.tix ? parseFloat(entry.prices.tix) : null,
              artist: entry.artist ?? "",
            },
            update: {
              releasedAt: new Date(entry.released_at),
              rarity: entry.rarity,
              imageUrl: entry.image_uris?.border_crop ?? null,
              usd: entry.prices.usd ? parseFloat(entry.prices.usd) : null,
              usdFoil: entry.prices.usd_foil
                ? parseFloat(entry.prices.usd_foil)
                : null,
              usdEtched: entry.prices.usd_etched
                ? parseFloat(entry.prices.usd_etched)
                : null,
              eur: entry.prices.eur ? parseFloat(entry.prices.eur) : null,
              eurFoil: entry.prices.eur_foil
                ? parseFloat(entry.prices.eur_foil)
                : null,
              tix: entry.prices.tix ? parseFloat(entry.prices.tix) : null,
              artist: entry.artist ?? "",
            },
          });
        }

        // Execute batch operations
        await Promise.all([
          ...cardUpserts.map((upsert) => tx.card.upsert(upsert)),
          ...legalityDeletes.map((del) => tx.legality.deleteMany(del)),
          tx.legality.createMany({ data: legalityCreates }),
          ...printingUpserts.map((upsert) => tx.printing.upsert(upsert)),
        ]);

        console.log(
          `Processed ${Math.min(i + BATCH_SIZE, entries.length)} of ${
            entries.length
          } cards`
        );
      }
    },
    {
      timeout: 1000 * 60 * 60, // 60 minute timeout
    }
  );
}

export function statValue(stat: string | undefined): Decimal | null {
  if (stat === undefined) return null;
  if (stat === "∞") return new Decimal("1e34"); // Store a huge value that fits in numeric(65,30) so > and < work with sane inputs.
  if (stat === "*" || stat === "?" || stat.trim() === "") return new Decimal(0);
  const match = stat.match(/[+-]?\d*\.?\d+/);
  const cleaned = match ? match[0] : "0";
  try {
    return new Decimal(cleaned);
  } catch (e) {
    return new Decimal(0);
  }
}
