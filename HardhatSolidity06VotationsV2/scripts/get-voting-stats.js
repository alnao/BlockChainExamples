// scripts/get-voting-stats.js  (ESM)
import { formatEther } from "viem";
import { connect, STATE_NAMES } from "./_helpers.js";

async function main() {
  const { viem, contract } = await connect();
  const [admin] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  console.log(`\n=== Statistiche votazione ===`);
  console.log(`Contratto: ${contract.address}`);
  const contractAdmin = await contract.read.admin();
  console.log(`Admin: ${contractAdmin}`);

  const state = await contract.read.getCurrentState();
  console.log(`Stato: ${STATE_NAMES[Number(state)]}`);

  if (state === 0) {
    const pastIds = await contract.read.getPastVotingSessions();
    if (pastIds.length === 0) { console.log(`\nNessuna votazione passata.`); return; }
    console.log(`\nVotazioni passate: ${pastIds.length}`);
    const pastResults = await contract.read.getAllPastVotingResults();
    for (let i = 0; i < pastResults[0].length; i++) {
      const id = pastResults[0][i];
      const details = await contract.read.getVotingSessionDetails([id]);
      const total = Number(details.totalVotes ?? 0n);
      const wins  = Number(pastResults[4][i] ?? 0n);
      const perc  = total > 0 ? Math.round(wins * 100 / total) : 0;
      console.log(`\n  #${id}: ${pastResults[1][i]}`);
      console.log(`  Vincitore: ${pastResults[3][i]} — ${wins} voti (${perc}%)`);
    }
    return;
  }

  const votingId = await contract.read.getCurrentVotingId();
  const details = await contract.read.getVotingSessionDetails([votingId]);
  console.log(`\nVotazione #${votingId}: ${details.title}`);
  console.log(`Commissione registrazione: ${formatEther(details.registrationFee)} ETH`);
  console.log(`Commissione voto: ${formatEther(details.votingFee)} ETH`);
  if (state >= 2) console.log(`Voti massimi: ${details.maxVotesRequired}`);

  const candidateAddresses = await contract.read.getCandidatesList([votingId]);
  console.log(`\nCandidati: ${candidateAddresses.length}`);
  for (let i = 0; i < candidateAddresses.length; i++) {
    const d = await contract.read.getCandidateDetails([votingId, candidateAddresses[i]]);
    console.log(`  ${i + 1}. ${d[0]}${state >= 2 ? ` — ${d[2]} voti` : ''}`);
  }

  if (admin.account.address.toLowerCase() === contractAdmin.toLowerCase()) {
    const balance = await contract.read.getBalance();
    console.log(`\nSaldo contratto: ${formatEther(balance)} ETH`);
  }
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
