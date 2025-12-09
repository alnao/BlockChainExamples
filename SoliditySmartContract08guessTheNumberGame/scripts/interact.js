// Script interattivo migliorato per GuessTheNumber
const { ethers } = require("hardhat");
const readline = require("readline");
const { loadDeployedAddresses } = require("./addresses");

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
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
    // Carica automaticamente gli indirizzi dall'ultimo deploy
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
    
    // Controlla balance token
    const balance = await token.balanceOf(user.address);
    console.log("💰 Token balance:", ethers.formatEther(balance), "NAO");
    
    // Controlla le fee
    const setFee = await contract.setFee();
    const guessFee = await contract.guessFee();
    console.log("💳 Set fee:", ethers.formatEther(setFee), "NAO");
    console.log("💳 Guess fee:", ethers.formatEther(guessFee), "NAO");
    
    console.log("\n⚠️  IMPORTANTE: Prima di giocare devi fare approve del contratto per l'importo richiesto!");
    console.log("📝 Il numero target è salvato come hash keccak256.");
    
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
    console.log("\n🎯 Azioni disponibili:");
    console.log(`👤 Account corrente: ${user.address} [${userIndex}] | 💰 Balance: ${ethers.formatEther(userBalance)} NAO`);
    console.log("1. 🎮 Avvia partita (startGame)");
    console.log("2. 🔄 Aggiorna numero (updateNumber)");
    console.log("3. 🎯 Prova a indovinare su tutti i game (guessAny)");
    console.log("4. 🏦 Admin preleva (adminWithdraw)");
    console.log("5. 📊 Stato contratto e partite attive");
    console.log("6. 🪙 Mostra info token e approva");
    console.log("7. 🎁 Trasferisci token ad altri account");
    console.log("8. 🔄 Cambia account");
    console.log("0. 🚪 Esci");
    
    const choice = await prompt("Scegli azione [0-8]: ");
    console.log("-------------------------------");
    try {
      if (choice === "8") {
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
        let number;
        while (true) {
          number = await prompt("🔢 Numero da impostare (esattamente 20 cifre): ");
          if (!/^[0-9]{20}$/.test(number)) {
            console.log("❌ Il numero deve essere di 20 cifre decimali!");
            continue;
          }
          break;
        }
        console.log("⏳ Controllando allowance...");
        const setFee = await contract.setFee();
        if (!(await ensureAllowance(token, user, addresses.game, setFee, prompt))) continue;
        console.log("✅ Avviando partita...");
        try {
          // Connetti il contratto all'account corrente selezionato
          const userContract = contract.connect(user);
          const tx = await userContract.startGame(BigInt(number));
          await tx.wait();
          console.log("🎉 Partita avviata con successo!");
        } catch (err) {
          console.log("❌ Errore: ", err.message);
        }
      } else if (choice === "2") {
        let number;
        while (true) {
          number = await prompt("🔢 Nuovo numero (esattamente 20 cifre): ");
          if (!/^[0-9]{20}$/.test(number)) {
            console.log("❌ Il numero deve essere di 20 cifre decimali!");
            continue;
          }
          break;
        }
        console.log("⏳ Controllando allowance...");
        const setFee = await contract.setFee();
        if (!(await ensureAllowance(token, user, addresses.game, setFee, prompt))) continue;
        console.log("✅ Aggiornando numero...");
        try {
          // Connetti il contratto all'account corrente selezionato
          const userContract = contract.connect(user);
          const tx = await userContract.updateNumber(BigInt(number));
          await tx.wait();
          console.log("🎉 Numero aggiornato!");
        } catch (err) {
          console.log("❌ Errore: ", err.message);
        }
      } else if (choice === "3") {
        let guess;
        while (true) {
          guess = await prompt("🎯 Numero da indovinare (esattamente 20 cifre): ");
          if (!/^[0-9]{20}$/.test(guess)) {
            console.log("❌ Il numero deve essere di 20 cifre decimali!");
            continue;
          }
          break;
        }
        console.log("⏳ Controllando allowance...");
        const guessFee = await contract.guessFee();
        if (!(await ensureAllowance(token, user, addresses.game, guessFee, prompt))) continue;
        console.log("✅ Tentando su tutti i game...");
        try {
          // Connetti il contratto all'account corrente selezionato
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
              // Ignora log che non sono del nostro contratto
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
        const to = await prompt("💼 Indirizzo destinatario: ");
        const amount = await prompt("💰 Importo da prelevare: ");
        console.log("✅ Prelevando fondi admin...");
        const tx = await contract.adminWithdraw(to, ethers.parseEther(amount));
        await tx.wait();
        console.log("🎉 Prelievo admin completato!");
      } else if (choice === "5") {
        console.log("\n📊 STATO CONTRATTO:");
        const admin = await contract.admin();
        const adminBalance = await contract.adminBalance();
        const setFee = await contract.setFee();
        const guessFee = await contract.guessFee();
        console.log("👑 Admin:", admin);
        console.log("💰 Admin balance:", ethers.formatEther(adminBalance), "NAO");
        console.log("💳 Set fee:", ethers.formatEther(setFee), "NAO");
        console.log("💳 Guess fee:", ethers.formatEther(guessFee), "NAO");
        try {
          const gameInfo = await contract.games(user.address);
          if (gameInfo.active) {
            console.log("\n🎮 TUA PARTITA ATTIVA:");
            console.log("🎯 Target hash:", gameInfo.target);
            console.log("💰 Prize pool:", ethers.formatEther(gameInfo.prizePool), "NAO");
          } else {
            console.log("\n🚫 Non hai partite attive");
          }
        } catch (error) {
          console.log("\n❌ Errore nel controllare la tua partita:", error.message);
        }
      } else if (choice === "6") {
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
            // Connetti il token all'account corrente selezionato
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
      } else if (choice === "7") {
        console.log("\n🎁 TRASFERIMENTO TOKEN:");
        const to = await prompt("📬 Indirizzo destinatario: ");
        const amount = await prompt("💰 Quantità da trasferire (in NAO): ");
        console.log("✅ Trasferendo token...");
        // Connetti il token all'account corrente selezionato
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
      if (error.message.includes("NotSetter")) {
        console.log("💡 Solo il setter può aggiornare il proprio numero");
      } else if (error.message.includes("NoActiveGame")) {
        console.log("💡 Non hai partite attive");
      } else if (error.message.includes("NotAdmin")) {
        console.log("💡 Solo l'admin può eseguire questa operazione");
      }

    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });