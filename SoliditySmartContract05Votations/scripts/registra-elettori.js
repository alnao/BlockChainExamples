// scripts/registra-elettori.js
// Script per registrare nuovi elettori
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const presidente = accounts[0];
    
    console.log("Account presidente:", presidente);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni gli indirizzi da registrare
    let indirizzi = [];
    
    // Se vengono forniti indirizzi come argomenti, usali
    if (process.argv.length > 4) {
      indirizzi = process.argv.slice(4);
    } else {
      // Altrimenti, usa gli account di test da 1 a 3
      indirizzi = accounts.slice(1, 4);
    }
    
    console.log(`Registrazione di ${indirizzi.length} elettori...`);
    
    for (const indirizzo of indirizzi) {
      try {
        // Verifica se l'elettore è già registrato
        const elettore = await votingInstance.elettori(indirizzo);
        
        if (elettore.iscritto) {
          console.log(`L'elettore ${indirizzo} è già registrato.`);
          continue;
        }
        
        // Registra l'elettore
        const result = await votingInstance.registraElettore(indirizzo, { from: presidente });
        console.log(`Elettore ${indirizzo} registrato con successo! Tx: ${result.tx}`);
      } catch (error) {
        console.error(`Errore durante la registrazione dell'elettore ${indirizzo}:`, error.message);
      }
    }
    
    console.log("Registrazione elettori completata.");
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};