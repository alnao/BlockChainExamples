// Script interattivo migliorato per GuessTheNumber
const { ethers } = require("hardhat");
const readline = require("readline");
const { loadDeployedAddresses } = require("./addresses");

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function promptNumber(question) {
  while (true) {
    const input = await prompt(question);
    const trimmed = input.trim();
    if (!/^[0-9]{1,20}$/.test(trimmed)) {
      console.log("❌ Inserisci solo cifre numeriche (massimo 20 cifre)!");
      continue;
    }
    const padded = trimmed.padEnd(20, '0');
    if (BigInt(padded) < 10n ** 19n) {
      console.log("❌ Il numero non può iniziare per 0 (deve essere >= 10^19 dopo il padding)!");
      continue;
    }
    if (padded !== trimmed) {
      console.log(`💡 Numero completato a 20 cifre (zeri a destra): ${padded}`);
    }
    return padded;
  }
}

async function ensureAllowance(token, user, spender, amount, promptFunc) {
  const allowance = await token.allowance(user.address, spender);
  if (allowance < amount) {
    console.log(`⚠️ Allowance insufficiente: approvato ${ethers.formatEther(allowance)} NAO, richiesto ${ethers.formatEther(amount)} NAO`);
    const ans = await promptFunc(`💡 Vuoi approvare ${ethers.formatEther(amount)} NAO ora? (s/n): `);
    if (ans.toLowerCase() === 's') {
      console.log("✅ Approvando token...");
      const tx = await token.connect(user).approve(spender, amount);
      await tx.wait();
      console.log("🎉 Approvazione completata!");
      return true;
    }
    console.log("❌ Operazione annullata.");
    return false;
  }
  return true;
}

async function main() {
  let contract, token, addresses;
  let running = true;
  try {
    console.clear();
    addresses = loadDeployedAddresses();
    console.log("📍 Indirizzi caricati dall'ultimo deploy:");
    console.log("   Token:", addresses.token);
    console.log("   Game:", addresses.game);
    console.log("   Network:", addresses.network);
    console.log("   Deploy time:", addresses.timestamp);
    
    const [user] = await ethers.getSigners();
    console.log("👤 Account corrente:", user.address);
    
    contract = await ethers.getContractAt("GuessTheNumberMulti", addresses.game);
    token = await ethers.getContractAt("NAOTOKENERC20", addresses.token);
    
    const balance = await token.balanceOf(user.address);
    console.log("💰 Token balance:", ethers.formatEther(balance), "NAO");
    
    const setFee = await contract.setFee();
    const guessFee = await contract.guessFee();
    console.log("💳 Set fee:", ethers.formatEther(setFee), "NAO");
    console.log("💳 Guess fee:", ethers.formatEther(guessFee), "NAO");
    
    console.log("\n⚠️  IMPORTANTE: Prima di giocare devi fare approve del contratto per l'importo richiesto!");
    console.log("📝 I numeri inseriti vengono automaticamente completati a 20 cifre aggiungendo zeri a destra se inserite meno cifre.");
    
  } catch (error) {
    console.error("❌ Errore nel caricamento degli indirizzi:", error.message);
    console.log("💡 Suggerimento: controlla il deploy dello smart contract");
    return;
  }
  
  let userIndex = 0;
  let signers = await ethers.getSigners();

  while (running) {
    if (running){
      const choice = await prompt("Premi [invio] per continuare ");
      console.clear();
    }
    const user = signers[userIndex];
    const userBalance = await token.balanceOf(user.address);
    const activeCount = await contract.getActiveSettersCount();
    console.log("\n🎯 Azioni disponibili:");
    console.log(`👤 Account corrente: ${user.address} [${userIndex}] | 💰 Balance: ${ethers.formatEther(userBalance)} NAO | Partite attive: ${activeCount}`);
    console.log("1. 🎮 Avvia partita (startGame)");
    console.log("2. 🔄 Aggiorna numero (updateNumber)");
    console.log("3. 🎯 Prova a indovinare diretto (guessAny)");
    console.log("4. 🔒 Commit tentativo indovinare (commitGuess)");
    console.log("5. 🔓 Reveal tentativo indovinare (revealGuess)");
    console.log("6. 🚫 Cancella partita inattiva dopo 30 giorni (cancelGame)");
    console.log("7. 🏦 Admin preleva (adminWithdraw)");
    console.log("8. 📊 Stato contratto e partite attive");
    console.log("9. 🪙 Mostra info token e approva");
    console.log("10. 🎁 Trasferisci token ad altri account");
    console.log("11. 🔄 Cambia account");
    console.log("0. 🚪 Esci");
    
    const choice = await prompt("Scegli azione [0-11]: ");
    console.log("-------------------------------");
    try {
      if (choice === "11") {
        console.log("\n🔄 Seleziona account:");
        console.log("⏳ Recupero dati account...");
        const accountsData = await Promise.all(signers.map(async (s, i) => {
            const bal = await token.balanceOf(s.address);
            const all = await token.allowance(s.address, addresses.game);
            return {
                index: i,
                address: s.address,
                balance: ethers.formatEther(bal),
                allowance: ethers.formatEther(all)
            };
        }));
        
        accountsData.forEach((d) => {
          console.log(`[${d.index}] ${d.address} | 💰 ${d.balance} NAO | ✅ Approved: ${d.allowance} NAO`);
        });

        const idx = await prompt("Numero account [0-9]: ");
        const idxNum = Number(idx);
        if (!isNaN(idxNum) && idxNum >= 0 && idxNum < signers.length) {
          userIndex = idxNum;
          console.log(`✅ Account cambiato: ${signers[userIndex].address}`);
        } else {
          console.log("❌ Indice non valido!");
        }
        continue;
      }
      if (choice === "1") {
        const number = await promptNumber("🔢 Numero da impostare (es. 42 o fino a 20 cifre): ");
        console.log("⏳ Controllando allowance...");
        const setFee = await contract.setFee();
        if (!(await ensureAllowance(token, user, addresses.game, setFee, prompt))) continue;
        console.log("✅ Avviando partita...");
        try {
          const userContract = contract.connect(user);
          const tx = await userContract.startGame(BigInt(number));
          await tx.wait();
          console.log("🎉 Partita avviata con successo!");
        } catch (err) {
          console.log("❌ Errore: ", err.message);
        }
      } else if (choice === "2") {
        const number = await promptNumber("🔢 Nuovo numero (es. 42 o fino a 20 cifre): ");
        console.log("⏳ Controllando allowance...");
        const setFee = await contract.setFee();
        if (!(await ensureAllowance(token, user, addresses.game, setFee, prompt))) continue;
        console.log("✅ Aggiornando numero...");
        try {
          const userContract = contract.connect(user);
          const tx = await userContract.updateNumber(BigInt(number));
          await tx.wait();
          console.log("🎉 Numero aggiornato!");
        } catch (err) {
          console.log("❌ Errore: ", err.message);
        }
      } else if (choice === "3") {
        const guess = await promptNumber("🎯 Numero da indovinare (es. 42 o fino a 20 cifre): ");
        console.log("⏳ Controllando allowance...");
        const guessFee = await contract.guessFee();
        if (!(await ensureAllowance(token, user, addresses.game, guessFee, prompt))) continue;
        console.log("✅ Tentando su tutti i game...");
        try {
          const userContract = contract.connect(user);
          const tx = await userContract.guessAny(BigInt(guess));
          const receipt = await tx.wait();
          let hasWon = false;
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed && parsed.name === "Won") {
                hasWon = true;
                break;
              }
            } catch {
              // Ignora log non pertinenti
            }
          }
          if (hasWon) {
            console.log("🎉🎉🎉 HAI VINTO! 🎉🎉🎉");
          } else {
            console.log("😔 Non hai indovinato nessuna partita");
          }
        } catch (err) {
          console.log("❌ Errore: ", err.message);
        }
      } else if (choice === "4") {
        const guessStr = await promptNumber("🎯 Numero ipotizzato (es. 42 o fino a 20 cifre): ");
        const saltStr = await prompt("🔑 Salt segreto (stringa): ");
        const salt = ethers.keccak256(ethers.toUtf8Bytes(saltStr));
        const commitmentHash = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes32"],
          [user.address, BigInt(guessStr), salt]
        );
        const guessFee = await contract.guessFee();
        if (!(await ensureAllowance(token, user, addresses.game, guessFee, prompt))) continue;
        console.log("✅ Inviando commitment...");
        const userContract = contract.connect(user);
        const tx = await userContract.commitGuess(commitmentHash);
        await tx.wait();
        console.log("🎉 Commitment inviato! Attendi almeno 1 blocco prima di fare il reveal.");
      } else if (choice === "5") {
        const guessStr = await promptNumber("🎯 Numero ipotizzato (es. 42 o fino a 20 cifre): ");
        const saltStr = await prompt("🔑 Salt segreto usato nel commit: ");
        const salt = ethers.keccak256(ethers.toUtf8Bytes(saltStr));
        console.log("✅ Rivelando tentativo...");
        try {
          const userContract = contract.connect(user);
          const tx = await userContract.revealGuess(BigInt(guessStr), salt);
          const receipt = await tx.wait();
          let hasWon = false;
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed && parsed.name === "Won") {
                hasWon = true;
                break;
              }
            } catch { }
          }
          if (hasWon) {
            console.log("🎉🎉🎉 HAI VINTO (Reveal)! 🎉🎉🎉");
          } else {
            console.log("😔 Tentativo errato (Reveal)");
          }
        } catch (err) {
          console.log("❌ Errore reveal: ", err.message);
        }
      } else if (choice === "6") {
        console.log("✅ Tentativo di cancellazione partita inattiva...");
        try {
          const userContract = contract.connect(user);
          const tx = await userContract.cancelGame();
          await tx.wait();
          console.log("🎉 Partita cancellata e prize pool rimborsato!");
        } catch (err) {
          console.log("❌ Errore cancellazione: ", err.message);
        }
      } else if (choice === "7") {
        const to = await prompt("💼 Indirizzo destinatario: ");
        const amount = await prompt("💰 Importo da prelevare: ");
        console.log("✅ Prelevando fondi admin...");
        const userContract = contract.connect(user);
        const tx = await userContract.adminWithdraw(to, ethers.parseEther(amount));
        await tx.wait();
        console.log("🎉 Prelievo admin completato!");
      } else if (choice === "8") {
        console.log("\n📊 STATO CONTRATTO:");
        const admin = await contract.admin();
        const adminBalance = await contract.adminBalance();
        const setFee = await contract.setFee();
        const guessFee = await contract.guessFee();
        const activeCount = await contract.getActiveSettersCount();
        console.log("👑 Admin:", admin);
        console.log("💰 Admin balance:", ethers.formatEther(adminBalance), "NAO");
        console.log("💳 Set fee:", ethers.formatEther(setFee), "NAO");
        console.log("💳 Guess fee:", ethers.formatEther(guessFee), "NAO");
        console.log("🎮 Partite attive totali:", activeCount.toString());
        try {
          const gameInfo = await contract.games(user.address);
          if (gameInfo.active) {
            console.log("\n🎮 TUA PARTITA ATTIVA:");
            console.log("🎯 Target hash:", gameInfo.target);
            console.log("💰 Prize pool:", ethers.formatEther(gameInfo.prizePool), "NAO");
            console.log("📅 Creata il:", new Date(Number(gameInfo.createdAt) * 1000).toLocaleString());
          } else {
            console.log("\n🚫 Non hai partite attive");
          }
        } catch (error) {
          console.log("\n❌ Errore nel controllare la tua partita:", error.message);
        }
      } else if (choice === "9") {
        console.log("\n🪙 INFORMAZIONI TOKEN:");
        const balance = await token.balanceOf(user.address);
        let allowance = await token.allowance(user.address, addresses.game);
        console.log("💰 Il tuo balance:", ethers.formatEther(balance), "NAO");
        console.log("✅ Allowance attuale:", ethers.formatEther(allowance), "NAO");
        const approve = await prompt("💡 Vuoi approvare token? (s/n): ");
        if (approve.toLowerCase() === 's') {
          const amount = await prompt("💰 Quantità da approvare (in NAO): ");
          console.log("✅ Approvando token...");
          try {
            const userToken = token.connect(user);
            const tx = await userToken.approve(addresses.game, ethers.parseEther(amount));
            await tx.wait();
            console.log("🎉 Approvazione completata!");
          } catch (err) {
            console.error("❌ Errore durante l'approvazione:", err.message);
          }
          allowance = await token.allowance(user.address, addresses.game);
          console.log("✅ Allowance aggiornata:", ethers.formatEther(allowance), "NAO");
        }
      } else if (choice === "10") {
        console.log("\n🎁 TRASFERIMENTO TOKEN:");
        const to = await prompt("📬 Indirizzo destinatario: ");
        const amount = await prompt("💰 Quantità da trasferire (in NAO): ");
        console.log("✅ Trasferendo token...");
        const userToken = token.connect(user);
        const tx = await userToken.transfer(to, ethers.parseEther(amount));
        await tx.wait();
        console.log("🎉 Trasferimento completato!");
      } else if (choice === "0") {
        console.log("👋 Arrivederci!");
        running = false;
        break;
      } else {
        console.log("❌ Opzione non valida!");
      }
    } catch (error) {
      console.error("❌ Errore:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });