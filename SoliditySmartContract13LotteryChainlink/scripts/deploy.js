const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Mock VRF Coordinator (Localhost only)
  const baseFee = ethers.parseEther("0.25"); // 0.25 LINK
  const gasPriceLink = 1e9; // 1 gwei
  
  const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfCoordinator = await VRFCoordinatorV2Mock.deploy(baseFee, gasPriceLink);
  await vrfCoordinator.waitForDeployment();
  const vrfAddress = await vrfCoordinator.getAddress();
  console.log("Mock VRF Coordinator deployed to:", vrfAddress);

  // 2. Create Subscription
  const tx = await vrfCoordinator.createSubscription();
  const receipt = await tx.wait();
  // In mock, subscription ID is usually 1
  const subId = 1; 
  await vrfCoordinator.fundSubscription(subId, ethers.parseEther("10"));

  // 3. Deploy NAO Token
  const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
  const naoToken = await MockERC20.deploy("NAO Token", "NAO");
  await naoToken.waitForDeployment();
  console.log("NAO Token deployed to:", await naoToken.getAddress());

  // 4. Deploy Lottery
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc"; // Random hash for mock
  const entryFee = ethers.parseEther("0.1");

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(subId, vrfAddress, keyHash, entryFee, await naoToken.getAddress());
  await lottery.waitForDeployment();
  console.log("Lottery deployed to:", await lottery.getAddress());

  // 5. Add Consumer
  await vrfCoordinator.addConsumer(subId, await lottery.getAddress());
  console.log("Lottery added to VRF subscription");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
