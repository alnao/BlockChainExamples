const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Trasferisce NAO governance token (e se serve ETH per il gas) dall'account deployer (#0) ad altri indirizzi.
//
// Uso:
//   npm run fund:local
//   oppure: npx hardhat run scripts/fund.js --network localhost
//       -> invia 10,000 NAO a ciascuno degli account Hardhat #1..#4 e ne attiva la delega dei voti
//
//   TO=0xTuoIndirizzoMetamask AMOUNT=5000 npm run fund:local
//       -> invia 5000 NAO (+ 10 ETH per il gas) a un indirizzo specifico (es. MetaMask)
async function main() {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const file = path.join(__dirname, "..", "deployed-contract.json");
  if (!fs.existsSync(file)) {
    throw new Error("deployed-contract.json non trovato: esegui prima `npm run deploy:local`");
  }
  const { token: tokenAddress } = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!tokenAddress || (await ethers.provider.getCode(tokenAddress)) === "0x") {
    throw new Error(`Token non deployato all'indirizzo ${tokenAddress}: riavvia il nodo e riesegui il deploy`);
  }

  const naoToken = await ethers.getContractAt("GovernanceToken", tokenAddress);

  const amount = ethers.parseEther(process.env.AMOUNT || "10000");
  const targetAddresses = process.env.TO
    ? [process.env.TO]
    : signers.slice(1, 5).map((s) => s.address);

  console.log("=== Distribuzione Crediti DAO Governance ===");
  console.log("Admin (Deployer):", admin.address);
  console.log("Saldo NAO Admin:", ethers.formatEther(await naoToken.balanceOf(admin.address)));
  console.log("Importo per indirizzo:", ethers.formatEther(amount), "NAO\n");

  for (const to of targetAddresses) {
    // 1. Invia NAO Token
    const txTransfer = await naoToken.connect(admin).transfer(to, amount);
    await txTransfer.wait();

    // 2. Se l'indirizzo ha poco ETH (es. account MetaMask appena creato), invia 10 ETH per il gas
    const balanceEth = await ethers.provider.getBalance(to);
    if (balanceEth < ethers.parseEther("1")) {
      const txEth = await admin.sendTransaction({ to, value: ethers.parseEther("10") });
      await txEth.wait();
      console.log(`  -> Inviati 10 ETH a ${to} per coprire le gas fee`);
    }

    // 3. Se l'indirizzo è uno dei signer locali Hardhat, attiviamo anche subito la delega dei voti a se stesso
    const localSigner = signers.find((s) => s.address.toLowerCase() === to.toLowerCase());
    if (localSigner) {
      const currentDelegate = await naoToken.delegates(to);
      if (currentDelegate === ethers.ZeroAddress) {
        const txDel = await naoToken.connect(localSigner).delegate(to);
        await txDel.wait();
        console.log(`  -> Auto-delega voti attivata per ${to}`);
      }
    }

    const currentBalance = await naoToken.balanceOf(to);
    const currentVotes = await naoToken.getVotes(to);
    console.log(
      `✓ Inviati ${ethers.formatEther(amount)} NAO a ${to} (Saldo: ${ethers.formatEther(currentBalance)} NAO | Voti: ${ethers.formatEther(currentVotes)})`
    );
  }

  if (process.env.TO) {
    console.log(`\n💡 Suggerimento per MetaMask (${process.env.TO}):`);
    console.log("Se hai appena ricevuto i token su MetaMask, ricordati di cliccare 'Attiva Potere di Voto (Self-Delegate)'");
    console.log("sulla Web App per attivare i voti con lo standard ERC20Votes!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
