// scripts/create-voting.js  (ESM)
import { parseEther, formatEther } from "viem";
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const [admin] = await viem.getWalletClients();

  const title       = process.env.TITLE       || "Elezione Rappresentante";
  const description = process.env.DESCRIPTION || "Votazione per eleggere il rappresentante";
  const regFee      = parseEther(process.env.REG_FEE  || "0.1");
  const voteFee     = parseEther(process.env.VOTE_FEE || "0.01");

  console.log("\n=== Creazione nuova sessione di votazione ===");
  console.log(`Titolo: ${title}  |  Admin: ${admin.account.address}`);
  console.log(`Fee candidatura: ${formatEther(regFee)} ETH  |  Fee voto: ${formatEther(voteFee)} ETH`);

  const state = await contract.read.getCurrentState();
  if (state !== 0) throw new Error("C'è già una votazione attiva.");

  const hash = await contract.write.createVotingSession(
    [title, description, regFee, voteFee], { account: admin.account }
  );
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const votingId = await contract.read.getCurrentVotingId();

  console.log(`\n✅ Votazione #${votingId} creata! Tx: ${receipt.transactionHash}`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
