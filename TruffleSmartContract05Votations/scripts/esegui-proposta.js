
// scripts/esegui-proposta.js
// Script per eseguire una proposta vincente
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni i parametri dallo script
    const idProposta = process.argv[4];
    const accountIndex = process.argv[5] || 0; // Usa account[0] se non specificato
    
    if (!idProposta) {
      console.error("Uso: truffle exec scripts/esegui-proposta.js <idProposta> [indiceAccount]");
      callback("Parametri mancanti");
      return;
    }
    
    const accounts = await web3.eth.getAccounts();
    const esecutore = accounts[accountIndex];
    
    console.log(`Esecuzione della proposta ID ${idProposta} dall'account ${esecutore}...`);
    
    // Verifica se le votazioni sono terminate
    const inizioVotazioni = await votingInstance.inizioVotazioni();
    const durataVotazioni = await votingInstance.durataVotazioni();
    const votoFinito = await votingInstance.votoFinito();
    
    const now = Math.floor(Date.now() / 1000);
    const fineVotazioni = parseInt(inizioVotazioni) + parseInt(durataVotazioni);
    
    if (now < fineVotazioni && !votoFinito) {
      console.error("Le votazioni sono ancora in corso. Impossibile eseguire la proposta.");
      callback("Votazioni in corso");
      return;
    }
    
    // Verifica se la proposta esiste
    try {
      const proposta = await votingInstance.getDettagliProposta(idProposta);
      
      if (proposta.eseguita) {
        console.error(`La proposta ID ${idProposta} è già stata eseguita.`);
        callback("Proposta già eseguita");
        return;
      }
    } catch (error) {
      console.error(`La proposta ID ${idProposta} non esiste.`);
      callback("Proposta non esistente");
      return;
    }
    
    // Esegui la proposta
    try {
      const result = await votingInstance.eseguiProposta(idProposta, { from: esecutore });
      console.log(`Proposta ID ${idProposta} eseguita con successo! Tx: ${result.tx}`);
    } catch (error) {
      console.error(`Errore durante l'esecuzione della proposta:`, error.message);
      callback(error);
      return;
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};
