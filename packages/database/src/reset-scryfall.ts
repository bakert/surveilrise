import { prisma } from './client';

async function main() {
  await prisma.scryfallMeta.deleteMany({
    where: {
      key: 'last_updated'
    }
  });
  console.log('Deleted last_updated record');
}

main().catch(console.error);