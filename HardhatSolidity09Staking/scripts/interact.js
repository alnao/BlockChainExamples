const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [user1] = await ethers.getSigners();
  console.log("Interacting with contracts using the account:", user1.address);

  // Carica gli indirizzi esportati da scripts/deploy.js in client/src/contracts/config.js
  const configPath = path.join(__dirname, "..", "client", "src", "contracts", "config.js");
  if (!fs.existsSync(configPath)) {
    throw new Error("config.js non trovato: esegui prima `npx hardhat run scripts/deploy.js --network localhost`");
  }
  const configContent = fs.readFileSync(configPath, "utf8");
  const tokenAddress = configContent.match(/TOKEN_ADDRESS = "(0x[0-9a-fA-F]{40})"/)[1];
  const stakingAddress = configContent.match(/STAKING_ADDRESS = "(0x[0-9a-fA-F]{40})"/)[1];
  console.log("Token address:", tokenAddress);
  console.log("Staking address:", stakingAddress);

  // Verifica che i contratti siano effettivamente deployati (una tx verso un indirizzo vuoto "riesce" ma non fa nulla)
  for (const [name, addr] of [["Token", tokenAddress], ["Staking", stakingAddress]]) {
    if ((await ethers.provider.getCode(addr)) === "0x") {
      throw new Error(`${name} non deployato all'indirizzo ${addr}: riavvia il nodo e riesegui deploy.js`);
    }
  }

  const naoToken = await ethers.getContractAt("NAOTOKENERC20", tokenAddress);
  const staking = await ethers.getContractAt("Staking", stakingAddress);

  console.log("Approving tokens for staking...");
  const stakeAmount = ethers.parseEther("10"); // 10 NAO
  // Approve Staking contract to spend NAO
  let tx = await naoToken.approve(stakingAddress, stakeAmount);
  await tx.wait();
  console.log("Approval successful.");

  console.log("Staking 10 NAO tokens...");
  tx = await staking.stake(stakeAmount);
  await tx.wait();
  console.log("Stake successful.");

  console.log("Waiting 10 seconds to accumulate rewards...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // In a real blockchain, time passes with blocks. On a local testnet we might need to mine a block manually.
  // We can force a block mining on hardhat network.
  await ethers.provider.send("evm_mine", []);

  const earned = await staking.calculateReward(user1.address);
  console.log(`Current rewards earned: ${ethers.formatEther(earned)}`);

  console.log("Claiming rewards...");
  tx = await staking.claimReward();
  await tx.wait();
  console.log("Rewards claimed.");

  console.log("Unstaking...");
  tx = await staking.withdraw(stakeAmount);
  await tx.wait();
  console.log("Unstake successful.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
