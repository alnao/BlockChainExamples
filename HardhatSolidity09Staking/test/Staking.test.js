const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Staking Contract", function () {
  let staking, naoToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Token (NAO)
    const MockERC20 = await ethers.getContractFactory("NAOTOKENERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");

    // Deploy Staking (NAO for both)
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(await naoToken.getAddress(), await naoToken.getAddress());

    // Setup: Finanzia il contratto con NAO per le reward (100,000 NAO)
    await naoToken.approve(await staking.getAddress(), ethers.parseEther("100000"));
    await staking.depositRewards(ethers.parseEther("100000"));

    // Setup: Dai token di staking a user1 e user2
    await naoToken.transfer(user1.address, ethers.parseEther("100"));
    await naoToken.connect(user1).approve(await staking.getAddress(), ethers.parseEther("100"));

    await naoToken.transfer(user2.address, ethers.parseEther("100"));
    await naoToken.connect(user2).approve(await staking.getAddress(), ethers.parseEther("100"));
  });

  it("Should allow staking tokens", async function () {
    await staking.connect(user1).stake(ethers.parseEther("10"));
    expect(await staking.stakedBalance(user1.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should calculate rewards correctly over time (0.01 per second per token)", async function () {
    // 10 NAO in stake for 10 seconds -> 10 * 10 * 0.01 = 1 NAO reward
    await staking.connect(user1).stake(ethers.parseEther("10"));

    await time.increase(10);

    const reward = await staking.calculateReward(user1.address);
    // Tolleranza di 1 secondo dovuto al blocco di transazione
    expect(reward).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.1"));
  });

  it("Should allow claiming rewards", async function () {
    await staking.connect(user1).stake(ethers.parseEther("50"));
    await time.increase(10);

    const balanceBefore = await naoToken.balanceOf(user1.address);
    await staking.connect(user1).claimReward();
    const balanceAfter = await naoToken.balanceOf(user1.address);

    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should allow withdraw of staked tokens", async function () {
    const stakeAmount = ethers.parseEther("10");
    await staking.connect(user1).stake(stakeAmount);

    await staking.connect(user1).withdraw(stakeAmount);
    expect(await staking.stakedBalance(user1.address)).to.equal(0);
    expect(await naoToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should allow emergency withdraw", async function () {
    await staking.connect(user1).stake(ethers.parseEther("20"));
    expect(await staking.stakedBalance(user1.address)).to.equal(ethers.parseEther("20"));

    await staking.connect(user1).emergencyWithdraw();
    expect(await staking.stakedBalance(user1.address)).to.equal(0);
    expect(await naoToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
  });

  it("Should allow owner to change reward rate", async function () {
    const newRate = ethers.parseEther("0.05"); // 0.05 NAO per secondo per token
    await staking.setRewardRate(newRate);
    expect(await staking.rewardRate()).to.equal(newRate);
  });
});

