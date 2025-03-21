import { writeFile } from "fs/promises";

const SCRYFALL_BULK_URL = "https://api.scryfall.com/bulk-data";

async function main() {
  console.log("Running Scryfall ingestion...");

  const res = await fetch(SCRYFALL_BULK_URL);
  if (!res.ok) throw new Error(`Failed to fetch bulk data: ${res.statusText}`);

  const data = await res.json();
  const defaultCards = data.data.find((d: any) => d.type === "default_cards");

  if (!defaultCards) throw new Error("Default cards bulk data not found");

  console.log(`Downloading bulk data from: ${defaultCards.download_uri}`);
  const bulkRes = await fetch(defaultCards.download_uri);
  const bulkData = await bulkRes.text();

  await writeFile("./scryfall.json", bulkData);
  console.log("Saved Scryfall bulk data to scryfall.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
