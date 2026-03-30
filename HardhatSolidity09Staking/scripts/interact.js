const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [user1] = await ethers.getSigners();
  console.log("Interacting with contracts using the account:", user1.address);

  // Address of the deployed contracts (replace if needed or load from a json, here we assume manual update or standard deployment)
  // For the sake of the script, we can deploy them on the fly if not on localhost, but typically you'd run this against localhost

  // Here we are simply putting placeholders or requiring the user to edit the addresses
  const tokenAddress = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; // Example localhost address
  const stakingAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; // Example localhost address

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
