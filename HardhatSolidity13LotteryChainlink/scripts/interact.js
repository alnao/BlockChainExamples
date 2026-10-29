/**
 * interact.js – Simulazione interattiva CLI della Lotteria con Chainlink VRF Mock.
 *
 * Funziona sia in-memory:
 *   npx hardhat run scripts/interact.js
 * Sia contro nodo locale persistente:
 *   npx hardhat run scripts/interact.js --network localhost
 */
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Carica contratti da deployed-contract.json o esegue fresh deploy
async function loadOrDeploy(signers) {
  const [deployer] = signers;
  const deployFile = path.join(__dirname, "..", "deployed-contract.json");
  const { chainId } = await ethers.provider.getNetwork();

  if (fs.existsSync(deployFile)) {
    const saved = JSON.parse(fs.readFileSync(deployFile, "utf8"));
    const codeCheck = await ethers.provider.getCode(saved.lottery);

    if (saved.chainId === chainId.toString() && codeCheck !== "0x") {
      console.log(`[loadOrDeploy] Riutilizzo contratti già distribuiti su ${saved.network}`);
      const naoToken = await ethers.getContractAt("NAOTOKENERC20", saved.token);
      const vrfCoordinator = await ethers.getContractAt("VRFCoordinatorV2Mock", saved.vrfCoordinator);
      const lottery = await ethers.getContractAt("Lottery", saved.lottery);
      return { naoToken, vrfCoordinator, lottery };
    }
  }

  console.log("[loadOrDeploy] Nessun deploy locale attivo trovato, avvio fresh deploy in memoria...");

  // 1. Deploy VRF Coordinator Mock
  const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfCoordinator = await VRFCoordinatorV2Mock.connect(deployer).deploy(
    ethers.parseEther("0.25"),
    1e9
  );
  await vrfCoordinator.waitForDeployment();

  // 2. Setup subscription
  const tx = await vrfCoordinator.createSubscription();
  await tx.wait();
  const subId = 1n;
  await (await vrfCoordinator.fundSubscription(subId, ethers.parseEther("10"))).wait();

  // 3. Deploy NAO Token
  const MockERC20 = await ethers.getContractFactory("NAOTOKENERC20");
  const naoToken = await MockERC20.connect(deployer).deploy("NAO Token", "NAO");
  await naoToken.waitForDeployment();

  // 4. Deploy Lottery
  const entryFee = ethers.parseEther("1");
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.connect(deployer).deploy(
    subId,
    await vrfCoordinator.getAddress(),
    keyHash,
    entryFee,
    await naoToken.getAddress()
  );
  await lottery.waitForDeployment();

  // 5. Add consumer
  await (await vrfCoordinator.addConsumer(subId, await lottery.getAddress())).wait();

  return { naoToken, vrfCoordinator, lottery };
}

async function main() {
  const signers = await ethers.getSigners();
  const [owner, player1, player2] = signers;

  console.log("=== Lottery Chainlink VRF – Simulazione Interattiva ===");
  console.log("Network :", network.name);
  console.log("Owner   :", owner.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);

  // 1. Carica o deploya i contratti
  const { naoToken, vrfCoordinator, lottery } = await loadOrDeploy(signers);
  const lotteryAddress = await lottery.getAddress();
  const tokenAddress = await naoToken.getAddress();
  const vrfAddress = await vrfCoordinator.getAddress();

  console.log("\n--- Contratti in uso ---");
  console.log("  VRFCoordinatorMock:", vrfAddress);
  console.log("  NAO Token         :", tokenAddress);
  console.log("  Lottery           :", lotteryAddress);

  const entryFee = await lottery.entryFee();
  console.log(`  Prezzo biglietto  : ${ethers.formatEther(entryFee)} NAO`);

  // 2. Prepara saldo giocatori (distribuisce NAO se necessario)
  const p1Bal = await naoToken.balanceOf(player1.address);
  if (p1Bal < entryFee * 5n) {
    await (await naoToken.transfer(player1.address, ethers.parseEther("50"))).wait();
    console.log("\n[setup] Inviati 50 NAO a Player 1");
  }
  const p2Bal = await naoToken.balanceOf(player2.address);
  if (p2Bal < entryFee * 5n) {
    await (await naoToken.transfer(player2.address, ethers.parseEther("50"))).wait();
    console.log("[setup] Inviati 50 NAO a Player 2");
  }

  // 3. Round info iniziale
  const currentRound = await lottery.lotteryId();
  const stateLabels = ["OPEN", "CALCULATING_WINNER", "CLOSED"];
  const currentState = Number(await lottery.lotteryState());
  console.log(`\n--- Round #${currentRound} [Stato: ${stateLabels[currentState]}] ---`);

  // Se per qualche motivo lo stato fosse CALCULATING_WINNER residuo, soddisfalo prima
  if (currentState === 1) {
    const lastReq = await lottery.lastRequestId();
    console.log(`[recovery] Trovata estrazione in sospeso (reqId: ${lastReq}). Eseguo fulfill...`);
    await (await vrfCoordinator.fulfillRandomWords(lastReq, lotteryAddress)).wait();
  }

  // 4. Ingresso giocatori
  console.log("\n[step 1] Giocatori acquistano biglietti...");
  await (await naoToken.connect(player1).approve(lotteryAddress, entryFee)).wait();
  await (await lottery.connect(player1).enter()).wait();
  console.log(`  🎟️  Player 1 ha acquistato 1 biglietto (${ethers.formatEther(entryFee)} NAO)`);

  await (await naoToken.connect(player2).approve(lotteryAddress, entryFee)).wait();
  await (await lottery.connect(player2).enter()).wait();
  console.log(`  🎟️  Player 2 ha acquistato 1 biglietto (${ethers.formatEther(entryFee)} NAO)`);

  const pot = await lottery.getLotteryBalance();
  const playersList = await lottery.getPlayers();
  console.log(`\n  📊 Giocatori iscritti: ${playersList.length} (${playersList.map(a => a.slice(0, 6) + '…').join(', ')})`);
  console.log(`  💵 Montepremi totale : ${ethers.formatEther(pot)} NAO`);

  // 5. Avvio estrazione da parte dell'owner
  console.log("\n[step 2] Owner chiama pickWinner()...");
  const pickTx = await lottery.connect(owner).pickWinner();
  await pickTx.wait();

  const stateAfterPick = Number(await lottery.lotteryState());
  console.log(`  📌 Nuovo stato lotteria: ${stateLabels[stateAfterPick]}`);

  const requestId = await lottery.lastRequestId();
  console.log(`  🎲 Richiesta Chainlink VRF inviata (requestId: ${requestId})`);

  // 6. Simulazione callback VRF da parte del nodo Chainlink
  console.log("\n[step 3] Simulazione risposta Chainlink VRF (fulfillRandomWords)...");
  const fulfillTx = await vrfCoordinator.fulfillRandomWords(requestId, lotteryAddress);
  const receipt = await fulfillTx.wait();

  // Parsing dell'evento WinnerPicked
  const lotteryInterface = lottery.interface;
  const winnerEvent = receipt.logs
    .map(log => { try { return lotteryInterface.parseLog(log); } catch { return null; } })
    .find(e => e && e.name === "WinnerPicked");

  console.log("\n========== RISULTATO ESTRAZIONE ==========");
  if (winnerEvent) {
    console.log(`  🏆 Vincitore Round #${winnerEvent.args.lotteryId} : ${winnerEvent.args.winner}`);
    console.log(`  💰 Premio incassato            : ${ethers.formatEther(winnerEvent.args.amount)} NAO`);
  } else {
    console.log(`  🏆 Vincitore registrato: ${await lottery.recentWinner()}`);
  }

  const finalBal1 = await naoToken.balanceOf(player1.address);
  const finalBal2 = await naoToken.balanceOf(player2.address);
  console.log(`\n  Saldo finale Player 1: ${ethers.formatEther(finalBal1)} NAO`);
  console.log(`  Saldo finale Player 2: ${ethers.formatEther(finalBal2)} NAO`);
  console.log("==========================================");

  // 7. Verifica reset per prossimo round
  const nextRound = await lottery.lotteryId();
  const nextState = Number(await lottery.lotteryState());
  console.log(`\n✅ Prossimo Round #${nextRound} pronto in stato ${stateLabels[nextState]}`);
  console.log(`   Giocatori attivi: ${await lottery.getPlayersCount()}, Montepremi: ${ethers.formatEther(await lottery.getLotteryBalance())} NAO`);
  console.log("\n=== Simulazione completata con successo ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
