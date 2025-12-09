const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GuessTheNumberMulti (NAO token)", function () {
	async function deployFixture() {
		const [admin, setter1, setter2, p1, p2] = await ethers.getSigners();
		// Deploy mock NAO token
		const ERC20 = await ethers.getContractFactory("NAOTOKENERC20", admin);
		const nao = await ERC20.deploy("Guess Number Game", "GNG");
		await nao.waitForDeployment();
		// Distribuisci NAO ai giocatori
		for (const user of [setter1, setter2, p1, p2]) {
			await nao.connect(admin).transfer(user.address, ethers.parseUnits("1000", 18));
		}
		const setFee = ethers.parseUnits("100", 18);
		const guessFee = ethers.parseUnits("50", 18);
		const F = await ethers.getContractFactory("GuessTheNumberMulti", admin);
		const c = await F.deploy(nao.target, setFee, guessFee);
		await c.waitForDeployment();
		return { c, nao, admin, setter1, setter2, p1, p2, setFee, guessFee };
	}


		it("più utenti possono avviare partite e aggiornarle", async function () {
			const { c, nao, setter1, setter2, setFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			const n2 = 100000000000000000002n;
			const n3 = 100000000000000000003n;
			await nao.connect(setter1).approve(c.target, setFee);
			await expect(c.connect(setter1).startGame(n1)).to.emit(c, "GameStarted");
			await nao.connect(setter2).approve(c.target, setFee);
			await expect(c.connect(setter2).startGame(n2)).to.emit(c, "GameStarted");
			await nao.connect(setter1).approve(c.target, setFee);
			await expect(c.connect(setter1).updateNumber(n3)).to.emit(c, "NumberUpdated");
			const g1 = await c.games(setter1.address);
			const g2 = await c.games(setter2.address);
			expect(g1.active).to.equal(true);
			expect(g2.active).to.equal(true);
			expect(g1.target).to.equal(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [n3])));
			expect(g2.target).to.equal(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [n2])));
		});


		it("guessAny indovina la partita giusta e paga il premio in NAO", async function () {
			const { c, nao, setter1, setter2, p1, setFee, guessFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			const n2 = 100000000000000000002n;
			await nao.connect(setter1).approve(c.target, setFee);
			await c.connect(setter1).startGame(n1);
			await nao.connect(setter2).approve(c.target, setFee);
			await c.connect(setter2).startGame(n2);
			await nao.connect(p1).approve(c.target, guessFee);
			const before = await nao.balanceOf(p1.address);
			await c.connect(p1).guessAny(n2);
			const after = await nao.balanceOf(p1.address);
			expect(after).to.equal(before + setFee); // vince prizePool (setFee) + guessFee - guessFee = setFee
			const g2 = await c.games(setter2.address);
			expect(g2.active).to.equal(false);
			const g1 = await c.games(setter1.address);
			expect(g1.active).to.equal(true);
		});


		it("guessAny sbagliato divide la fee NAO tra tutti i prizePool attivi e admin", async function () {
			const { c, nao, setter1, setter2, p1, setFee, guessFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			const n2 = 100000000000000000002n;
			const wrong = 100000000000000000099n;
			await nao.connect(setter1).approve(c.target, setFee);
			await c.connect(setter1).startGame(n1);
			await nao.connect(setter2).approve(c.target, setFee);
			await c.connect(setter2).startGame(n2);
			await nao.connect(p1).approve(c.target, guessFee);
			await c.connect(p1).guessAny(wrong);
			const g1 = await c.games(setter1.address);
			const g2 = await c.games(setter2.address);
			expect(g1.prizePool).to.equal(setFee + guessFee / 2n / 2n); // metà fee divisa tra 2
			expect(g2.prizePool).to.equal(setFee + guessFee / 2n / 2n);
			expect(await c.adminBalance()).to.equal(guessFee - guessFee / 2n);
		});

		it("admin può prelevare il saldo NAO", async function () {
			const { c, nao, admin, setter1, p1, setFee, guessFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			const wrong = 100000000000000000099n;
			await nao.connect(setter1).approve(c.target, setFee);
			await c.connect(setter1).startGame(n1);
			await nao.connect(p1).approve(c.target, guessFee);
			await c.connect(p1).guessAny(wrong);
			const amount = await c.adminBalance();
			const before = await nao.balanceOf(admin.address);
			await c.connect(admin).adminWithdraw(admin.address, amount);
			const after = await nao.balanceOf(admin.address);
			expect(after).to.equal(before + amount);
			expect(await c.adminBalance()).to.equal(0n);
		});


		it("impedisce di giocare se il numero è troppo corto (< 20 cifre)", async function () {
			const { c, nao, setter1, setFee } = await deployFixture();
			const shortNumber = 12345n;
			await nao.connect(setter1).approve(c.target, setFee);
			await expect(c.connect(setter1).startGame(shortNumber)).to.be.revertedWithCustomError(c, "InvalidNumber");
		});

		it("impedisce di avviare una partita se ne esiste già una attiva", async function () {
			const { c, nao, setter1, setFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			await nao.connect(setter1).approve(c.target, setFee * 2n);
			await c.connect(setter1).startGame(n1);
			await expect(c.connect(setter1).startGame(n1)).to.be.revertedWithCustomError(c, "GameActive");
		});

		it("impedisce di aggiornare il numero se non c'è una partita attiva", async function () {
			const { c, nao, setter1, setFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			await nao.connect(setter1).approve(c.target, setFee);
			await expect(c.connect(setter1).updateNumber(n1)).to.be.revertedWithCustomError(c, "NoActiveGame");
		});

		it("applica il rate limit di 4 tentativi ogni 7 ore", async function () {
			const { c, nao, setter1, p1, setFee, guessFee } = await deployFixture();
			const n1 = 100000000000000000001n;
			const wrong = 100000000000000000099n;
			
			await nao.connect(setter1).approve(c.target, setFee);
			await c.connect(setter1).startGame(n1);
			
			// Player fa approve per 5 tentativi
			await nao.connect(p1).approve(c.target, guessFee * 5n);
			
			// 4 tentativi ok
			for(let i=0; i<4; i++) {
				await c.connect(p1).guessAny(wrong);
			}
			
			// 5° tentativo fallisce
			await expect(c.connect(p1).guessAny(wrong)).to.be.revertedWith("Too many attempts, wait window");
			
			// Avanza tempo di 7 ore + 1 secondo
			await ethers.provider.send("evm_increaseTime", [7 * 3600 + 1]);
			await ethers.provider.send("evm_mine");
			
			// Ora dovrebbe funzionare di nuovo
			await c.connect(p1).guessAny(wrong);
		});

		it("solo admin può aggiornare le fee", async function () {
			const { c, setter1 } = await deployFixture();
			const newSetFee = ethers.parseUnits("200", 18);
			const newGuessFee = ethers.parseUnits("100", 18);
			
			await expect(c.connect(setter1).updateFees(newSetFee, newGuessFee)).to.be.revertedWithCustomError(c, "NotAdmin");
			
			await expect(c.updateFees(newSetFee, newGuessFee))
				.to.emit(c, "FeesUpdated")
				.withArgs(newSetFee, newGuessFee);
				
			expect(await c.setFee()).to.equal(newSetFee);
			expect(await c.guessFee()).to.equal(newGuessFee);
		});
});

