const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Governance Token
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const token = await GovernanceToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("GovernanceToken deployed to:", tokenAddress);

  // Delegate votes to self to activate them
  await token.delegate(deployer.address);
  console.log("Delegated votes to deployer");

  // 2. Deploy Timelock
  // Min delay 0 for testing, proposers/executors empty initially
  const minDelay = 0; 
  const TimeLock = await ethers.getContractFactory("TimeLock");
  const timelock = await TimeLock.deploy(minDelay, [], [], deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("TimeLock deployed to:", timelockAddress);

  // 3. Deploy Governor
  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.deploy(tokenAddress, timelockAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("Governor deployed to:", governorAddress);

  // 4. Setup Roles
  // Timelock roles: Proposer = Governor, Executor = Anyone (address(0))
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.DEFAULT_ADMIN_ROLE();

  await timelock.grantRole(proposerRole, governorAddress);
  await timelock.grantRole(executorRole, ethers.ZeroAddress);
  await timelock.revokeRole(adminRole, deployer.address); // Revoke admin from deployer
  console.log("Timelock roles setup complete");

  // 5. Deploy Target Contract (Box)
  const Box = await ethers.getContractFactory("Box");
  const box = await Box.deploy();
  await box.waitForDeployment();
  const boxAddress = await box.getAddress();
  console.log("Box deployed to:", boxAddress);

  // Transfer ownership of Box to Timelock
  await box.transferOwnership(timelockAddress);
  console.log("Box ownership transferred to Timelock");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
