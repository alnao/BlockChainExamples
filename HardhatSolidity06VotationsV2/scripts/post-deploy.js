// scripts/post-deploy.js  (ESM)
// Eseguito automaticamente da "npm run deploy:local" dopo il deploy Ignition.
// Legge l'indirizzo del contratto deployato e:
//   1. Copia l'ABI in client-vite/src/contracts/
//   2. Aggiorna (o crea) client-vite/.env con VITE_CONTRACT_ADDRESS

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ---- 1. Copia ABI ---------------------------------------------------------
const artifactSrc = path.join(ROOT, "artifacts/contracts/votations.sol/AdvancedVotingSystem.json");
const contractsDir = path.join(ROOT, "client-vite/src/contracts");
const artifactDest = path.join(contractsDir, "AdvancedVotingSystem.json");

if (!fs.existsSync(artifactSrc)) {
  console.error("❌  Artifact non trovato. Esegui prima: npm run compile");
  process.exit(1);
}
fs.mkdirSync(contractsDir, { recursive: true });
fs.copyFileSync(artifactSrc, artifactDest);
console.log(`✅  ABI copiata in: ${artifactDest}`);

// ---- 2. Leggi indirizzo da Ignition ---------------------------------------
// Prova prima localhost (chainId 31337), poi EDR (chainId 1)
const chains = ["31337", "1", "11155111"];
let contractAddress = null;
let foundChain = null;

for (const chainId of chains) {
  const deployedPath = path.join(
    ROOT, `ignition/deployments/chain-${chainId}/deployed_addresses.json`
  );
  if (fs.existsSync(deployedPath)) {
    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    const addr = deployed["AdvancedVotingSystemModule#AdvancedVotingSystem"];
    if (addr) {
      contractAddress = addr;
      foundChain = chainId;
      break;
    }
  }
}

if (!contractAddress) {
  console.warn("⚠️  Indirizzo contratto non trovato nei file Ignition.");
  console.warn("   Aggiorna manualmente VITE_CONTRACT_ADDRESS in client-vite/.env");
  process.exit(0);
}

// ---- 3. Aggiorna client-vite/.env ----------------------------------------
const envPath = path.join(ROOT, "client-vite/.env");
// Usa la variabile specifica per chainId (es: VITE_CONTRACT_ADDRESS_31337)
const envKey = `VITE_CONTRACT_ADDRESS_${foundChain}`;
const envLine = `${envKey}=${contractAddress}`;

let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

const regex = new RegExp(`^${envKey}=.*`, "m");
if (regex.test(content)) {
  content = content.replace(regex, envLine);
} else {
  content = content.trimEnd() + (content ? "\n" : "") + envLine + "\n";
}
fs.writeFileSync(envPath, content);

console.log(`✅  Indirizzo contratto (chain-${foundChain}): ${contractAddress}`);
console.log(`✅  client-vite/.env aggiornato: ${envKey}=${contractAddress}`);
console.log(`\n🚀  Ora avvia il frontend con:`);
console.log(`    cd client-vite && npm run dev`);
