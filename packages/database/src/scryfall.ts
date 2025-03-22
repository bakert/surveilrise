import { prisma } from './client';
import type { ScryfallCard } from 'types';
import { Decimal } from '@prisma/client/runtime/library';
export async function getLastUpdated(): Promise<string | null> {
  const meta = await prisma.scryfallMeta.findFirst({
    where: { key: 'last_updated' },
    select: { value: true }
  });
  return meta?.value ?? null;
}

export async function setLastUpdated(value: string): Promise<void> {
  await prisma.scryfallMeta.upsert({
    where: { key: 'last_updated' },
    create: { key: 'last_updated', value },
    update: { value }
  });
}

export async function updateCards(printings: ScryfallCard[]): Promise<void> {
  const BATCH_SIZE = 1000;
  const seenOracleIds = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < printings.length; i += BATCH_SIZE) {
      const batch = printings.slice(i, i + BATCH_SIZE);

      // Collect operations for this batch
      const cardUpserts: any[] = [];
      const legalityDeletes: any[] = [];
      const legalityCreates: any[] = [];
      const printingUpserts: any[] = [];

      for (const printing of batch) {
        if (!printing.oracle_id) {
          console.log('Skipping card without oracle_id:', printing.name);
          continue;
        }

        if (!seenOracleIds.has(printing.oracle_id)) {
          seenOracleIds.add(printing.oracle_id);

          // Queue card upsert
          cardUpserts.push({
            where: { oracleId: printing.oracle_id },
            create: {
              name: printing.name,
              manaCost: printing.mana_cost,
              typeLine: printing.type_line,
              oracleText: printing.oracle_text,
              colors: printing.colors,
              oracleId: printing.oracle_id,
              power: printing.power,
              powerValue: statValue(printing.power),
              toughness: printing.toughness,
              toughnessValue: statValue(printing.toughness),
            },
            update: {
              name: printing.name,
              manaCost: printing.mana_cost,
              typeLine: printing.type_line,
              oracleText: printing.oracle_text,
              colors: printing.colors,
              power: printing.power,
              powerValue: statValue(printing.power),
              toughness: printing.toughness,
              toughnessValue: statValue(printing.toughness),
            }
          });

          // Queue legality operations
          legalityDeletes.push({
            where: { oracleId: printing.oracle_id }
          });

          const legalityEntries = Object.entries(printing.legalities);
          for (const [format, status] of legalityEntries) {
            legalityCreates.push({
              oracleId: printing.oracle_id,
              format,
              legal: status === 'legal'
            });
          }
        }

        // Queue printing upsert
        printingUpserts.push({
          where: {
            oracleId_setCode_collectorNumber: {
              oracleId: printing.oracle_id,
              setCode: printing.set,
              collectorNumber: printing.collector_number
            }
          },
          create: {
            oracleId: printing.oracle_id,
            setCode: printing.set,
            releasedAt: new Date(printing.released_at),
            collectorNumber: printing.collector_number,
            rarity: printing.rarity,
            imageUrl: printing.image_uris?.normal ?? '',
            usd: printing.prices.usd ? parseFloat(printing.prices.usd) : null,
            usdFoil: printing.prices.usd_foil ? parseFloat(printing.prices.usd_foil) : null,
            usdEtched: printing.prices.usd_etched ? parseFloat(printing.prices.usd_etched) : null,
            eur: printing.prices.eur ? parseFloat(printing.prices.eur) : null,
            eurFoil: printing.prices.eur_foil ? parseFloat(printing.prices.eur_foil) : null,
            tix: printing.prices.tix ? parseFloat(printing.prices.tix) : null,
            artist: printing.artist ?? '',
          },
          update: {
            releasedAt: new Date(printing.released_at),
            rarity: printing.rarity,
            imageUrl: printing.image_uris?.normal ?? '',
            usd: printing.prices.usd ? parseFloat(printing.prices.usd) : null,
            usdFoil: printing.prices.usd_foil ? parseFloat(printing.prices.usd_foil) : null,
            usdEtched: printing.prices.usd_etched ? parseFloat(printing.prices.usd_etched) : null,
            eur: printing.prices.eur ? parseFloat(printing.prices.eur) : null,
            eurFoil: printing.prices.eur_foil ? parseFloat(printing.prices.eur_foil) : null,
            tix: printing.prices.tix ? parseFloat(printing.prices.tix) : null,
            artist: printing.artist ?? '',
          }
        });
      }

      // Execute batch operations
      await Promise.all([
        ...cardUpserts.map(upsert => tx.card.upsert(upsert)),
        ...legalityDeletes.map(del => tx.legality.deleteMany(del)),
        tx.legality.createMany({ data: legalityCreates }),
        ...printingUpserts.map(upsert => tx.printing.upsert(upsert))
      ]);

      console.log(`Processed ${Math.min((i + BATCH_SIZE), printings.length)} of ${printings.length} cards`);
    }
  }, {
    timeout: 1000 * 60 * 60 // 60 minute timeout
  });
}

export function statValue(stat: string | undefined): Decimal | null {
  if (stat === undefined) return null;
  if (stat === '∞') return new Decimal('1e34'); // Store a huge value that fits in numeric(65,30) so > and < work with sane inputs.
  const cleaned = stat.replace(/^[^0-9.+-]+/, '');
  try {
    return new Decimal(cleaned);
  } catch (e) {
    return new Decimal(0);
  }
}
