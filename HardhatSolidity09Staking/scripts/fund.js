const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Trasferisce NAO (e opzionalmente ETH) dall'account admin (#0) ad altri indirizzi.
//
// Uso:
//   npx hardhat run scripts/fund.js --network localhost
//       -> invia 1000 NAO a ciascuno degli account Hardhat #1..#4
//   TO=0xTuoIndirizzoMetamask AMOUNT=500 npx hardhat run scripts/fund.js --network localhost
//       -> invia 500 NAO (+ 10 ETH per pagare il gas) a un indirizzo specifico
async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const configPath = path.join(__dirname, "..", "client", "src", "contracts", "config.js");
  if (!fs.existsSync(configPath)) {
    throw new Error("config.js non trovato: esegui prima `npx hardhat run scripts/deploy.js --network localhost`");
  }
  const tokenAddress = fs.readFileSync(configPath, "utf8").match(/TOKEN_ADDRESS = "(0x[0-9a-fA-F]{40})"/)[1];
  if ((await ethers.provider.getCode(tokenAddress)) === "0x") {
    throw new Error(`Token non deployato all'indirizzo ${tokenAddress}: riavvia il nodo e riesegui deploy.js`);
  }
  const naoToken = await ethers.getContractAt("NAOTOKENERC20", tokenAddress);

  const amount = ethers.parseEther(process.env.AMOUNT || "1000");
  const targets = process.env.TO
    ? [process.env.TO]
    : signers.slice(1, 5).map((s) => s.address);

  console.log("Admin:", admin.address, "saldo NAO:", ethers.formatEther(await naoToken.balanceOf(admin.address)));

  for (const to of targets) {
    const tx = await naoToken.connect(admin).transfer(to, amount);
    await tx.wait();

    // Se l'indirizzo è esterno a Hardhat (es. MetaMask) non ha ETH per il gas: gliene mandiamo un po'
    const ethBalance = await ethers.provider.getBalance(to);
    if (ethBalance < ethers.parseEther("1")) {
      const ethTx = await admin.sendTransaction({ to, value: ethers.parseEther("10") });
      await ethTx.wait();
      console.log(`  -> inviati 10 ETH a ${to} per il gas`);
    }

    console.log(`Inviati ${ethers.formatEther(amount)} NAO a ${to} (saldo NAO: ${ethers.formatEther(await naoToken.balanceOf(to))})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
