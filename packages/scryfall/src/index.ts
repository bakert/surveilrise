import { access, readFile, writeFile } from "fs/promises";
import path from "path";
import { scryfall } from 'database';
import type { ScryfallCard } from 'types';

const SCRYFALL_BULK_URL = "https://api.scryfall.com/bulk-data";

type BulkDataMeta = {
  data: {
    type: string;
    download_uri: string;
    updated_at: string;
  }[];
};

async function main() {
  console.log("Running Scryfall ingestion...");

  const quickMode = process.argv.includes('--quick');
  if (quickMode) {
    console.log('Running in quick mode - will only import first 2000 cards');
  }

  const defaultCardsMeta = await fetchBulkDataMeta();
  const lastUpdated = await scryfall.getLastUpdated();

  if (lastUpdated === defaultCardsMeta.updated_at) {
    console.log("Bulk data is already up to date");
    return;
  }

  const bulkData = await retrieveBulkData(defaultCardsMeta.download_uri);
  const cardsToImport = quickMode ? bulkData.slice(0, 2000) : bulkData;

  await scryfall.updateCards(cardsToImport);
  await scryfall.setLastUpdated(defaultCardsMeta.updated_at);
}

// BAKERT "fetch" npt "get"
async function fetchBulkDataMeta() {
  const bulkDataRes = await fetch(SCRYFALL_BULK_URL);
  if (!bulkDataRes.ok) throw new Error(`Failed to fetch bulk data info: ${bulkDataRes.statusText}`);

  const bulkDataMeta = await bulkDataRes.json() as BulkDataMeta;
  const defaultCardsMeta = bulkDataMeta.data.find((d) => d.type === "default_cards");
  if (!defaultCardsMeta) throw new Error("Default cards bulk data not found");

  return defaultCardsMeta;
}

async function retrieveBulkData(downloadUri: string): Promise<ScryfallCard[]> {
  const filename = path.basename(new URL(downloadUri).pathname);
  const tempPath = `${require('os').tmpdir()}/${filename}`;

  try {
    await access(tempPath);
    console.log(`Bulk data file ${tempPath} already exists, skipping download`);
  } catch {
    console.log(`Downloading bulk data from: ${downloadUri}`);
    const bulkRes = await fetch(downloadUri);
    const bulkData = await bulkRes.text();
    await writeFile(tempPath, bulkData);
    console.log(`Saved Scryfall bulk data to ${tempPath}`);
  }

  const fileContents = await readFile(tempPath, 'utf-8');
  const parsedData = JSON.parse(fileContents);
  return parsedData;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
