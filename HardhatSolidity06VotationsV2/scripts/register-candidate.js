// scripts/register-candidate.js  (ESM)
import { formatEther } from "viem";
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const wallets = await viem.getWalletClients();

  const idx      = parseInt(process.env.CANDIDATE_IDX || "1");
  const name     = process.env.NAME     || `Candidato ${idx}`;
  const proposal = process.env.PROPOSAL || `Proposta del candidato ${idx}`;

  const candidate = wallets[idx];
  if (!candidate) throw new Error(`Account #${idx} non trovato.`);

  const state = await contract.read.getCurrentState();
  if (state !== 1) throw new Error("La votazione non è in fase di registrazione.");

  const fee = await contract.read.registrationFee();
  console.log(`\nRegistro "${name}" (account #${idx}) — fee: ${formatEther(fee)} ETH`);

  const hash = await contract.write.registerCandidate([name, proposal], {
    account: candidate.account, value: fee,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Candidato registrato! Tx: ${receipt.transactionHash}`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
