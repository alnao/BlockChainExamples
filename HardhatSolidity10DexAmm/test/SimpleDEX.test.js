const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, setBalance } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const DEAD = "0x000000000000000000000000000000000000dEaD";
const MINIMUM_LIQUIDITY = 1000n;

// Stessa formula del contratto: fee 0.3%
function getAmountOut(amountIn, reserveIn, reserveOut) {
  const amountInWithFee = amountIn * 997n;
  return (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
}

function sqrt(value) {
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}

describe("SimpleDEX", function () {
  let dex, tokenA, dexAddress, tokenAddress;
  let owner, user1, user2;

  async function deadline() {
    return (await time.latest()) + 600;
  }

  async function addLiquidity(signer, amountA, amountETH) {
    await tokenA.connect(signer).approve(dexAddress, amountA);
    return dex.connect(signer).addLiquidity(amountA, 0, 0, await deadline(), { value: amountETH });
  }

  // Pool standard: 1000 NAO + 10 ETH (prezzo 1 ETH = 100 NAO)
  async function seedPool() {
    await addLiquidity(owner, ethers.parseEther("1000"), ethers.parseEther("10"));
  }

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const NaoToken = await ethers.getContractFactory("NAOTOKENERC20");
    tokenA = await NaoToken.deploy("NAO Token", "NAO");
    tokenAddress = await tokenA.getAddress();

    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy(tokenAddress);
    dexAddress = await dex.getAddress();

    await tokenA.transfer(user1.address, ethers.parseEther("1000"));
    await tokenA.transfer(user2.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the token and start with empty reserves", async function () {
      expect(await dex.tokenA()).to.equal(tokenAddress);
      const [rA, rETH] = await dex.getReserves();
      expect(rA).to.equal(0);
      expect(rETH).to.equal(0);
    });

    it("Should revert with zero token address", async function () {
      const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
      await expect(SimpleDEX.deploy(ethers.ZeroAddress)).to.be.revertedWith("Invalid token address");
    });
  });

  describe("addLiquidity", function () {
    it("Should mint sqrt(a*e) - MINIMUM_LIQUIDITY on first deposit and lock the minimum", async function () {
      const amountA = ethers.parseEther("100");
      const amountETH = ethers.parseEther("1");
      const expectedLP = sqrt(amountA * amountETH) - MINIMUM_LIQUIDITY;

      await expect(addLiquidity(owner, amountA, amountETH))
        .to.emit(dex, "LiquidityAdded")
        .withArgs(owner.address, amountA, amountETH, expectedLP);

      expect(await dex.balanceOf(owner.address)).to.equal(expectedLP);
      expect(await dex.balanceOf(DEAD)).to.equal(MINIMUM_LIQUIDITY);
      const [rA, rETH] = await dex.getReserves();
      expect(rA).to.equal(amountA);
      expect(rETH).to.equal(amountETH);
    });

    it("Should mint LP proportional to the existing supply on secondary deposit", async function () {
      await seedPool();
      const supplyBefore = await dex.totalSupply();
      const [rA] = await dex.getReserves();

      const amountA = ethers.parseEther("100");
      await addLiquidity(user1, amountA, ethers.parseEther("1"));

      expect(await dex.balanceOf(user1.address)).to.equal((amountA * supplyBefore) / rA);
    });

    it("Should refund excess ETH when the ratio is unbalanced", async function () {
      await seedPool();
      const amountA = ethers.parseEther("100");
      await tokenA.connect(user1).approve(dexAddress, amountA);

      // 100 NAO valgono 1 ETH: dei 2 ETH inviati, 1 deve tornare indietro
      await expect(
        dex.connect(user1).addLiquidity(amountA, 0, 0, await deadline(), { value: ethers.parseEther("2") })
      ).to.changeEtherBalances([user1, dex], [ethers.parseEther("-1"), ethers.parseEther("1")]);
    });

    it("Should pull only the needed tokens when too many NAO are offered", async function () {
      await seedPool();
      const offered = ethers.parseEther("200");
      await tokenA.connect(user1).approve(dexAddress, offered);

      await expect(
        dex.connect(user1).addLiquidity(offered, 0, 0, await deadline(), { value: ethers.parseEther("1") })
      ).to.changeTokenBalances(tokenA, [user1, dex], [ethers.parseEther("-100"), ethers.parseEther("100")]);
    });

    it("Should revert when slippage limits are not met", async function () {
      await seedPool();
      await tokenA.connect(user1).approve(dexAddress, ethers.parseEther("200"));

      // Servirebbero 100 NAO per 1 ETH, ma ne chiediamo almeno 150
      await expect(
        dex.connect(user1).addLiquidity(ethers.parseEther("200"), ethers.parseEther("150"), 0, await deadline(), {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Slippage: insufficient A amount");

      // Servirebbe 1 ETH per 100 NAO, ma ne chiediamo almeno 1.5
      await expect(
        dex.connect(user1).addLiquidity(ethers.parseEther("100"), 0, ethers.parseEther("1.5"), await deadline(), {
          value: ethers.parseEther("2")
        })
      ).to.be.revertedWith("Slippage: insufficient ETH amount");
    });

    it("Should revert with zero amounts", async function () {
      await expect(dex.addLiquidity(ethers.parseEther("1"), 0, 0, await deadline())).to.be.revertedWith("Must send ETH");
      await expect(dex.addLiquidity(0, 0, 0, await deadline(), { value: 1 })).to.be.revertedWith("Must send Token A");
    });

    it("Should revert when the first deposit does not exceed MINIMUM_LIQUIDITY", async function () {
      await tokenA.approve(dexAddress, 1000);
      await expect(dex.addLiquidity(1000, 0, 0, await deadline(), { value: 1000 })).to.be.revertedWith(
        "Insufficient liquidity minted"
      );
    });

    it("Should revert on expired deadline", async function () {
      await tokenA.approve(dexAddress, ethers.parseEther("1"));
      const expired = (await time.latest()) - 10;
      await expect(
        dex.addLiquidity(ethers.parseEther("1"), 0, 0, expired, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Transaction expired");
    });
  });

  describe("removeLiquidity", function () {
    beforeEach(seedPool);

    it("Should return the proportional share of both reserves", async function () {
      const lp = await dex.balanceOf(owner.address);
      const supply = await dex.totalSupply();
      const [rA, rETH] = await dex.getReserves();
      const expectedA = (lp * rA) / supply;
      const expectedETH = (lp * rETH) / supply;

      const tx = dex.removeLiquidity(lp, expectedA, expectedETH, await deadline());
      await expect(tx).to.emit(dex, "LiquidityRemoved").withArgs(owner.address, expectedA, expectedETH, lp);
      await expect(tx).to.changeTokenBalance(tokenA, owner, expectedA);
      await expect(tx).to.changeEtherBalance(owner, expectedETH);

      expect(await dex.balanceOf(owner.address)).to.equal(0);
      const [newRA, newRETH] = await dex.getReserves();
      expect(newRA).to.equal(rA - expectedA);
      expect(newRETH).to.equal(rETH - expectedETH);
    });

    it("Should revert when slippage limits are not met", async function () {
      const lp = await dex.balanceOf(owner.address);
      await expect(dex.removeLiquidity(lp, ethers.parseEther("1001"), 0, await deadline())).to.be.revertedWith(
        "Slippage: insufficient A amount"
      );
      await expect(dex.removeLiquidity(lp, 0, ethers.parseEther("11"), await deadline())).to.be.revertedWith(
        "Slippage: insufficient ETH amount"
      );
    });

    it("Should revert with zero or excessive LP amount", async function () {
      await expect(dex.removeLiquidity(0, 0, 0, await deadline())).to.be.revertedWith("Liquidity must be > 0");
      await expect(dex.connect(user1).removeLiquidity(1, 0, 0, await deadline())).to.be.revertedWith(
        "Insufficient LP balance"
      );
    });

    it("Should revert on expired deadline", async function () {
      const lp = await dex.balanceOf(owner.address);
      const expired = (await time.latest()) - 10;
      await expect(dex.removeLiquidity(lp, 0, 0, expired)).to.be.revertedWith("Transaction expired");
    });
  });

  describe("Swaps", function () {
    beforeEach(seedPool);

    it("Should swap A for ETH with the exact constant product output (0.3% fee)", async function () {
      const amountIn = ethers.parseEther("10");
      const [rA, rETH] = await dex.getReserves();
      const expectedOut = getAmountOut(amountIn, rA, rETH);
      expect(await dex.getAmountOut(amountIn, rA, rETH)).to.equal(expectedOut);

      await tokenA.connect(user1).approve(dexAddress, amountIn);
      const tx = dex.connect(user1).swapAforETH(amountIn, expectedOut, await deadline());

      await expect(tx).to.emit(dex, "Swap").withArgs(user1.address, tokenAddress, amountIn, expectedOut);
      await expect(tx).to.changeEtherBalances([user1, dex], [expectedOut, -expectedOut]);

      const [newRA, newRETH] = await dex.getReserves();
      expect(newRA).to.equal(rA + amountIn);
      expect(newRETH).to.equal(rETH - expectedOut);
    });

    it("Should swap ETH for A with the exact constant product output (0.3% fee)", async function () {
      const amountIn = ethers.parseEther("1");
      const [rA, rETH] = await dex.getReserves();
      const expectedOut = getAmountOut(amountIn, rETH, rA);

      const tx = dex.connect(user1).swapETHforA(expectedOut, await deadline(), { value: amountIn });

      await expect(tx).to.emit(dex, "Swap").withArgs(user1.address, ethers.ZeroAddress, amountIn, expectedOut);
      await expect(tx).to.changeTokenBalances(tokenA, [user1, dex], [expectedOut, -expectedOut]);
    });

    it("Should never decrease k = reserveA * reserveETH after swaps", async function () {
      let [rA, rETH] = await dex.getReserves();
      let k = rA * rETH;

      await tokenA.connect(user1).approve(dexAddress, ethers.parseEther("50"));
      await dex.connect(user1).swapAforETH(ethers.parseEther("50"), 0, await deadline());
      [rA, rETH] = await dex.getReserves();
      expect(rA * rETH).to.be.gte(k);
      k = rA * rETH;

      await dex.connect(user2).swapETHforA(0, await deadline(), { value: ethers.parseEther("2") });
      [rA, rETH] = await dex.getReserves();
      expect(rA * rETH).to.be.gte(k);
    });

    it("Should revert on slippage tolerance violation", async function () {
      const amountIn = ethers.parseEther("10");
      await tokenA.connect(user1).approve(dexAddress, amountIn);
      await expect(
        dex.connect(user1).swapAforETH(amountIn, ethers.parseEther("10"), await deadline())
      ).to.be.revertedWith("Slippage tolerance exceeded");

      await expect(
        dex.connect(user1).swapETHforA(ethers.parseEther("100"), await deadline(), { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Slippage tolerance exceeded");
    });

    it("Should revert on expired deadline", async function () {
      const expired = (await time.latest()) - 10;
      await expect(
        dex.connect(user1).swapETHforA(0, expired, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Transaction expired");
      await expect(dex.connect(user1).swapAforETH(ethers.parseEther("1"), 0, expired)).to.be.revertedWith(
        "Transaction expired"
      );
    });

    it("Should revert with zero input", async function () {
      await expect(dex.connect(user1).swapAforETH(0, 0, await deadline())).to.be.revertedWith("Invalid amount");
      await expect(dex.connect(user1).swapETHforA(0, await deadline())).to.be.revertedWith("Invalid amount");
    });
  });

  describe("Empty pool", function () {
    it("Should revert swaps when there is no liquidity", async function () {
      await expect(
        dex.connect(user1).swapETHforA(0, await deadline(), { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Attacks", function () {
    it("Should ignore tokens donated directly to the contract", async function () {
      await seedPool();
      const [rA, rETH] = await dex.getReserves();
      const quoteBefore = await dex.getAmountOut(ethers.parseEther("1"), rETH, rA);

      await tokenA.connect(user2).transfer(dexAddress, ethers.parseEther("500"));

      const [newRA, newRETH] = await dex.getReserves();
      expect(newRA).to.equal(rA);
      expect(newRETH).to.equal(rETH);
      expect(await dex.getAmountOut(ethers.parseEther("1"), newRETH, newRA)).to.equal(quoteBefore);
    });

    it("Should ignore ETH forced into the contract (e.g. selfdestruct)", async function () {
      await seedPool();
      const [rA, rETH] = await dex.getReserves();

      // setBalance simula un invio forzato che bypassa l'assenza di receive()
      await setBalance(dexAddress, rETH + ethers.parseEther("100"));

      const [newRA, newRETH] = await dex.getReserves();
      expect(newRA).to.equal(rA);
      expect(newRETH).to.equal(rETH);
    });

    it("Should reject plain ETH transfers", async function () {
      await expect(user1.sendTransaction({ to: dexAddress, value: ethers.parseEther("1") })).to.be.reverted;
    });

    it("Should protect the second depositor from the first-depositor inflation attack", async function () {
      // L'attaccante apre il pool con quantità minime (1 LP) e poi "dona" 900 NAO
      // sperando di gonfiare il valore della quota e far ricevere 0 LP alla vittima
      const attacker = user2;
      await tokenA.connect(attacker).approve(dexAddress, 1001);
      await dex.connect(attacker).addLiquidity(1001, 0, 0, await deadline(), { value: 1001 });
      expect(await dex.balanceOf(attacker.address)).to.equal(1);
      await tokenA.connect(attacker).transfer(dexAddress, ethers.parseEther("900"));

      // La donazione non entra nelle riserve: la vittima riceve LP pieni...
      const deposit = ethers.parseEther("10");
      await addLiquidity(user1, deposit, deposit);
      const victimLP = await dex.balanceOf(user1.address);
      expect(victimLP).to.equal(deposit);

      // ...e ritirando riottiene tutto il deposito
      await expect(dex.connect(user1).removeLiquidity(victimLP, 0, 0, await deadline())).to.changeTokenBalance(
        tokenA,
        user1,
        deposit
      );
    });
  });
});
