const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Token A (NAO)
  const MockToken = await ethers.getContractFactory("NAO-TOKEN-ERC20");
  const tokenA = await MockToken.deploy("NAO Token", "NAO");
  await tokenA.waitForDeployment();
  console.log("NAO Token deployed to:", await tokenA.getAddress());

  // 2. Deploy DEX (NAO + ETH)
  const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await SimpleDEX.deploy(await tokenA.getAddress());
  await dex.waitForDeployment();
  console.log("SimpleDEX deployed to:", await dex.getAddress());

  // 3. Setup iniziale (opzionale)
  // Aggiungi liquidità iniziale
  const amountA = ethers.parseEther("100");
  const amountETH = ethers.parseEther("1"); // 1 ETH

  await tokenA.approve(await dex.getAddress(), amountA);

  await dex.addLiquidity(amountA, { value: amountETH });
  console.log("Initial liquidity added: 100 NAO + 1 ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
