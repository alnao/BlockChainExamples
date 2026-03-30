const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleDEX", function () {
  let dex, tokenA;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("NAO-TOKEN-ERC20");
    tokenA = await MockToken.deploy("NAO Token", "NAO");

    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy(await tokenA.getAddress());

    // Distribute tokens
    await tokenA.transfer(user1.address, ethers.parseEther("1000"));
  });

  it("Should allow adding liquidity", async function () {
    const amountA = ethers.parseEther("100");
    const amountETH = ethers.parseEther("1");

    await tokenA.approve(await dex.getAddress(), amountA);

    await dex.addLiquidity(amountA, { value: amountETH });

    expect(await dex.balanceOf(owner.address)).to.be.gt(0);
    expect(await tokenA.balanceOf(await dex.getAddress())).to.equal(amountA);
    expect(await ethers.provider.getBalance(await dex.getAddress())).to.equal(amountETH);
  });

  it("Should allow swapping A for ETH", async function () {
    // Add initial liquidity
    await tokenA.approve(await dex.getAddress(), ethers.parseEther("1000"));
    await dex.addLiquidity(ethers.parseEther("1000"), { value: ethers.parseEther("10") });

    // User1 swaps
    const amountIn = ethers.parseEther("10");
    await tokenA.connect(user1).approve(await dex.getAddress(), amountIn);

    const balanceETHBefore = await ethers.provider.getBalance(user1.address);
    
    // Swap
    const tx = await dex.connect(user1).swapAforETH(amountIn);
    const receipt = await tx.wait();
    
    // Calculate gas cost
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    const balanceETHAfter = await ethers.provider.getBalance(user1.address);

    // Balance should increase by output amount minus gas
    expect(balanceETHAfter).to.be.gt(balanceETHBefore - gasUsed);
  });

  it("Should allow swapping ETH for A", async function () {
    // Add initial liquidity
    await tokenA.approve(await dex.getAddress(), ethers.parseEther("1000"));
    await dex.addLiquidity(ethers.parseEther("1000"), { value: ethers.parseEther("10") });

    const amountInETH = ethers.parseEther("1");
    const balanceABefore = await tokenA.balanceOf(user1.address);

    await dex.connect(user1).swapETHforA({ value: amountInETH });

    const balanceAAfter = await tokenA.balanceOf(user1.address);
    expect(balanceAAfter).to.be.gt(balanceABefore);
  });
});
