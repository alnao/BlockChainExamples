const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Staking Contract", function () {
  let staking, naoToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Token (NAO)
    const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");

    // Deploy Staking (NAO for both)
    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(await naoToken.getAddress(), await naoToken.getAddress());

    // Setup: Finanzia il contratto con NAO per le reward
    await naoToken.approve(await staking.getAddress(), ethers.parseEther("10000"));
    await staking.depositRewards(ethers.parseEther("10000"));

    // Setup: Dai token di staking a user1
    await naoToken.transfer(user1.address, ethers.parseEther("100"));
    await naoToken.connect(user1).approve(await staking.getAddress(), ethers.parseEther("100"));
  });

  it("Should allow staking", async function () {
    await staking.connect(user1).stake(ethers.parseEther("10"));
    expect(await staking.stakedBalance(user1.address)).to.equal(ethers.parseEther("10"));
  });

  it("Should calculate rewards correctly over time", async function () {
    const stakeAmount = ethers.parseUnits("10", 0); 

    // Trasferiamo token minimi per evitare problemi di decimali nel test semplice
    await naoToken.transfer(user2.address, 100);
    await naoToken.connect(user2).approve(await staking.getAddress(), 100);

    await staking.connect(user2).stake(stakeAmount);

    // Avanza il tempo di 10 secondi
    await time.increase(10);

    const reward = await staking.calculateReward(user2.address);
    expect(reward).to.be.closeTo(100, 2000); 
  });

  it("Should allow claiming rewards", async function () {
    const stakeAmount = ethers.parseUnits("100", 0);
    await naoToken.transfer(user2.address, 1000);
    await naoToken.connect(user2).approve(await staking.getAddress(), 1000);

    await staking.connect(user2).stake(stakeAmount);
    
    await time.increase(10); 

    const balanceBefore = await naoToken.balanceOf(user2.address);
    await staking.connect(user2).claimReward();
    const balanceAfter = await naoToken.balanceOf(user2.address);
    
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should allow withdraw", async function () {
    const stakeAmount = ethers.parseEther("10");
    await staking.connect(user1).stake(stakeAmount);
    
    await staking.connect(user1).withdraw(stakeAmount);
    expect(await staking.stakedBalance(user1.address)).to.equal(0);
    expect(await naoToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
  });
});
