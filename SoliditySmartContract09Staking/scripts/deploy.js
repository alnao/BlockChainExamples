const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Staking Token (NAO)
  const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
  const naoToken = await MockERC20.deploy("NAO Token", "NAO");
  await naoToken.waitForDeployment();
  console.log("NAO Token deployed to:", await naoToken.getAddress());

  // 2. Deploy Staking Contract (Uses NAO for both Staking and Rewards)
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(await naoToken.getAddress(), await naoToken.getAddress());
  await staking.waitForDeployment();
  console.log("Staking Contract deployed to:", await staking.getAddress());

  // 3. Setup iniziale
  // Finanzia il contratto di staking con NAO Tokens per le ricompense
  const rewardAmount = ethers.parseEther("1000");
  await naoToken.approve(await staking.getAddress(), rewardAmount);
  await staking.depositRewards(rewardAmount);
  console.log("Deposited 1000 NAO into Staking contract for rewards");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
