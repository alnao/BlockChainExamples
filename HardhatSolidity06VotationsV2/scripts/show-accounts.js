// scripts/show-accounts.js  (ESM)
// Mostra tutti gli account Hardhat con saldo e ruolo.
// Uso: npm run accounts
import { network } from "hardhat";
import { formatEther } from "viem";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Chiavi private fisse della rete Hardhat locale (sempre le stesse, pubbliche per design)
const HARDHAT_PRIVATE_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250132c444d67f0f53a68d8f4e4d2a14a44d9a",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
];

async function main() {
  const { viem } = await network.connect();
  const wallets = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  // Cerca l'admin nei deployment esistenti (chain-31337 o chain-1)
  let contractAdmin = null;
  let contractAddress = null;
  for (const chainId of ["31337", "1"]) {
    const p = path.join(ROOT, `ignition/deployments/chain-${chainId}/deployed_addresses.json`);
    if (fs.existsSync(p)) {
      const deployed = JSON.parse(fs.readFileSync(p, "utf8"));
      const addr = deployed["AdvancedVotingSystemModule#AdvancedVotingSystem"];
      if (addr) {
        contractAddress = addr;
        try {
          const c = await viem.getContractAt("AdvancedVotingSystem", addr);
          contractAdmin = (await c.read.admin()).toLowerCase();
        } catch { /* contratto non raggiungibile */ }
        break;
      }
    }
  }

  console.log("\n=== Account Hardhat disponibili ===\n");
  console.log("  #  │ Indirizzo                                  │ Saldo (ETH)  │ Ruolo");
  console.log("─────┼────────────────────────────────────────────┼──────────────┼──────────────");

  for (let i = 0; i < Math.min(wallets.length, 10); i++) {
    const addr = wallets[i].account.address;
    const balance = await publicClient.getBalance({ address: addr });
    const eth = Number(formatEther(balance)).toFixed(2).padStart(12);
    const isAdmin = contractAdmin && addr.toLowerCase() === contractAdmin;
    const role = isAdmin
      ? "ADMIN ★"
      : contractAdmin
        ? `account ${i}`
        : i === 0 ? "(sarà ADMIN al deploy)" : `account ${i}`;

    console.log(`  ${String(i).padEnd(2)} │ ${addr} │ ${eth} │ ${role}`);
  }

  console.log("\n" + "─".repeat(75));

  if (contractAddress) {
    console.log(`\n📄 Contratto: ${contractAddress}`);
    if (contractAdmin) {
      console.log(`👑 Admin:     ${contractAdmin}`);
    } else {
      console.log(`⚠️  Contratto trovato ma non raggiungibile (nodo non in esecuzione?)`);
    }
  } else {
    console.log(`\n⚠️  Contratto non ancora deployato.`);
    console.log(`   Avvia il nodo (npm run node) e poi: npm run deploy:local`);
  }

  console.log("\n🔑 Chiavi private (SOLO per sviluppo locale — non usare su mainnet):\n");
  const ROLES = ["ADMIN", "Candidato 1", "Candidato 2", "Votante 1", "Votante 2",
                 "Votante 3", "Votante 4", "Votante 5", "Votante 6", "Votante 7"];
  for (let i = 0; i < HARDHAT_PRIVATE_KEYS.length; i++) {
    const addr = i < wallets.length ? wallets[i].account.address : "—";
    console.log(`  #${i} [${ROLES[i] || "account " + i}]`);
    console.log(`     Indirizzo:   ${addr}`);
    console.log(`     Private Key: ${HARDHAT_PRIVATE_KEYS[i]}\n`);
  }

  console.log("🦊 Come importare in MetaMask:");
  console.log("   avatar in alto a destra → 'Importa account' → incolla la Private Key\n");
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
