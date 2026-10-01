const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

async function main() {
  const [deployer, voter1] = await ethers.getSigners();
  console.log("=== DAO Governance Interactive Simulation ===");

  // 1. Deploy Governance Token
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const token = await GovernanceToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("1. Governance Token deployed to:", tokenAddress);

  // Delegate votes
  await token.delegate(deployer.address);
  await token.transfer(voter1.address, ethers.parseEther("5000"));
  await token.connect(voter1).delegate(voter1.address);
  console.log("   Delegated voting power to Deployer and Voter1");

  // 2. Deploy Timelock
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const timelock = await TimeLock.deploy(0, [], [], deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("2. Timelock deployed to:", timelockAddress);

  // 3. Deploy Governor
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("3. Governor deployed to:", governorAddress);

  // 4. Setup Roles
  const proposerRole = await timelock.PROPOSER_ROLE();
  const cancellerRole = await timelock.CANCELLER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.DEFAULT_ADMIN_ROLE();
  await timelock.grantRole(proposerRole, governorAddress);
  await timelock.grantRole(cancellerRole, governorAddress);
  await timelock.grantRole(executorRole, ethers.ZeroAddress);
  await timelock.revokeRole(adminRole, deployer.address);

  // 5. Deploy Box
  const Box = await ethers.getContractFactory("Box");
  const box = await Box.deploy();
  await box.waitForDeployment();
  const boxAddress = await box.getAddress();
  await box.transferOwnership(timelockAddress);
  console.log("4. Box deployed to:", boxAddress, "(Ownership -> Timelock)");
  console.log("   Initial Box value:", (await box.retrieve()).toString());

  // 6. Propose
  const targetValue = 99;
  const proposalDescription = "Update Box value to 99";
  const encodedFunction = box.interface.encodeFunctionData("store", [targetValue]);
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));

  console.log("\n--- Step 1: Submitting Proposal ---");
  await governor.propose([boxAddress], [0], [encodedFunction], proposalDescription);

  const proposalId = await governor.hashProposal([boxAddress], [0], [encodedFunction], descriptionHash);
  console.log("Proposal ID:", proposalId.toString());
  console.log("State (0=Pending):", (await governor.state(proposalId)).toString());

  // Wait for voting delay
  await mine(2);
  console.log("State after delay (1=Active):", (await governor.state(proposalId)).toString());

  // 7. Vote
  console.log("\n--- Step 2: Casting Votes ---");
  await governor.castVote(proposalId, 1); // 1 = For
  await governor.connect(voter1).castVote(proposalId, 1);
  console.log("Votes cast successfully (FOR)");

  // Wait for voting period (5 blocks)
  await mine(6);
  console.log("State after voting period (4=Succeeded):", (await governor.state(proposalId)).toString());

  // 8. Queue
  console.log("\n--- Step 3: Queueing Proposal ---");
  await governor.queue([boxAddress], [0], [encodedFunction], descriptionHash);
  console.log("State (5=Queued):", (await governor.state(proposalId)).toString());

  // 9. Execute
  console.log("\n--- Step 4: Executing Proposal ---");
  await governor.execute([boxAddress], [0], [encodedFunction], descriptionHash);
  console.log("State (7=Executed):", (await governor.state(proposalId)).toString());

  console.log("\nFinal Box Value in contract:", (await box.retrieve()).toString());
  console.log("=== DAO Simulation completed successfully ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
