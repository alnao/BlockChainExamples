const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DAO Governance Flow", function () {
  let token, timelock, governor, box;
  let owner, voter1, voter2, nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, nonVoter] = await ethers.getSigners();

    // 1. Deploy Token
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    token = await GovernanceToken.deploy();
    await token.delegate(owner.address); // Delegate voting power to self

    // Transfer some tokens to voter1 and voter2 and delegate
    await token.transfer(voter1.address, ethers.parseEther("1000"));
    await token.connect(voter1).delegate(voter1.address);

    await token.transfer(voter2.address, ethers.parseEther("500"));
    await token.connect(voter2).delegate(voter2.address);

    // 2. Deploy Timelock (0 delay for testing)
    const TimeLock = await ethers.getContractFactory("TimeLock");
    timelock = await TimeLock.deploy(0, [], [], owner.address);

    // 3. Deploy Governor
    const MyGovernor = await ethers.getContractFactory("MyGovernor");
    governor = await MyGovernor.deploy(await token.getAddress(), await timelock.getAddress());

    // 4. Setup Roles (Proposer, Canceller, Executor)
    const proposerRole = await timelock.PROPOSER_ROLE();
    const cancellerRole = await timelock.CANCELLER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    const adminRole = await timelock.DEFAULT_ADMIN_ROLE();

    await timelock.grantRole(proposerRole, await governor.getAddress());
    await timelock.grantRole(cancellerRole, await governor.getAddress());
    await timelock.grantRole(executorRole, ethers.ZeroAddress);
    await timelock.revokeRole(adminRole, owner.address);

    // 5. Deploy Box & Transfer Ownership to Timelock
    const Box = await ethers.getContractFactory("Box");
    box = await Box.deploy();
    await box.transferOwnership(await timelock.getAddress());
  });

  it("Should execute a proposal to change Box value from 0 to 42 (Happy Path)", async function () {
    expect(await box.retrieve()).to.equal(0);

    const proposalDescription = "Store 42 in Box";
    const valueToStore = 42;

    const encodedFunction = box.interface.encodeFunctionData("store", [valueToStore]);
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));

    // 1. Propose
    await governor.propose(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      proposalDescription
    );

    const proposalIdReal = await governor.hashProposal(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );

    expect(await governor.state(proposalIdReal)).to.equal(0); // 0 = Pending

    // Wait for voting delay (1 block)
    await mine(2);
    expect(await governor.state(proposalIdReal)).to.equal(1); // 1 = Active

    // 2. Vote (1 = For)
    await governor.castVote(proposalIdReal, 1);
    await governor.connect(voter1).castVote(proposalIdReal, 1);

    // Wait for voting period (5 blocks)
    await mine(6);
    expect(await governor.state(proposalIdReal)).to.equal(4); // 4 = Succeeded

    // 3. Queue
    await governor.queue(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );
    expect(await governor.state(proposalIdReal)).to.equal(5); // 5 = Queued

    // 4. Execute
    await governor.execute(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );
    expect(await governor.state(proposalIdReal)).to.equal(7); // 7 = Executed

    // Verify target contract state was updated
    expect(await box.retrieve()).to.equal(42);
  });

  it("Should prevent direct non-timelock calls to Box.store", async function () {
    await expect(box.connect(owner).store(123)).to.be.revertedWithCustomError(
      box,
      "OwnableUnauthorizedAccount"
    );
    await expect(box.connect(voter1).store(123)).to.be.revertedWithCustomError(
      box,
      "OwnableUnauthorizedAccount"
    );
  });

  it("Should mark proposal as Defeated if Against votes exceed For votes", async function () {
    const proposalDescription = "Change Box value to 88";
    const encodedFunction = box.interface.encodeFunctionData("store", [88]);
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));

    await governor.propose(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      proposalDescription
    );
    const proposalId = await governor.hashProposal(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );

    await mine(2); // Wait for voting delay

    // Voter1 votes For (1000 tokens), Owner votes Against (>990,000 tokens)
    await governor.connect(voter1).castVote(proposalId, 1); // 1 = For
    await governor.connect(owner).castVote(proposalId, 0);  // 0 = Against

    await mine(6); // Wait for voting period

    // 3 = Defeated
    expect(await governor.state(proposalId)).to.equal(3);

    // Should not allow queueing a defeated proposal
    await expect(
      governor.queue([await box.getAddress()], [0], [encodedFunction], descriptionHash)
    ).to.be.reverted;
  });

  it("Should mark proposal as Defeated if Quorum is not reached", async function () {
    const proposalDescription = "Change Box value without quorum";
    const encodedFunction = box.interface.encodeFunctionData("store", [100]);
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));

    await governor.connect(voter2).propose(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      proposalDescription
    );
    const proposalId = await governor.hashProposal(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );

    await mine(2);

    // Voter2 has only 500 tokens (Quorum is 4% of 1,000,000 = 40,000 tokens)
    await governor.connect(voter2).castVote(proposalId, 1);

    await mine(6);

    // State should be 3 = Defeated due to quorum failure
    expect(await governor.state(proposalId)).to.equal(3);
  });

  it("Should allow the proposer to cancel a proposal during Pending state", async function () {
    const proposalDescription = "Proposal to cancel during Pending";
    const encodedFunction = box.interface.encodeFunctionData("store", [777]);
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(proposalDescription));

    await governor.propose(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      proposalDescription
    );
    const proposalId = await governor.hashProposal(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );

    expect(await governor.state(proposalId)).to.equal(0); // 0 = Pending

    // Proposer cancels proposal
    await governor.cancel(
      [await box.getAddress()],
      [0],
      [encodedFunction],
      descriptionHash
    );

    expect(await governor.state(proposalId)).to.equal(2); // 2 = Canceled
  });

  it("Should have granted CANCELLER_ROLE and PROPOSER_ROLE to Governor on Timelock", async function () {
    const cancellerRole = await timelock.CANCELLER_ROLE();
    const proposerRole = await timelock.PROPOSER_ROLE();
    const governorAddress = await governor.getAddress();

    expect(await timelock.hasRole(cancellerRole, governorAddress)).to.be.true;
    expect(await timelock.hasRole(proposerRole, governorAddress)).to.be.true;
  });
});
