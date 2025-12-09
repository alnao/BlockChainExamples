const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy NAO Token
  const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
  const naoToken = await MockERC20.deploy("NAO Token", "NAO");
  await naoToken.waitForDeployment();
  console.log("NAO Token deployed to:", await naoToken.getAddress());

  // 2. Deploy NFT Collection
  const NFTCollection = await ethers.getContractFactory("NFTCollection");
  const nft = await NFTCollection.deploy();
  await nft.waitForDeployment();
  console.log("NFTCollection deployed to:", await nft.getAddress());

  // 3. Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(await naoToken.getAddress());
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  // 4. Mint an NFT
  await nft.mint(deployer.address, "ipfs://example-uri");
  console.log("Minted NFT #0");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
