const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Trasferisce NAO (e se serve ETH per il gas) dall'account admin (#0) ad altri indirizzi.
//
// Uso:
//   npx hardhat run scripts/fund.js --network localhost
//       -> invia 1000 NAO a ciascuno degli account Hardhat #1..#4
//   TO=0xTuoIndirizzoMetamask AMOUNT=500 npx hardhat run scripts/fund.js --network localhost
//       -> invia 500 NAO (+ 10 ETH per pagare il gas) a un indirizzo specifico
async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const file = path.join(__dirname, "..", "deployed-contract.json");
  if (!fs.existsSync(file)) {
    throw new Error("deployed-contract.json non trovato: esegui prima `npm run deploy:local`");
  }
  const { tokenA: tokenAddress } = JSON.parse(fs.readFileSync(file, "utf8"));
  if ((await ethers.provider.getCode(tokenAddress)) === "0x") {
    throw new Error(`Token non deployato all'indirizzo ${tokenAddress}: riavvia il nodo e riesegui il deploy`);
  }
  const naoToken = await ethers.getContractAt("NAOTOKENERC20", tokenAddress);

  const amount = ethers.parseEther(process.env.AMOUNT || "1000");
  const targets = process.env.TO ? [process.env.TO] : signers.slice(1, 5).map((s) => s.address);

  console.log("Admin:", admin.address, "saldo NAO:", ethers.formatEther(await naoToken.balanceOf(admin.address)));

  for (const to of targets) {
    await (await naoToken.connect(admin).transfer(to, amount)).wait();

    // Un indirizzo esterno a Hardhat (es. MetaMask) non ha ETH per il gas: gliene mandiamo un po'
    if ((await ethers.provider.getBalance(to)) < ethers.parseEther("1")) {
      await (await admin.sendTransaction({ to, value: ethers.parseEther("10") })).wait();
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
