const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery (Chainlink VRF)", function () {
  let vrfCoordinator, naoToken, lottery;
  let owner, player1, player2, player3, nonOwner;
  let subId;

  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";
  const entryFee = ethers.parseEther("0.1"); // 0.1 NAO

  beforeEach(async function () {
    [owner, player1, player2, player3, nonOwner] = await ethers.getSigners();

    // 1. Deploy VRFCoordinatorV2Mock
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinator = await VRFCoordinatorV2Mock.deploy(ethers.parseEther("0.25"), 1e9);
    await vrfCoordinator.waitForDeployment();

    // 2. Create and fund subscription
    const tx = await vrfCoordinator.createSubscription();
    await tx.wait();
    subId = 1;
    await vrfCoordinator.fundSubscription(subId, ethers.parseEther("10"));

    // 3. Deploy NAO Token
    const MockERC20 = await ethers.getContractFactory("NAOTOKENERC20");
    naoToken = await MockERC20.deploy("NAO Token", "NAO");
    await naoToken.waitForDeployment();

    // 4. Deploy Lottery
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(
      subId,
      await vrfCoordinator.getAddress(),
      keyHash,
      entryFee,
      await naoToken.getAddress()
    );
    await lottery.waitForDeployment();

    // 5. Add consumer to VRF Mock
    await vrfCoordinator.addConsumer(subId, await lottery.getAddress());

    // 6. Distribute NAO Tokens to players
    await naoToken.transfer(player1.address, ethers.parseEther("10"));
    await naoToken.transfer(player2.address, ethers.parseEther("10"));
    await naoToken.transfer(player3.address, ethers.parseEther("10"));
  });

  describe("Deployment & Initial State", function () {
    it("Dovrebbe impostare correttamente owner, parametri e stato iniziale", async function () {
      expect(await lottery.owner()).to.equal(owner.address);
      expect(await lottery.vrfCoordinator()).to.equal(await vrfCoordinator.getAddress());
      expect(await lottery.paymentToken()).to.equal(await naoToken.getAddress());
      expect(await lottery.entryFee()).to.equal(entryFee);
      expect(await lottery.s_subscriptionId()).to.equal(subId);
      expect(await lottery.keyHash()).to.equal(keyHash);
      expect(await lottery.lotteryState()).to.equal(0); // OPEN
      expect(await lottery.lotteryId()).to.equal(1);
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.getLotteryBalance()).to.equal(0);
    });

    it("Reverte se indirizzo coordinator o token sono nulli o fee <= 0", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      await expect(
        Lottery.deploy(subId, ethers.ZeroAddress, keyHash, entryFee, await naoToken.getAddress())
      ).to.be.revertedWith("Invalid coordinator");

      await expect(
        Lottery.deploy(subId, await vrfCoordinator.getAddress(), keyHash, entryFee, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid payment token");

      await expect(
        Lottery.deploy(subId, await vrfCoordinator.getAddress(), keyHash, 0, await naoToken.getAddress())
      ).to.be.revertedWith("Entry fee must be > 0");
    });
  });

  describe("Ingresso Giocatori (enter)", function () {
    it("Un giocatore può approvare ed entrare nella lotteria", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);

      await expect(lottery.connect(player1).enter())
        .to.emit(lottery, "PlayerEntered")
        .withArgs(1, player1.address);

      expect(await lottery.getPlayersCount()).to.equal(1);
      expect(await lottery.players(0)).to.equal(player1.address);
      expect(await lottery.getLotteryBalance()).to.equal(entryFee);
    });

    it("Più giocatori possono partecipare allo stesso round", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      await naoToken.connect(player2).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player2).enter();

      await naoToken.connect(player3).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player3).enter();

      expect(await lottery.getPlayersCount()).to.equal(3);
      const playersList = await lottery.getPlayers();
      expect(playersList).to.deep.equal([player1.address, player2.address, player3.address]);
      expect(await lottery.getLotteryBalance()).to.equal(entryFee * 3n);
    });

    it("Lo stesso giocatore può acquistare più biglietti nello stesso round", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee * 2n);
      await lottery.connect(player1).enter();
      await lottery.connect(player1).enter();

      expect(await lottery.getPlayersCount()).to.equal(2);
      expect(await lottery.players(0)).to.equal(player1.address);
      expect(await lottery.players(1)).to.equal(player1.address);
    });

    it("Reverte se l'utente non ha approvato i token sufficienti", async function () {
      await expect(
        lottery.connect(player1).enter()
      ).to.be.reverted;
    });

    it("Reverte se il saldo di token è insufficiente", async function () {
      const poorPlayer = nonOwner;
      await naoToken.connect(poorPlayer).approve(await lottery.getAddress(), entryFee);
      await expect(
        lottery.connect(poorPlayer).enter()
      ).to.be.reverted;
    });

    it("Reverte se la lotteria è in fase CALCULATING_WINNER", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      // Owner avvia l'estrazione
      await lottery.connect(owner).pickWinner();
      expect(await lottery.lotteryState()).to.equal(1); // CALCULATING_WINNER

      // Nuovo ingresso bloccato
      await naoToken.connect(player2).approve(await lottery.getAddress(), entryFee);
      await expect(
        lottery.connect(player2).enter()
      ).to.be.revertedWith("Lottery is not open");
    });
  });

  describe("Amministrazione & Modifica Fee", function () {
    it("Solo l'owner può chiamare pickWinner", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      await expect(
        lottery.connect(player1).pickWinner()
      ).to.be.revertedWith("Only owner");
    });

    it("pickWinner reverte se non ci sono giocatori", async function () {
      await expect(
        lottery.connect(owner).pickWinner()
      ).to.be.revertedWith("No players in lottery");
    });

    it("Owner può aggiornare entryFee quando il round è vuoto e OPEN", async function () {
      const newFee = ethers.parseEther("0.5");
      await expect(lottery.connect(owner).setEntryFee(newFee))
        .to.emit(lottery, "EntryFeeUpdated")
        .withArgs(newFee);

      expect(await lottery.entryFee()).to.equal(newFee);
    });

    it("Non-owner non può aggiornare entryFee", async function () {
      await expect(
        lottery.connect(player1).setEntryFee(ethers.parseEther("0.5"))
      ).to.be.revertedWith("Only owner");
    });

    it("setEntryFee reverte se ci sono già giocatori registrati nel round", async function () {
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      await expect(
        lottery.connect(owner).setEntryFee(ethers.parseEther("0.5"))
      ).to.be.revertedWith("Cannot change fee during active round");
    });

    it("setEntryFee reverte se il valore è 0", async function () {
      await expect(
        lottery.connect(owner).setEntryFee(0)
      ).to.be.revertedWith("Fee must be greater than 0");
    });
  });

  describe("Estrazione Vincitore & Callback Chainlink VRF", function () {
    beforeEach(async function () {
      // player1 e player2 entrano
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      await naoToken.connect(player2).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player2).enter();
    });

    it("pickWinner richiede casualità e imposta lo stato su CALCULATING_WINNER", async function () {
      const tx = await lottery.connect(owner).pickWinner();
      await expect(tx).to.emit(lottery, "RequestSent");

      expect(await lottery.lotteryState()).to.equal(1); // CALCULATING_WINNER
      expect(await lottery.lastRequestId()).to.equal(1);
    });

    it("VRF fulfillRandomWords seleziona il vincitore, accredita il premio e resetta lo stato", async function () {
      const pot = entryFee * 2n;
      const initialBal1 = await naoToken.balanceOf(player1.address);
      const initialBal2 = await naoToken.balanceOf(player2.address);

      await lottery.connect(owner).pickWinner();
      const requestId = await lottery.lastRequestId();

      // Simuliamo la callback dell'oracolo VRF
      // Nel mock il random word restituito è uint256(keccak256(abi.encode(requestId, 0)))
      // Verifichiamo che emetta WinnerPicked
      const fulfillTx = await vrfCoordinator.fulfillRandomWords(requestId, await lottery.getAddress());
      const receipt = await fulfillTx.wait();

      // Recuperiamo l'evento WinnerPicked
      const lotteryInterface = lottery.interface;
      const winnerEvent = receipt.logs
        .map((log) => {
          try {
            return lotteryInterface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "WinnerPicked");

      expect(winnerEvent).to.not.be.null;
      const winner = winnerEvent.args.winner;
      const amount = winnerEvent.args.amount;

      expect([player1.address, player2.address]).to.include(winner);
      expect(amount).to.equal(pot);

      // Verifica memorizzazione recente
      expect(await lottery.recentWinner()).to.equal(winner);
      expect(await lottery.recentPrize()).to.equal(pot);

      // Verifica saldo token vincitore
      if (winner === player1.address) {
        expect(await naoToken.balanceOf(player1.address)).to.equal(initialBal1 + pot);
        expect(await naoToken.balanceOf(player2.address)).to.equal(initialBal2);
      } else {
        expect(await naoToken.balanceOf(player2.address)).to.equal(initialBal2 + pot);
        expect(await naoToken.balanceOf(player1.address)).to.equal(initialBal1);
      }

      // Verifica che la lotteria sia tornata a OPEN e il jackpot a 0
      expect(await lottery.lotteryState()).to.equal(0); // OPEN
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.getLotteryBalance()).to.equal(0);
      expect(await lottery.lotteryId()).to.equal(2);
    });

    it("Solo il VRF Coordinator autorizzato può richiamare la fulfillment", async function () {
      await lottery.connect(owner).pickWinner();

      // Chiamata non autorizzata diretta a rawFulfillRandomWords da account estraneo
      await expect(
        lottery.rawFulfillRandomWords(1, [12345])
      ).to.be.revertedWithCustomError(lottery, "OnlyCoordinatorCanFulfill");
    });
  });

  describe("Ciclo Multi-Round Successivo", function () {
    it("Esegue correttamente due round consecutivi con vincitori diversi", async function () {
      // --- ROUND 1 ---
      await naoToken.connect(player1).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player1).enter();

      await lottery.connect(owner).pickWinner();
      await vrfCoordinator.fulfillRandomWords(1, await lottery.getAddress());

      expect(await lottery.lotteryId()).to.equal(2);
      expect(await lottery.recentWinner()).to.equal(player1.address);
      expect(await lottery.lotteryState()).to.equal(0); // OPEN

      // --- ROUND 2 ---
      await naoToken.connect(player2).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player2).enter();
      await naoToken.connect(player3).approve(await lottery.getAddress(), entryFee);
      await lottery.connect(player3).enter();

      expect(await lottery.getPlayersCount()).to.equal(2);
      expect(await lottery.getLotteryBalance()).to.equal(entryFee * 2n);

      await lottery.connect(owner).pickWinner();
      expect(await lottery.lastRequestId()).to.equal(2);

      await vrfCoordinator.fulfillRandomWords(2, await lottery.getAddress());

      expect(await lottery.lotteryId()).to.equal(3);
      expect(await lottery.getPlayersCount()).to.equal(0);
      expect(await lottery.getLotteryBalance()).to.equal(0);
      expect([player2.address, player3.address]).to.include(await lottery.recentWinner());
    });
  });
});
