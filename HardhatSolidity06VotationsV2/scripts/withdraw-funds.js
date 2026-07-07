// scripts/withdraw-funds.js  (ESM)
import { parseEther, formatEther } from "viem";
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const [admin] = await viem.getWalletClients();

  const contractAdmin = await contract.read.admin();
  if (admin.account.address.toLowerCase() !== contractAdmin.toLowerCase())
    throw new Error("Solo l'amministratore può prelevare i fondi.");

  const balance = await contract.read.getBalance();
  console.log(`\nSaldo contratto: ${formatEther(balance)} ETH`);
  if (balance === 0n) { console.log("Nessun fondo da prelevare."); return; }

  const amount = process.env.AMOUNT ? parseEther(process.env.AMOUNT) : balance;
  if (amount > balance) throw new Error(`Importo (${formatEther(amount)} ETH) supera il saldo.`);
  console.log(`Prelevo: ${formatEther(amount)} ETH`);

  const hash = await contract.write.withdrawFunds([amount], { account: admin.account });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
  const newBalance = await contract.read.getBalance();

  console.log(`✅ Prelievo completato! Tx: ${receipt.transactionHash}`);
  console.log(`   Gas speso: ${formatEther(gasCost)} ETH`);
  console.log(`   Nuovo saldo contratto: ${formatEther(newBalance)} ETH`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
