// scripts/end-voting.js  (ESM)
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const [admin] = await viem.getWalletClients();

  const state = await contract.read.getCurrentState();
  if (state !== 2) throw new Error("La votazione non è in fase di voto.");

  const votingId = await contract.read.getCurrentVotingId();
  const addrs    = await contract.read.getCandidatesList([votingId]);
  console.log(`\nChiudo votazione #${votingId}:`);
  for (const a of addrs) {
    const d = await contract.read.getCandidateDetails([votingId, a]);
    console.log(`  ${d[0]}: ${d[2]} voti`);
  }

  const hash = await contract.write.endVoting({ account: admin.account });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const r = await contract.read.getVotingResults([votingId]);
  console.log(`\n✅ Terminata! Tx: ${receipt.transactionHash}`);
  console.log(`🏆 Vincitore: ${r[3]} — ${r[4]} voti su ${r[1]} totali`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
