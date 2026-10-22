const { expect } = require("chai");
const { ethers } = require("hardhat");

// ============================================================
// Helpers
// ============================================================
async function deployAll(creator) {
  const MockERC20 = await ethers.getContractFactory("NAOTOKENERC20");
  const naoToken = await MockERC20.deploy("NAO Token", "NAO");

  // publicMintPrice = 0.01 ETH, maxSupply = 0 (illimitata)
  const NFTCollection = await ethers.getContractFactory("NFTCollection");
  const nft = await NFTCollection.connect(creator).deploy(ethers.parseEther("0.01"), 0);

  // feeBps = 250 (2.5%)
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(await naoToken.getAddress(), 250);

  return { naoToken, nft, marketplace };
}

// ============================================================
// Suite: NFTCollection
// ============================================================
describe("NFTCollection", function () {
  let nft, creator, addr1, addr2;

  beforeEach(async function () {
    [creator, addr1, addr2] = await ethers.getSigners();
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    nft = await NFTCollection.connect(creator).deploy(ethers.parseEther("0.01"), 10);
  });

  it("Owner può mintare un NFT e il tokenId è incrementale", async function () {
    await nft.connect(creator).mint(addr1.address, "ipfs://0");
    await nft.connect(creator).mint(addr1.address, "ipfs://1");
    expect(await nft.ownerOf(0)).to.equal(addr1.address);
    expect(await nft.ownerOf(1)).to.equal(addr1.address);
    expect(await nft.totalSupply()).to.equal(2);
  });

  it("Non-owner non può usare mint (solo onlyOwner)", async function () {
    await expect(
      nft.connect(addr1).mint(addr1.address, "ipfs://x")
    ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
  });

  it("publicMint funziona con il prezzo corretto", async function () {
    const price = ethers.parseEther("0.01");
    await nft.connect(addr1).publicMint("ipfs://pub/0", { value: price });
    expect(await nft.ownerOf(0)).to.equal(addr1.address);
  });

  it("publicMint refonda il sovrappiù di ETH", async function () {
    const price = ethers.parseEther("0.01");
    const overpay = ethers.parseEther("0.05");
    const balBefore = await ethers.provider.getBalance(addr1.address);
    const tx = await nft.connect(addr1).publicMint("ipfs://pub/0", { value: overpay });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(addr1.address);
    // Deve aver speso solo price + gas, non overpay
    expect(balBefore - balAfter).to.be.closeTo(price + gasCost, ethers.parseEther("0.001"));
  });

  it("publicMint reverta con ETH insufficiente", async function () {
    await expect(
      nft.connect(addr1).publicMint("ipfs://pub/0", { value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Insufficient ETH");
  });

  it("publicMint reverta se disabilitato (price = 0)", async function () {
    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    const nftNoPub = await NFTCollection.deploy(0, 0); // price=0 disabilita
    await expect(
      nftNoPub.connect(addr1).publicMint("ipfs://x", { value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Public mint not enabled");
  });

  it("Rispetta maxSupply", async function () {
    // maxSupply = 10 nel beforeEach
    for (let i = 0; i < 10; i++) {
      await nft.connect(creator).mint(addr1.address, `ipfs://${i}`);
    }
    await expect(
      nft.connect(creator).mint(addr1.address, "ipfs://overflow")
    ).to.be.revertedWith("Max supply reached");
  });

  it("Owner può aggiornare il prezzo del mint pubblico", async function () {
    const newPrice = ethers.parseEther("0.05");
    await nft.connect(creator).setPublicMintPrice(newPrice);
    expect(await nft.publicMintPrice()).to.equal(newPrice);
  });

  it("Owner può prelevare ETH accumulati", async function () {
    await nft.connect(addr1).publicMint("ipfs://pub/0", { value: ethers.parseEther("0.01") });
    const ownerBalBefore = await ethers.provider.getBalance(creator.address);
    const tx = await nft.connect(creator).withdrawFunds(creator.address);
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const ownerBalAfter = await ethers.provider.getBalance(creator.address);
    expect(ownerBalAfter - ownerBalBefore + gasCost).to.be.closeTo(
      ethers.parseEther("0.01"), ethers.parseEther("0.0001")
    );
  });

  it("Supporta le interfacce ERC721 ed ERC2981", async function () {
    // ERC721 interfaceId = 0x80ac58cd
    expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
    // ERC2981 interfaceId = 0x2a55205a
    expect(await nft.supportsInterface("0x2a55205a")).to.be.true;
  });
});

// ============================================================
// Suite: Marketplace — Listing & Amministrazione
// ============================================================
describe("Marketplace — Listing & Admin", function () {
  let nft, marketplace, naoToken;
  let owner, seller, buyer, other;

  beforeEach(async function () {
    [owner, seller, buyer, other] = await ethers.getSigners();
    ({ naoToken, nft, marketplace } = await deployAll(owner));

    // Mint NFT #0 all'owner, trasferiscilo al seller
    await nft.connect(owner).mint(owner.address, "ipfs://0");
    await nft.connect(owner).transferFrom(owner.address, seller.address, 0);

    // Distribuisci 1000 NAO al buyer
    await naoToken.transfer(buyer.address, ethers.parseEther("1000"));
  });

  it("Seller può listare, aggiornare prezzo e cancellare un NFT", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    const price   = ethers.parseEther("10");
    const price2  = ethers.parseEther("20");

    await nft.connect(seller).approve(mktAddr, 0);
    await marketplace.connect(seller).listItem(nftAddr, 0, price);

    let [sel, p, active] = await marketplace.getListing(nftAddr, 0);
    expect(active).to.be.true;
    expect(p).to.equal(price);
    expect(sel).to.equal(seller.address);

    // Update
    await marketplace.connect(seller).updateListingPrice(nftAddr, 0, price2);
    [, p] = await marketplace.getListing(nftAddr, 0);
    expect(p).to.equal(price2);

    // Cancel
    await marketplace.connect(seller).cancelListing(nftAddr, 0);
    [, , active] = await marketplace.getListing(nftAddr, 0);
    expect(active).to.be.false;
  });

  it("Non-seller non può aggiornare il prezzo", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);
    await marketplace.connect(seller).listItem(nftAddr, 0, ethers.parseEther("10"));

    await expect(
      marketplace.connect(buyer).updateListingPrice(nftAddr, 0, ethers.parseEther("5"))
    ).to.be.revertedWith("Not seller");
  });

  it("Non-seller non può cancellare il listing", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);
    await marketplace.connect(seller).listItem(nftAddr, 0, ethers.parseEther("10"));

    await expect(
      marketplace.connect(other).cancelListing(nftAddr, 0)
    ).to.be.revertedWith("Not seller");
  });

  it("listItem reverta se price = 0", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);
    await expect(
      marketplace.connect(seller).listItem(nftAddr, 0, 0)
    ).to.be.revertedWith("Price must be > 0");
  });

  it("listItem reverta se il marketplace non è approvato", async function () {
    await expect(
      marketplace.connect(seller).listItem(await nft.getAddress(), 0, ethers.parseEther("1"))
    ).to.be.revertedWith("Not approved");
  });

  it("listItem reverta se il chiamante non è owner dell'NFT", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);
    await expect(
      marketplace.connect(buyer).listItem(nftAddr, 0, ethers.parseEther("1"))
    ).to.be.revertedWith("Not owner");
  });

  it("Owner può cambiare la fee e non altri", async function () {
    await marketplace.connect(owner).setFee(500); // 5%
    expect(await marketplace.feeBps()).to.equal(500);

    await expect(
      marketplace.connect(seller).setFee(100)
    ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
  });

  it("setFee reverta se fee > 10%", async function () {
    await expect(
      marketplace.connect(owner).setFee(1001)
    ).to.be.revertedWith("Fee cannot exceed 10%");
  });

  it("Owner può mettere in pausa e listItem reverta quando in pausa", async function () {
    await marketplace.connect(owner).pause();

    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);

    await expect(
      marketplace.connect(seller).listItem(nftAddr, 0, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
  });

  it("cancelListing funziona anche quando il marketplace è in pausa", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await nft.connect(seller).approve(mktAddr, 0);
    await marketplace.connect(seller).listItem(nftAddr, 0, ethers.parseEther("10"));

    await marketplace.connect(owner).pause();
    // cancelListing non ha whenNotPaused, deve funzionare
    await marketplace.connect(seller).cancelListing(nftAddr, 0);
    const [, , active] = await marketplace.getListing(nftAddr, 0);
    expect(active).to.be.false;
  });
});

// ============================================================
// Suite: Marketplace — Acquisto con fee + royalties
// ============================================================
describe("Marketplace — Buy con royalties e fee", function () {
  let nft, marketplace, naoToken;
  let owner, seller, buyer;
  const PRICE = ethers.parseEther("100"); // 100 NAO

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    ({ naoToken, nft, marketplace } = await deployAll(owner));

    // Mint NFT #0: owner=creator (riceverà le royalties), trasferisce al seller
    await nft.connect(owner).mint(owner.address, "ipfs://0");
    await nft.connect(owner).transferFrom(owner.address, seller.address, 0);

    // Buyer ottiene 1000 NAO
    await naoToken.transfer(buyer.address, ethers.parseEther("1000"));

    // Seller lista NFT a 100 NAO
    await nft.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listItem(await nft.getAddress(), 0, PRICE);
  });

  it("Distribuisce correttamente royalty (5%), fee (2.5%) e netto al seller (92.5%)", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();

    const ownerBalBefore  = await naoToken.balanceOf(owner.address);
    const sellerBalBefore = await naoToken.balanceOf(seller.address);

    await naoToken.connect(buyer).approve(mktAddr, PRICE);
    await marketplace.connect(buyer).buyItem(nftAddr, 0);

    // Verifica nuovo proprietario NFT
    expect(await nft.ownerOf(0)).to.equal(buyer.address);

    const ownerBalAfter  = await naoToken.balanceOf(owner.address);
    const sellerBalAfter = await naoToken.balanceOf(seller.address);
    const mktAccFees     = await marketplace.accumulatedFees();

    // Royalty = 5% di 100 = 5 NAO
    expect(ownerBalAfter - ownerBalBefore).to.equal(ethers.parseEther("5"));
    // Fee marketplace = 2.5% di 100 = 2.5 NAO
    expect(mktAccFees).to.equal(ethers.parseEther("2.5"));
    // Seller netto = 100 - 5 - 2.5 = 92.5 NAO
    expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("92.5"));
  });

  it("getPaymentBreakdown restituisce i valori corretti", async function () {
    const nftAddr = await nft.getAddress();
    const [royalty, fee, sellerNet] = await marketplace.getPaymentBreakdown(nftAddr, 0);
    expect(royalty).to.equal(ethers.parseEther("5"));      // 5%
    expect(fee).to.equal(ethers.parseEther("2.5"));        // 2.5%
    expect(sellerNet).to.equal(ethers.parseEther("92.5")); // 92.5%
  });

  it("Listing viene rimosso dopo il buy", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await naoToken.connect(buyer).approve(mktAddr, PRICE);
    await marketplace.connect(buyer).buyItem(nftAddr, 0);
    const [, , active] = await marketplace.getListing(nftAddr, 0);
    expect(active).to.be.false;
  });

  it("Il seller non può comprare il proprio NFT", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await naoToken.transfer(seller.address, PRICE);
    await naoToken.connect(seller).approve(mktAddr, PRICE);
    await expect(
      marketplace.connect(seller).buyItem(nftAddr, 0)
    ).to.be.revertedWith("Seller cannot buy own NFT");
  });

  it("buyItem reverta se il seller ha trasferito l'NFT fuori prima della vendita", async function () {
    const nftAddr  = await nft.getAddress();
    const mktAddr  = await marketplace.getAddress();
    const [, other] = (await ethers.getSigners()).slice(3);

    // Seller trasferisce l'NFT a qualcun altro senza cancellare il listing
    await nft.connect(seller).transferFrom(seller.address, other.address, 0);

    await naoToken.connect(buyer).approve(mktAddr, PRICE);
    await expect(
      marketplace.connect(buyer).buyItem(nftAddr, 0)
    ).to.be.revertedWith("Seller no longer owns NFT");
  });

  it("buyItem reverta se il buyer non ha abbastanza NAO approvati", async function () {
    const nftAddr = await nft.getAddress();
    await naoToken.connect(buyer).approve(await marketplace.getAddress(), ethers.parseEther("1"));
    await expect(
      marketplace.connect(buyer).buyItem(nftAddr, 0)
    ).to.be.reverted;
  });

  it("Owner può prelevare le fee accumulate", async function () {
    const nftAddr = await nft.getAddress();
    const mktAddr = await marketplace.getAddress();
    await naoToken.connect(buyer).approve(mktAddr, PRICE);
    await marketplace.connect(buyer).buyItem(nftAddr, 0);

    const ownerBalBefore = await naoToken.balanceOf(owner.address);
    await marketplace.connect(owner).withdrawFees(owner.address);
    const ownerBalAfter = await naoToken.balanceOf(owner.address);

    // Deve aver ricevuto 2.5 NAO di fee (oltre alle royalties già ricevute come creator)
    // ownerBalBefore già include le 5 NAO royalty ricevute
    expect(ownerBalAfter - ownerBalBefore).to.equal(ethers.parseEther("2.5"));
    expect(await marketplace.accumulatedFees()).to.equal(0);
  });

  it("withdrawFees reverta se non ci sono fee", async function () {
    await expect(
      marketplace.connect(owner).withdrawFees(owner.address)
    ).to.be.revertedWith("No fees to withdraw");
  });

  it("Non-owner non può fare withdrawFees", async function () {
    await expect(
      marketplace.connect(seller).withdrawFees(seller.address)
    ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
  });
});

// ============================================================
// Suite: Marketplace — NFT senza ERC2981 (nessuna royalty)
// ============================================================
describe("Marketplace — NFT senza ERC2981", function () {
  let marketplace, naoToken, simpleNft;
  let owner, seller, buyer;
  const PRICE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();

    // Deploy token e marketplace
    const MockERC20 = await ethers.getContractFactory("NAOTOKENERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(await naoToken.getAddress(), 250);

    // Deploy di un ERC721 minimale SENZA ERC2981
    const SimpleNFT = await ethers.getContractFactory("SimpleNFTNoRoyalty");
    simpleNft = await SimpleNFT.deploy();

    // Minta NFT #0 al seller
    await simpleNft.connect(owner).mint(seller.address, "ipfs://simple/0");

    // Distribuisci NAO al buyer
    await naoToken.transfer(buyer.address, ethers.parseEther("1000"));

    // Seller lista
    await simpleNft.connect(seller).approve(await marketplace.getAddress(), 0);
    await marketplace.connect(seller).listItem(await simpleNft.getAddress(), 0, PRICE);
  });

  it("Buy funziona senza royalties: fee va al marketplace, resto al seller", async function () {
    const nftAddr = await simpleNft.getAddress();
    const mktAddr = await marketplace.getAddress();

    const sellerBalBefore = await naoToken.balanceOf(seller.address);

    await naoToken.connect(buyer).approve(mktAddr, PRICE);
    await marketplace.connect(buyer).buyItem(nftAddr, 0);

    expect(await simpleNft.ownerOf(0)).to.equal(buyer.address);

    const sellerBalAfter = await naoToken.balanceOf(seller.address);
    const mktFees = await marketplace.accumulatedFees();

    // Royalty = 0, fee = 2.5% = 2.5 NAO
    expect(mktFees).to.equal(ethers.parseEther("2.5"));
    // Seller netto = 100 - 2.5 = 97.5 NAO
    expect(sellerBalAfter - sellerBalBefore).to.equal(ethers.parseEther("97.5"));
  });

  it("getPaymentBreakdown mostra royalty = 0 per NFT senza ERC2981", async function () {
    const nftAddr = await simpleNft.getAddress();
    const [royalty, fee, sellerNet] = await marketplace.getPaymentBreakdown(nftAddr, 0);
    expect(royalty).to.equal(0);
    expect(fee).to.equal(ethers.parseEther("2.5"));
    expect(sellerNet).to.equal(ethers.parseEther("97.5"));
  });
});
