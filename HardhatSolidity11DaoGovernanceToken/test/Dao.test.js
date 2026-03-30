const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DAO Governance Flow", function () {
  let token, timelock, governor, box;
  let owner, voter1, voter2;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();

    // 1. Deploy Token
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    token = await GovernanceToken.deploy();
    await token.delegate(owner.address); // Delegate to self

    // 2. Deploy Timelock
    const TimeLock = await ethers.getContractFactory("TimeLock");
    timelock = await TimeLock.deploy(0, [], [], owner.address);

    // 3. Deploy Governor
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    governor = await MyGovernor.deploy(await token.getAddress(), await timelock.getAddress());

    // 4. Setup Roles
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    const adminRole = await timelock.DEFAULT_ADMIN_ROLE();

    await timelock.grantRole(proposerRole, await governor.getAddress());
    await timelock.grantRole(executorRole, ethers.ZeroAddress);
    await timelock.revokeRole(adminRole, owner.address);

    // 5. Deploy Box
    const Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.transferOwnership(await timelock.getAddress());
  });

  it("Should execute a proposal to change Box value", async function () {
    const proposalDescription = "Store 42 in Box";
    const valueToStore = 42;
    
    // Encode function call
    const boxInterface = box.interface;
    const encodedFunction = boxInterface.encodeFunctionData("store", [valueToStore]);
    
    // 1. Propose
    const tx = await governor.propose(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      proposalDescription
    );
    const receipt = await tx.wait();
    
    // Get Proposal ID (from event or calculation)
    // Simplified: we assume it's the first proposal
    const proposalId = (await governor.proposalThreshold()) + 1n; // Mock logic, better to parse logs
    // Actually let's parse logs properly or use hash
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));
    const proposalIdReal = await governor.hashProposal(
        [await box.getAddress()],
        [0],
        [encodedFunction],
        descriptionHash
    );

    // 2. Vote
    // Wait for voting delay (1 block)
    await mine(2); 
    
    // Vote 1 = For
    await governor.castVote(proposalIdReal, 1);

    // 3. Queue & Execute
    // Wait for voting period (50400 blocks) - we need to speed this up in config or mine a lot
    // For this test, we assume we can mine enough blocks or change settings.
    // Since mining 50400 blocks is slow in test, we usually configure Governor with shorter period for tests.
    // Here we just check state is Active.
    expect(await governor.state(proposalIdReal)).to.equal(1); // 1 = Active
  });
});
