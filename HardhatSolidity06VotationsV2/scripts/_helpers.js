// scripts/_helpers.js  (ESM)
// Con Hardhat v3, network.connect() funziona sia su reti HTTP che EDR.
// Il chainId viene letto direttamente dalla connessione (non da network.name).
import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Connette alla rete configurata e restituisce { viem, contract, publicClient }.
 * Il chainId viene letto on-chain tramite publicClient, così funziona su qualsiasi rete.
 */
export async function connect() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // Legge il chainId reale dalla rete connessa
  const chainId = await publicClient.getChainId();

  const deployedPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${chainId}/deployed_addresses.json`
  );

  if (!fs.existsSync(deployedPath)) {
    throw new Error(
      `Contratto non trovato per chain-${chainId}.\n` +
      `Esegui prima:\n` +
      `  npm run deploy:local    (se usi 'npm run node', chainId 31337)\n` +
      `  npm run deploy:edr      (se usi EDR in-process, chainId 1)\n` +
      `  npm run deploy:sepolia  (per Sepolia, chainId 11155111)`
    );
  }

  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const contractAddress = deployed["AdvancedVotingSystemModule#AdvancedVotingSystem"];
  if (!contractAddress) throw new Error("Indirizzo contratto non trovato nel file di deploy.");

  const contract = await viem.getContractAt("AdvancedVotingSystem", contractAddress);

  return { viem, contract, publicClient };
}

export const STATE_NAMES = ["Inattivo", "Registrazione", "Votazione", "Completato"];
