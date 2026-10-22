/**
 * fund.js — Distribuisce NAO token e minta NFT agli account locali Hardhat.
 *
 * Uso base (distribuzione agli account #1-#4):
 *   npx hardhat run scripts/fund.js --network localhost
 *
 * Destinatario singolo:
 *   TO=0xABCD...1234 npx hardhat run scripts/fund.js --network localhost
 *
 * Importo token personalizzato:
 *   AMOUNT=500 npx hardhat run scripts/fund.js --network localhost
 *
 * Numero di NFT per account:
 *   NFTS=3 npx hardhat run scripts/fund.js --network localhost
 */

const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOY_FILE = path.join(__dirname, "..", "deployed-contract.json");
const ETH_THRESHOLD = ethers.parseEther("0.5"); // sotto questa soglia invia ETH per gas
const ETH_TOP_UP    = ethers.parseEther("10");  // quantità di ETH da inviare

async function main() {
  const signers = await ethers.getSigners();
  const [owner] = signers;

  // -------------------------------------------------------
  // Carica indirizzi contratti da deployed-contract.json
  // -------------------------------------------------------
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

  const naoToken   = await ethers.getContractAt("NAOTOKENERC20", saved.token);
  const nft        = await ethers.getContractAt("NFTCollection",  saved.nftCollection);
  const naoAddress = saved.token;

  // -------------------------------------------------------
  // Determina destinatari
  // -------------------------------------------------------
  let targets;
  if (process.env.TO) {
    if (!ethers.isAddress(process.env.TO)) {
      console.error("❌  TO non è un indirizzo valido:", process.env.TO);
      process.exit(1);
    }
    targets = [process.env.TO];
  } else {
    // Account #1-#4 (il #0 è l'owner/deployer)
    targets = signers.slice(1, 5).map(s => s.address);
  }

  const tokenAmount = ethers.parseEther(process.env.AMOUNT || "1000");
  const nftCount    = parseInt(process.env.NFTS || "2", 10);

  console.log(`\n=== NFT Marketplace Fund Script ===`);
  console.log(`Network    : ${network.name} (chainId ${chainId})`);
  console.log(`Owner      : ${owner.address}`);
  console.log(`Token NAO  : ${naoAddress}`);
  console.log(`NFT        : ${saved.nftCollection}`);
  console.log(`Destinatari: ${targets.length}`);
  console.log(`Importo NAO: ${ethers.formatEther(tokenAmount)} per indirizzo`);
  console.log(`NFT        : ${nftCount} per indirizzo`);
  console.log("===================================\n");

  for (const target of targets) {
    console.log(`--- Finanziamento di ${target} ---`);

    // 1. Top-up ETH se il balance è basso
    const ethBal = await ethers.provider.getBalance(target);
    if (ethBal < ETH_THRESHOLD) {
      await (await owner.sendTransaction({ to: target, value: ETH_TOP_UP })).wait();
      console.log(`  ✅ Inviati ${ethers.formatEther(ETH_TOP_UP)} ETH per gas`);
    } else {
      console.log(`  ℹ️  ETH balance ok: ${ethers.formatEther(ethBal)} ETH`);
    }

    // 2. Trasferisci NAO token
    const naoBalance = await naoToken.balanceOf(target);
    if (naoBalance < tokenAmount) {
      const toSend = tokenAmount - naoBalance;
      await (await naoToken.transfer(target, toSend)).wait();
      console.log(`  ✅ Inviati ${ethers.formatEther(toSend)} NAO`);
    } else {
      console.log(`  ℹ️  NAO balance ok: ${ethers.formatEther(naoBalance)} NAO`);
    }

    // 3. Minta NFT all'owner, poi trasferiscili al target
    //    (solo l'owner di NFTCollection può mintare)
    for (let i = 0; i < nftCount; i++) {
      const metadataUri = `ipfs://QmFundScript/${target.slice(2, 8)}_${i}.json`;
      const tx = await nft.connect(owner).mint(owner.address, metadataUri);
      const receipt = await tx.wait();

      // Recupera il tokenId dall'evento Transfer del mint
      const transferEvent = receipt.logs
        .map(log => { try { return nft.interface.parseLog(log); } catch { return null; } })
        .find(e => e && e.name === "Transfer");
      const tokenId = transferEvent ? transferEvent.args.tokenId : BigInt(i);

      await (await nft.connect(owner).transferFrom(owner.address, target, tokenId)).wait();
      console.log(`  ✅ Mintato e trasferito NFT #${tokenId}`);
    }

    const finalNao = await naoToken.balanceOf(target);
    console.log(`  📊 Balance finale: ${ethers.formatEther(finalNao)} NAO\n`);
  }

  console.log("=== Fund completato ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
