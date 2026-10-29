/**
 * fund.js — Distribuisce ETH e NAO Token agli account locali Hardhat per testare la lotteria.
 *
 * Uso base (distribuzione agli account #1-#4):
 *   npx hardhat run scripts/fund.js --network localhost
 *
 * Destinatario singolo:
 *   TO=0xABCD...1234 npx hardhat run scripts/fund.js --network localhost
 *
 * Importo token personalizzato:
 *   AMOUNT=200 npx hardhat run scripts/fund.js --network localhost
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOY_FILE = path.join(__dirname, "..", "deployed-contract.json");
const ETH_THRESHOLD = ethers.parseEther("0.5"); // soglia minima ETH
const ETH_TOP_UP    = ethers.parseEther("10");  // ETH inviati per gas

async function main() {
  const signers = await ethers.getSigners();
  const [owner] = signers;

  // 1. Controlla file deploy
  if (!fs.existsSync(DEPLOY_FILE)) {
    console.error("❌  deployed-contract.json non trovato.");
    console.error("    Esegui prima: npm run deploy:local");
    process.exit(1);
  }

  const saved = JSON.parse(fs.readFileSync(DEPLOY_FILE, "utf8"));
  const { chainId } = await ethers.provider.getNetwork();

  if (saved.chainId !== chainId.toString()) {
    console.error(`❌  Network mismatch: deployed su chainId ${saved.chainId}, connesso a ${chainId}`);
    process.exit(1);
  }

  const naoToken = await ethers.getContractAt("NAOTOKENERC20", saved.token);

  // 2. Destinatari
  let targets;
  if (process.env.TO) {
    if (!ethers.isAddress(process.env.TO)) {
      console.error("❌  TO non è un indirizzo valido:", process.env.TO);
      process.exit(1);
    }
    targets = [process.env.TO];
  } else {
    // Account #1-#4 (account #0 è owner/deployer)
    targets = signers.slice(1, 5).map((s) => s.address);
  }

  const tokenAmount = ethers.parseEther(process.env.AMOUNT || "100");

  console.log("\n=== Lottery Chainlink VRF – Fund Script ===");
  console.log(`Network     : ${network.name} (chainId ${chainId})`);
  console.log(`Owner       : ${owner.address}`);
  console.log(`Token NAO   : ${saved.token}`);
  console.log(`Lottery     : ${saved.lottery}`);
  console.log(`Destinatari : ${targets.length}`);
  console.log(`Importo NAO : ${ethers.formatEther(tokenAmount)} per indirizzo`);
  console.log("==========================================\n");

  for (const target of targets) {
    console.log(`--- Finanziamento account: ${target} ---`);

    // Top-up ETH se necessario
    const ethBal = await ethers.provider.getBalance(target);
    if (ethBal < ETH_THRESHOLD) {
      await (await owner.sendTransaction({ to: target, value: ETH_TOP_UP })).wait();
      console.log(`  ✅ Inviati ${ethers.formatEther(ETH_TOP_UP)} ETH per gas`);
    } else {
      console.log(`  ℹ️  ETH balance sufficiente: ${ethers.formatEther(ethBal)} ETH`);
    }

    // Top-up NAO Token
    const naoBalance = await naoToken.balanceOf(target);
    if (naoBalance < tokenAmount) {
      const toSend = tokenAmount - naoBalance;
      await (await naoToken.transfer(target, toSend)).wait();
      console.log(`  ✅ Inviati ${ethers.formatEther(toSend)} NAO Token`);
    } else {
      console.log(`  ℹ️  NAO balance sufficiente: ${ethers.formatEther(naoBalance)} NAO`);
    }

    const finalNao = await naoToken.balanceOf(target);
    console.log(`  📊 Saldo finale: ${ethers.formatEther(finalNao)} NAO\n`);
  }

  console.log("=== Finanziamento completato con successo ===\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
