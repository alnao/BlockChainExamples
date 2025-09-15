// Script interattivo migliorato per GuessTheNumber
const { ethers } = require("hardhat");
const readline = require("readline");
const { loadDeployedAddresses } = require("./addresses");

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  let contract, token, addresses;
  
  try {
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
    token = await ethers.getContractAt("ERC20Mock", addresses.token);
    
    // Controlla balance token
    const balance = await token.balanceOf(user.address);
    console.log("💰 Token balance:", ethers.formatEther(balance), "TEST");
    
    // Controlla le fee
    const setFee = await contract.setFee();
    const guessFee = await contract.guessFee();
    console.log("💳 Set fee:", ethers.formatEther(setFee), "TEST");
    console.log("💳 Guess fee:", ethers.formatEther(guessFee), "TEST");
    
    console.log("\n⚠️  IMPORTANTE: Prima di giocare devi fare approve del contratto per l'importo richiesto!");
    console.log("📝 Il numero target è salvato come hash keccak256.");
    
  } catch (error) {
    console.error("❌ Errore nel caricamento degli indirizzi:", error.message);
    console.log("💡 Suggerimento: Esegui prima 'npx hardhat run scripts/deploy.js --network localhost'");
    return;
  }

  while (true) {
    console.log("\n🎯 Azioni disponibili:");
    console.log("1. 🎮 Avvia partita (startGame)");
    console.log("2. 🔄 Aggiorna numero (updateNumber)");
    console.log("3. 🎯 Prova a indovinare su tutti i game (guessAny)");
    console.log("4. 🏦 Admin preleva (adminWithdraw)");
    console.log("5. 📊 Stato contratto e partite attive");
    console.log("6. 🪙 Mostra info token e approva");
    console.log("7. 🎁 Trasferisci token ad altri account");
    console.log("0. 🚪 Esci");
    
        let userIndex = 0;
        let signers = await ethers.getSigners();
        while (true) {
          const user = signers[userIndex];
          const userBalance = await token.balanceOf(user.address);
          console.log("\n🎯 Azioni disponibili:");
          console.log(`👤 Account corrente: ${user.address} [${userIndex}] | 💰 Balance: ${ethers.formatEther(userBalance)} TEST`);
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

          try {
            if (choice === "8") {
              console.log("\n🔄 Seleziona account:");
              signers.forEach((s, i) => {
                console.log(`[${i}] ${s.address}`);
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
              const allowance = await token.allowance(user.address, addresses.game);
              const setFee = await contract.setFee();
              if (allowance < setFee) {
                console.log("❌ Allowance insufficiente!");
                console.log("💡 Usa l'opzione 6 per approvare prima i token");
                continue;
              }
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
              const allowance = await token.allowance(user.address, addresses.game);
              const setFee = await contract.setFee();
              if (allowance < setFee) {
                console.log("❌ Allowance insufficiente!");
                console.log("💡 Usa l'opzione 6 per approvare prima i token");
                continue;
              }
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
              const allowance = await token.allowance(user.address, addresses.game);
              const guessFee = await contract.guessFee();
              if (allowance < guessFee) {
                console.log("❌ Allowance insufficiente!");
                console.log("💡 Usa l'opzione 6 per approvare prima i token");
                continue;
              }
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
              console.log("💰 Admin balance:", ethers.formatEther(adminBalance), "TEST");
              console.log("💳 Set fee:", ethers.formatEther(setFee), "TEST");
              console.log("💳 Guess fee:", ethers.formatEther(guessFee), "TEST");
              try {
                const gameInfo = await contract.games(user.address);
                if (gameInfo.active) {
                  console.log("\n🎮 TUA PARTITA ATTIVA:");
                  console.log("🎯 Target hash:", gameInfo.target);
                  console.log("💰 Prize pool:", ethers.formatEther(gameInfo.prizePool), "TEST");
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
              console.log("💰 Il tuo balance:", ethers.formatEther(balance), "TEST");
              console.log("✅ Allowance attuale:", ethers.formatEther(allowance), "TEST");
              const approve = await prompt("💡 Vuoi approvare token? (s/n): ");
              if (approve.toLowerCase() === 's') {
                const amount = await prompt("💰 Quantità da approvare (in TEST): ");
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
                console.log("✅ Allowance aggiornata:", ethers.formatEther(allowance), "TEST");
              }
            } else if (choice === "7") {
              console.log("\n🎁 TRASFERIMENTO TOKEN:");
              const to = await prompt("📬 Indirizzo destinatario: ");
              const amount = await prompt("💰 Quantità da trasferire (in TEST): ");
              console.log("✅ Trasferendo token...");
              // Connetti il token all'account corrente selezionato
              const userToken = token.connect(user);
              const tx = await userToken.transfer(to, ethers.parseEther(amount));
              await tx.wait();
              console.log("🎉 Trasferimento completato!");
            } else if (choice === "0") {
              console.log("👋 Arrivederci!");
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });