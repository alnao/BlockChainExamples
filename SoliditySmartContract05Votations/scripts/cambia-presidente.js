// scripts/cambia-presidente.js
// Script per cambiare il presidente del sistema di votazione
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni gli account
    const accounts = await web3.eth.getAccounts();
    const presidenteAttuale = accounts[0]; // Assume che l'account 0 sia il presidente attuale
    
    // Ottieni l'indirizzo del nuovo presidente dagli argomenti
    const nuovoPresidenteIndirizzo = process.argv[4];
    
    if (!nuovoPresidenteIndirizzo) {
      console.error("Uso: truffle exec scripts/cambia-presidente.js <indirizzo-nuovo-presidente>");
      callback("Indirizzo nuovo presidente mancante");
      return;
    }
    
    // Valida l'indirizzo
    if (!web3.utils.isAddress(nuovoPresidenteIndirizzo)) {
      console.error("L'indirizzo fornito non è un indirizzo Ethereum valido");
      callback("Indirizzo non valido");
      return;
    }
    
    console.log("Presidente attuale:", presidenteAttuale);
    console.log("Nuovo presidente:", nuovoPresidenteIndirizzo);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Verifica che chi esegue lo script sia effettivamente il presidente
    const presidenteContratto = await votingInstance.presidente();
    
    if (presidenteContratto.toLowerCase() !== presidenteAttuale.toLowerCase()) {
      console.error("L'account che esegue lo script non è il presidente attuale del contratto.");
      console.error("Presidente nel contratto:", presidenteContratto);
      console.error("Account corrente:", presidenteAttuale);
      callback("Non autorizzato");
      return;
    }
    
    // Esegui la transazione per cambiare il presidente
    console.log("Esecuzione del cambio presidente...");
    
    try {
      // Controlla se la funzione cambiaPresidente esiste nel contratto
      if (typeof votingInstance.cambiaPresidente !== 'function') {
        console.error("La funzione 'cambiaPresidente' non esiste nel contratto.");
        console.error("Devi prima aggiornare il contratto con questa funzionalità.");
        callback("Funzione non implementata");
        return;
      }
      
      const result = await votingInstance.cambiaPresidente(nuovoPresidenteIndirizzo, { from: presidenteAttuale });
      console.log("Presidente cambiato con successo!");
      console.log("Hash transazione:", result.tx);
      
      // Verifica che il cambio sia avvenuto correttamente
      const nuovoPresidenteContratto = await votingInstance.presidente();
      console.log("Nuovo presidente verificato nel contratto:", nuovoPresidenteContratto);
      
      if (nuovoPresidenteContratto.toLowerCase() === nuovoPresidenteIndirizzo.toLowerCase()) {
        console.log("✅ Cambio presidente completato con successo!");
      } else {
        console.log("⚠️ Il cambio presidente sembra non essere stato effettivo. Verifica il contratto.");
      }
    } catch (error) {
      console.error("Errore durante il cambio presidente:", error.message);
      
      // Fornisci un messaggio più descrittivo a seconda dell'errore
      if (error.message.includes("revert")) {
        console.error("La transazione è stata annullata. Possibili cause:");
        console.error("- L'indirizzo fornito potrebbe essere uguale al presidente attuale");
        console.error("- L'indirizzo potrebbe essere l'indirizzo zero (0x0)");
        console.error("- Potresti non avere i permessi necessari");
      }
      
      callback(error);
      return;
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};