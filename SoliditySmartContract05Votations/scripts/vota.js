// scripts/vota.js
// Script per votare una proposta
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni i parametri dallo script
    const idProposta = process.argv[4];
    const accountIndex = process.argv[5] || 1; // Usa account[1] se non specificato
    
    if (!idProposta) {
      console.error("Uso: truffle exec scripts/vota.js <idProposta> [indiceAccount]");
      callback("Parametri mancanti");
      return;
    }
    
    const accounts = await web3.eth.getAccounts();
    // Se è specificato un indirizzo completo, usalo, altrimenti usa l'indice
    const elettore = process.argv[5].startsWith('0x') ? process.argv[5] : accounts[accountIndex];
    //const elettore = accounts[accountIndex];
    
    console.log(`Votazione per la proposta ID ${idProposta} dall'account ${elettore}...`);
    
    // Verifica se l'elettore è registrato
    const elettoreDati = await votingInstance.elettori(elettore);
    
    if (!elettoreDati.iscritto) {
      console.error(`L'account ${elettore} non è registrato come elettore.`);
      callback("Elettore non registrato");
      return;
    }
    
    // Verifica se la proposta esiste
    try {
      await votingInstance.getDettagliProposta(idProposta);
    } catch (error) {
      console.error(`La proposta ID ${idProposta} non esiste.`);
      callback("Proposta non esistente");
      return;
    }
    
    // Verifica se l'elettore ha già votato per questa proposta
    const haGiaVotato = await votingInstance.haVotato(elettore, idProposta);
    
    if (haGiaVotato) {
      console.error(`L'elettore ha già votato per la proposta ID ${idProposta}.`);
      callback("Voto già espresso");
      return;
    }
    
    // Vota
    try {
      const result = await votingInstance.vota(idProposta, { from: elettore });
      console.log(`Voto per la proposta ID ${idProposta} registrato con successo! Tx: ${result.tx}`);
      
      // Ottieni i dettagli aggiornati della proposta
      const proposta = await votingInstance.getDettagliProposta(idProposta);
      console.log(`La proposta ha ora ${proposta.votiTotali.toString()} voti totali.`);
    } catch (error) {
      console.error(`Errore durante la votazione:`, error.message);
      callback(error);
      return;
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};