const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Carica i contratti già deployati da deployed-contract.json,
// oppure fa un nuovo deploy in memoria se il file non esiste o la rete non corrisponde.
async function loadOrDeploy(signers) {
  const [creator] = signers;
  const deployFile = path.join(__dirname, "..", "deployed-contract.json");
  const { chainId } = await ethers.provider.getNetwork();

  if (fs.existsSync(deployFile)) {
    const saved = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    const codeCheck = await ethers.provider.getCode(saved.marketplace);
    if (saved.chainId === chainId.toString() && codeCheck !== "0x") {
      console.log("[loadOrDeploy] Riutilizzo contratti già deployati su", saved.network);
      const naoToken = await ethers.getContractAt("NAOTOKENERC20", saved.token);
      const nft = await ethers.getContractAt("NFTCollection", saved.nftCollection);
      const marketplace = await ethers.getContractAt("Marketplace", saved.marketplace);
      return { naoToken, nft, marketplace };
    }
  }

  console.log("[loadOrDeploy] Nessun deploy trovato, eseguo fresh deploy in memoria...");

  const MockToken = await ethers.getContractFactory("NAOTOKENERC20");
  const naoToken = await MockToken.connect(creator).deploy("NAO Token", "NAO");
  await naoToken.waitForDeployment();

  const NFTCollection = await ethers.getContractFactory("NFTCollection");
  const nft = await NFTCollection.connect(creator).deploy(ethers.parseEther("0.01"), 0);
  await nft.waitForDeployment();

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.connect(creator).deploy(await naoToken.getAddress(), 250);
  await marketplace.waitForDeployment();

  return { naoToken, nft, marketplace };
}

async function main() {
  const signers = await ethers.getSigners();
  const [creator, seller, buyer] = signers;

  console.log("=== NFT Marketplace Interactive Demo ===");
  console.log("Network :", network.name);
  console.log("Creator :", creator.address);
  console.log("Seller  :", seller.address);
  console.log("Buyer   :", buyer.address);

  // -------------------------------------------------------------------
  // 1. Carica o deploya i contratti
  // -------------------------------------------------------------------
  const { naoToken, nft, marketplace } = await loadOrDeploy(signers);
  const tokenAddress = await naoToken.getAddress();
  const nftAddress = await nft.getAddress();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("\n--- Contratti ---");
  console.log("  NAO Token    :", tokenAddress);
  console.log("  NFTCollection:", nftAddress);
  console.log("  Marketplace  :", marketplaceAddress);

  // -------------------------------------------------------------------
  // 2. Prepara token: distribuisce NAO al buyer se non ce l'ha già
  // -------------------------------------------------------------------
  const buyerNaoBal = await naoToken.balanceOf(buyer.address);
  if (buyerNaoBal < ethers.parseEther("20")) {
    await (await naoToken.transfer(buyer.address, ethers.parseEther("100"))).wait();
    console.log("\n[setup] Inviati 100 NAO al Buyer");
  }

  // -------------------------------------------------------------------
  // 3. Minta un NFT al creator (owner del contratto) e trasferiscilo al seller
  // -------------------------------------------------------------------
  const mintTx = await nft.connect(creator).mint(creator.address, "ipfs://QmInteractDemo/metadata.json");
  const mintReceipt = await mintTx.wait();
  // Recupera il tokenId dall'evento Transfer emesso dal mint
  const transferEvent = mintReceipt.logs
    .map(log => { try { return nft.interface.parseLog(log); } catch { return null; } })
    .find(e => e && e.name === "Transfer");
  const tokenId = transferEvent ? transferEvent.args.tokenId : 0n;
  console.log(`\n[step 1] Creator ha mintato NFT #${tokenId}`);

  await (await nft.connect(creator).transferFrom(creator.address, seller.address, tokenId)).wait();
  console.log(`[step 1] NFT #${tokenId} trasferito al Seller`);

  // -------------------------------------------------------------------
  // 4. Seller lista l'NFT a 10 NAO
  // -------------------------------------------------------------------
  const initialPrice = ethers.parseEther("10");
  await (await nft.connect(seller).approve(marketplaceAddress, tokenId)).wait();
  await (await marketplace.connect(seller).listItem(nftAddress, tokenId, initialPrice)).wait();
  console.log(`[step 2] Seller ha listato NFT #${tokenId} a 10 NAO`);

  // -------------------------------------------------------------------
  // 5. Seller aggiorna il prezzo a 20 NAO
  // -------------------------------------------------------------------
  const newPrice = ethers.parseEther("20");
  await (await marketplace.connect(seller).updateListingPrice(nftAddress, tokenId, newPrice)).wait();
  console.log(`[step 3] Seller ha aggiornato il prezzo a 20 NAO`);

  // Verifica listing corrente
  const listing = await marketplace.listings(nftAddress, tokenId);
  console.log(`         Listing attivo: ${listing.active}, prezzo: ${ethers.formatEther(listing.price)} NAO, seller: ${listing.seller}`);

  // -------------------------------------------------------------------
  // 6. Buyer acquista l'NFT
  // -------------------------------------------------------------------
  await (await naoToken.connect(buyer).approve(marketplaceAddress, newPrice)).wait();

  const creatorBalBefore = await naoToken.balanceOf(creator.address);
  const sellerBalBefore  = await naoToken.balanceOf(seller.address);

  console.log(`[step 4] Buyer esegue buyItem...`);
  await (await marketplace.connect(buyer).buyItem(nftAddress, tokenId)).wait();

  const creatorBalAfter = await naoToken.balanceOf(creator.address);
  const sellerBalAfter  = await naoToken.balanceOf(seller.address);

  // -------------------------------------------------------------------
  // 7. Risultati
  // -------------------------------------------------------------------
  console.log("\n========== Risultati Acquisto ==========");
  console.log(`Nuovo proprietario NFT #${tokenId} : ${await nft.ownerOf(tokenId)}`);
  console.log(`Royalty ricevuta dal Creator (5%) : ${ethers.formatEther(creatorBalAfter - creatorBalBefore)} NAO`);
  console.log(`Proventi netti del Seller (95%)   : ${ethers.formatEther(sellerBalAfter - sellerBalBefore)} NAO`);
  console.log("========================================");
  console.log("=== Demo completata con successo ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
