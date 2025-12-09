const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery", function () {
  let lottery, vrfCoordinator, naoToken;
  let owner, player1, player2;
  let subId;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy Mock VRF
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinator = await VRFCoordinatorV2Mock.deploy(ethers.parseEther("0.25"), 1e9);
    
    // Create Sub
    const tx = await vrfCoordinator.createSubscription();
    const receipt = await tx.wait();
    subId = 1;
    await vrfCoordinator.fundSubscription(subId, ethers.parseEther("10"));

    // Deploy NAO Token
    const MockERC20 = await ethers.getContractFactory("NAO-TOKEN-ERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");

    // Deploy Lottery
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(
        subId, 
        await vrfCoordinator.getAddress(), 
        "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        ethers.parseEther("0.1"),
        await naoToken.getAddress()
    );

    // Add Consumer
    await vrfCoordinator.addConsumer(subId, await lottery.getAddress());

    // Distribute tokens
    await naoToken.transfer(player1.address, ethers.parseEther("10"));
    await naoToken.transfer(player2.address, ethers.parseEther("10"));
  });

  it("Should allow players to enter", async function () {
    await naoToken.connect(player1).approve(await lottery.getAddress(), ethers.parseEther("0.1"));
    await lottery.connect(player1).enter();
    expect(await lottery.players(0)).to.equal(player1.address);
  });

  it("Should pick a winner", async function () {
    await naoToken.connect(player1).approve(await lottery.getAddress(), ethers.parseEther("0.1"));
    await lottery.connect(player1).enter();
    
    await naoToken.connect(player2).approve(await lottery.getAddress(), ethers.parseEther("0.1"));
    await lottery.connect(player2).enter();

    // Request random words
    const tx = await lottery.pickWinner();
    const receipt = await tx.wait();
    
    // Find RequestId from logs (Mock specific)
    // In real test we parse logs, here we assume requestId 1
    const requestId = 1;

    // Fulfill random words (Simulate Chainlink Node)
    await expect(
        vrfCoordinator.fulfillRandomWords(requestId, await lottery.getAddress())
    ).to.emit(lottery, "WinnerPicked");
  });
});
