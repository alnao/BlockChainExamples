const hre = require("hardhat");
const { saveDeployedAddresses } = require("./addresses");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Deploy ERC20Mock first
  const MockToken = await hre.ethers.getContractFactory("ERC20Mock");
  const mockToken = await MockToken.deploy("Test Token", "TEST", deployer.address, hre.ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  
  const tokenAddress = await mockToken.getAddress();
  console.log("MockToken deployed to:", tokenAddress);
  
  // Deploy GuessTheNumberMulti with the token address and fees
  const GuessTheNumber = await hre.ethers.getContractFactory("GuessTheNumberMulti");
  const setFee = hre.ethers.parseEther("10"); // 10 token per avviare partita
  const guessFee = hre.ethers.parseEther("1"); // 1 token per guess
  const guessTheNumber = await GuessTheNumber.deploy(tokenAddress, setFee, guessFee);
  await guessTheNumber.waitForDeployment();
  
  const gameAddress = await guessTheNumber.getAddress();
  console.log("GuessTheNumberMulti deployed to:", gameAddress);
  
  // Salva gli indirizzi in un file JSON
  saveDeployedAddresses(tokenAddress, gameAddress);
  
  console.log("\nDeployment completed!");
  console.log("Token address:", tokenAddress);
  console.log("Game address:", gameAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
