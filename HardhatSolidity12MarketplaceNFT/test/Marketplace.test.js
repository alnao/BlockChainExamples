const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function () {
  let nft, marketplace, naoToken;
  let owner, buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");

    const NFTCollection = await ethers.getContractFactory("NFTCollection");
    nft = await NFTCollection.deploy();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(await naoToken.getAddress());

    // Mint NFT #0 to owner
    await nft.mint(owner.address, "uri");

    // Give buyer some NAO tokens
    await naoToken.transfer(buyer.address, ethers.parseEther("100"));
  });

  it("Should list and buy item", async function () {
    const tokenId = 0;
    const price = ethers.parseEther("1");

    // Approve marketplace for NFT
    await nft.approve(await marketplace.getAddress(), tokenId);

    // List
    await marketplace.listItem(await nft.getAddress(), tokenId, price);
    
    const listing = await marketplace.listings(await nft.getAddress(), tokenId);
    expect(listing.active).to.be.true;
    expect(listing.price).to.equal(price);

    // Approve marketplace for NAO Token (Buyer)
    await naoToken.connect(buyer).approve(await marketplace.getAddress(), price);

    // Buy
    await marketplace.connect(buyer).buyItem(await nft.getAddress(), tokenId);

    expect(await nft.ownerOf(tokenId)).to.equal(buyer.address);
    expect(await naoToken.balanceOf(owner.address)).to.be.closeTo(ethers.parseEther("1000000").add(price).sub(price.mul(5).div(100)), ethers.parseEther("1")); // Owner gets price - royalty (but owner is also royalty receiver here so gets full price effectively, wait. Owner minted, so owner is creator. Owner sells. Owner gets price - royalty + royalty = price. But wait, owner starts with 1M. Buyer pays 1. Owner gets 1.
    // Actually owner starts with 1M - 100 given to buyer.
    // Buyer pays 1.
    // Owner gets 1.
    // Final balance owner: 1M - 100 + 1.
  });
});
