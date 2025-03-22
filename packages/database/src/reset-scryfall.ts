import { prisma } from './client';
import readline from 'readline';
import { Prisma } from '@prisma/client';

async function main() {
  const clearAll = process.argv.includes('--clear-all');

  if (clearAll) {
    await clearEntireDatabase();
  } else {
    await clearLastUpdated();
  }
}
async function clearEntireDatabase() {
  const confirmed = await confirm('Are you sure you want to clear the entire database?');
  if (!confirmed) {
    console.log('Operation cancelled');
    return;
  }

  const result = await prisma.$queryRaw<Array<{tablename: string}>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'`;

  for (const {tablename} of result) {
    await prisma.$executeRaw(
      Prisma.sql`TRUNCATE TABLE "${Prisma.raw(tablename)}" CASCADE`
    );
    console.log(`Cleared table ${tablename}`);
  }
  console.log('Cleared entire database');
}

async function clearLastUpdated() {
  await prisma.scryfallMeta.deleteMany({
    where: {
      key: 'last_updated'
    }
  });
  console.log('Deleted last_updated record');
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${message} (y/N) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

main().catch(console.error);
