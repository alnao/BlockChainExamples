// scripts/start-voting.js  (ESM)
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const [admin] = await viem.getWalletClients();
  const maxVotes = BigInt(process.env.MAX_VOTES || "3");

  const state = await contract.read.getCurrentState();
  if (state !== 1) throw new Error("La votazione non è in fase di registrazione.");

  const votingId = await contract.read.getCurrentVotingId();
  const addrs    = await contract.read.getCandidatesList([votingId]);
  console.log(`\nAvvio votazione #${votingId} — ${addrs.length} candidati — max voti: ${maxVotes}`);
  addrs.forEach(async (a, i) => {
    const d = await contract.read.getCandidateDetails([votingId, a]);
    console.log(`  ${i+1}. ${d[0]}`);
  });

  const hash = await contract.write.closeRegistrationAndStartVoting([maxVotes], {
    account: admin.account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Votazione avviata! Tx: ${receipt.transactionHash}`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
