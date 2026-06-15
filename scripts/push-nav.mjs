import fs from "fs";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "cuiis46d",
  dataset: "production",
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const data = JSON.parse(
  fs.readFileSync("./frontend/scripts/nav-seed.json", "utf8"),
);

delete data._createdAt;
delete data._updatedAt;
delete data._rev;
delete data._system;

await client.createOrReplace(data);
console.log("Navigation document pushed successfully!");
