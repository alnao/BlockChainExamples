// scripts/vote.js  (ESM)
import { formatEther } from "viem";
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const wallets = await viem.getWalletClients();

  const candidateIdx = parseInt(process.env.CANDIDATE_IDX || "1"); // 1-based
  const voterIdx     = parseInt(process.env.VOTER_IDX     || "3");
  const voter        = wallets[voterIdx];
  if (!voter) throw new Error(`Account #${voterIdx} non trovato.`);

  const state = await contract.read.getCurrentState();
  if (state !== 2) throw new Error("La votazione non è in fase di voto.");

  const votingId = await contract.read.getCurrentVotingId();
  const hasVoted = await contract.read.hasVoted([votingId, voter.account.address]);
  if (hasVoted) throw new Error("Hai già votato.");

  const addrs = await contract.read.getCandidatesList([votingId]);
  if (candidateIdx < 1 || candidateIdx > addrs.length)
    throw new Error(`Indice candidato non valido (1–${addrs.length}).`);

  const candidateAddr = addrs[candidateIdx - 1];
  const d    = await contract.read.getCandidateDetails([votingId, candidateAddr]);
  const fee  = await contract.read.votingFee();
  console.log(`\nVoto di account #${voterIdx} per "${d[0]}" — fee: ${formatEther(fee)} ETH`);

  const hash = await contract.write.vote([candidateAddr], {
    account: voter.account, value: fee,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Voto registrato! Tx: ${receipt.transactionHash}`);

  const newState = await contract.read.getCurrentState();
  if (newState === 0) {
    const r = await contract.read.getVotingResults([votingId]);
    console.log(`🏆 Completata automaticamente! Vincitore: ${r[3]} (${r[4]} voti)`);
  }
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
