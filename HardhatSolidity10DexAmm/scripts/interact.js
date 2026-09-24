const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const SLIPPAGE_BPS = 100n; // 1% di tolleranza

// Riusa i contratti di deployed-contract.json se appartengono alla rete corrente,
// altrimenti esegue un nuovo deploy (es. rete "hardhat" in-process)
async function loadOrDeploy() {
  const file = path.join(__dirname, "..", "deployed-contract.json");
  if (fs.existsSync(file)) {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    const { chainId } = await ethers.provider.getNetwork();
    const hasCode = saved.chainId === chainId.toString() && (await ethers.provider.getCode(saved.dex)) !== "0x";
    if (saved.network === network.name && hasCode) {
      console.log("Using contracts from deployed-contract.json");
      return {
        tokenA: await ethers.getContractAt("NAOTOKENERC20", saved.tokenA),
        dex: await ethers.getContractAt("SimpleDEX", saved.dex)
      };
    }
  }

  console.log("No deployment found for network", network.name, "- deploying new contracts");
  const tokenA = await (await ethers.getContractFactory("NAOTOKENERC20")).deploy("NAO Token", "NAO");
  await tokenA.waitForDeployment();
  const dex = await (await ethers.getContractFactory("SimpleDEX")).deploy(await tokenA.getAddress());
  await dex.waitForDeployment();
  return { tokenA, dex };
}

async function deadline() {
  return (await ethers.provider.getBlock("latest")).timestamp + 600;
}

function withSlippage(amount) {
  return (amount * (10000n - SLIPPAGE_BPS)) / 10000n;
}

async function printReserves(dex) {
  const [rA, rETH] = await dex.getReserves();
  console.log(`Reserves: ${ethers.formatEther(rA)} NAO / ${ethers.formatEther(rETH)} ETH`);
}

async function main() {
  const [owner, user1] = await ethers.getSigners();
  console.log("=== SimpleDEX Interactive Demo ===");
  console.log("Owner address:", owner.address);
  console.log("User1 address:", user1.address);

  const { tokenA, dex } = await loadOrDeploy();
  const dexAddress = await dex.getAddress();
  console.log("\n1. NAO Token at:", await tokenA.getAddress());
  console.log("2. SimpleDEX at:", dexAddress);

  // Transfer NAO to user1
  await (await tokenA.transfer(user1.address, ethers.parseEther("5000"))).wait();
  console.log("3. Transferred 5000 NAO to User1");

  // Owner aggiunge 1000 NAO + 10 ETH (se il pool esiste già viene usata la proporzione corrente)
  const initNAO = ethers.parseEther("1000");
  const initETH = ethers.parseEther("10");
  await (await tokenA.approve(dexAddress, initNAO)).wait();
  console.log("\n--- Owner adding up to 1000 NAO + 10 ETH liquidity ---");
  await (await dex.addLiquidity(initNAO, 0, 0, await deadline(), { value: initETH })).wait();

  const lpBalance = await dex.balanceOf(owner.address);
  console.log("Owner LP Tokens:", ethers.formatEther(lpBalance));
  await printReserves(dex);

  // User1 swap 100 NAO -> ETH, con minimo calcolato dal preventivo meno lo slippage
  const swapAmountNAO = ethers.parseEther("100");
  let [rA, rETH] = await dex.getReserves();
  const expectedETH = await dex.getAmountOut(swapAmountNAO, rA, rETH);
  await (await tokenA.connect(user1).approve(dexAddress, swapAmountNAO)).wait();
  console.log("\n--- User1 swapping 100 NAO for ETH ---");
  console.log("Expected ETH:", ethers.formatEther(expectedETH));
  const ethBefore = await ethers.provider.getBalance(user1.address);
  const receipt1 = await (await dex.connect(user1).swapAforETH(swapAmountNAO, withSlippage(expectedETH), await deadline())).wait();
  const ethAfter = await ethers.provider.getBalance(user1.address);
  const ethGained = ethAfter - ethBefore + receipt1.gasUsed * receipt1.gasPrice;
  console.log("User1 received ETH:", ethers.formatEther(ethGained));

  // User1 swap 1 ETH -> NAO
  const swapAmountETH = ethers.parseEther("1");
  [rA, rETH] = await dex.getReserves();
  const expectedNAO = await dex.getAmountOut(swapAmountETH, rETH, rA);
  console.log("\n--- User1 swapping 1 ETH for NAO ---");
  console.log("Expected NAO:", ethers.formatEther(expectedNAO));
  const naoBefore = await tokenA.balanceOf(user1.address);
  await (await dex.connect(user1).swapETHforA(withSlippage(expectedNAO), await deadline(), { value: swapAmountETH })).wait();
  const naoAfter = await tokenA.balanceOf(user1.address);
  console.log("User1 received NAO:", ethers.formatEther(naoAfter - naoBefore));
  await printReserves(dex);

  // Owner rimuove tutta la sua liquidità
  console.log("\n--- Owner removing LP liquidity ---");
  await (await dex.removeLiquidity(lpBalance, 0, 0, await deadline())).wait();
  console.log("Remaining LP balance:", ethers.formatEther(await dex.balanceOf(owner.address)));
  await printReserves(dex);
  console.log("=== Demo completed successfully ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
