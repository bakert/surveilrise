import { prisma } from './client';
import type { ScryfallCard } from 'types';

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

      for (const printing of batch) {
        let oracleId: string;

        if (!printing.oracle_id) {
          console.log('Skipping card without oracle_id:', printing.name);
          continue;
        }

        if (!seenOracleIds.has(printing.oracle_id)) {
          // First time seeing this oracle_id, so create/update the card
          seenOracleIds.add(printing.oracle_id);

          const card = await tx.card.upsert({
            where: { oracleId: printing.oracle_id },
            create: {
              name: printing.name,
              manaCost: printing.mana_cost,
              typeLine: printing.type_line,
              oracleText: printing.oracle_text,
              colors: printing.colors,
              oracleId: printing.oracle_id,
            },
            update: {
              name: printing.name,
              manaCost: printing.mana_cost,
              typeLine: printing.type_line,
              oracleText: printing.oracle_text,
              colors: printing.colors,
            }
          });

          oracleId = card.oracleId;

          // Update legalities for this card
          await tx.legality.deleteMany({
            where: { oracleId: card.oracleId }
          });

          const legalityEntries = Object.entries(printing.legalities);
          for (const [format, status] of legalityEntries) {
            // BAKERT legality is more complex that this, not a bool.
            await tx.legality.create({
              data: {
                oracleId: card.oracleId,
                format,
                legal: status === 'legal'
              }
            });
          }
        } else {
          // We've seen this oracle_id before, look up the card.oracleId
          const card = await tx.card.findUnique({
            where: { oracleId: printing.oracle_id },
            select: { oracleId: true }
          });
          oracleId = card!.oracleId;
        }

        // Always upsert the printing
        await tx.printing.upsert({
          where: {
            oracleId_setCode_collectorNumber: {
              oracleId,
              setCode: printing.set,
              collectorNumber: printing.collector_number
            }
          },
          create: {
            oracleId,
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
          }
        });
      }

      console.log(`Processed ${Math.min((i + BATCH_SIZE), printings.length)} of ${printings.length} cards`);
    }
  }, {
    timeout: 1000 * 60 * 60 // 60 minute timeout
  });
}