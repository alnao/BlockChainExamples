// scripts/change-admin.js  (ESM)
import { connect } from "./_helpers.js";

async function main() {
  const { viem, contract, publicClient } = await connect();
  const wallets = await viem.getWalletClients();
  const [currentAdmin] = wallets;

  const contractAdmin = await contract.read.admin();
  if (currentAdmin.account.address.toLowerCase() !== contractAdmin.toLowerCase())
    throw new Error("Solo l'amministratore attuale può cambiare il ruolo.");

  const newAdminAddress = process.env.NEW_ADMIN_ADDRESS
    || wallets[parseInt(process.env.NEW_ADMIN_IDX || "1")].account.address;

  if (newAdminAddress.toLowerCase() === contractAdmin.toLowerCase())
    throw new Error("Il nuovo admin è uguale all'attuale.");

  console.log(`\nCambio admin: ${currentAdmin.account.address} → ${newAdminAddress}`);

  const hash = await contract.write.changeAdmin([newAdminAddress], {
    account: currentAdmin.account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const updated = await contract.read.admin();

  console.log(`✅ Nuovo admin: ${updated}  Tx: ${receipt.transactionHash}`);
  console.log(`⚠️  L'account ${currentAdmin.account.address} non è più admin.`);
}

main().catch((err) => { console.error("❌ Errore:", err.message); process.exit(1); });
