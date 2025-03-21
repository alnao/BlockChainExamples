
// scripts/delega-voto.js
// Script per delegare il proprio voto a un altro elettore
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni i parametri dallo script
    const indirizzoDelegato = process.argv[4];
    const accountIndex = process.argv[5] || 1; // Usa account[1] se non specificato
    
    if (!indirizzoDelegato) {
      console.error("Uso: truffle exec scripts/delega-voto.js <indirizzoDelegato> [indiceAccount]");
      callback("Parametri mancanti");
      return;
    }
    
    const accounts = await web3.eth.getAccounts();
    const elettore = accounts[accountIndex];
    
    console.log(`Delega del voto dall'account ${elettore} all'indirizzo ${indirizzoDelegato}...`);
    
    // Verifica se l'elettore è registrato
    const elettoreDati = await votingInstance.elettori(elettore);
    
    if (!elettoreDati.iscritto) {
      console.error(`L'account ${elettore} non è registrato come elettore.`);
      callback("Elettore non registrato");
      return;
    }
    
    // Verifica se il delegato è registrato
    const delegatoDati = await votingInstance.elettori(indirizzoDelegato);
    
    if (!delegatoDati.iscritto) {
      console.error(`L'indirizzo ${indirizzoDelegato} non è registrato come elettore.`);
      callback("Delegato non registrato");
      return;
    }
    
    // Esegui la delega
    try {
      const result = await votingInstance.delega(indirizzoDelegato, { from: elettore });
      console.log(`Delega completata con successo! Tx: ${result.tx}`);
      
      // Ottieni i pesi aggiornati
      const elettoreDatiNuovi = await votingInstance.elettori(elettore);
      const delegatoDatiNuovi = await votingInstance.elettori(indirizzoDelegato);
      
      console.log(`Peso elettore: ${elettoreDatiNuovi.peso.toString()}`);
      console.log(`Peso delegato: ${delegatoDatiNuovi.peso.toString()}`);
    } catch (error) {
      console.error(`Errore durante la delega:`, error.message);
      callback(error);
      return;
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};