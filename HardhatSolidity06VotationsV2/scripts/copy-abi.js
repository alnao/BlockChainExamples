// scripts/copy-abi.js  (ESM)
// Copia l'ABI compilata da artifacts/ nella cartella del frontend Vite.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const src = path.join(
  __dirname,
  "../artifacts/contracts/votations.sol/AdvancedVotingSystem.json"
);
const destDir = path.join(__dirname, "../client-vite/src/contracts");
const dest = path.join(destDir, "AdvancedVotingSystem.json");

if (!fs.existsSync(src)) {
  console.error("❌  Artifact non trovato. Esegui prima: npm run compile\n   " + src);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`✅  ABI copiata in: ${dest}`);
