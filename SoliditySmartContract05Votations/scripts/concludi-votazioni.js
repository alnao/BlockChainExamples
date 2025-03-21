
// scripts/concludi-votazioni.js
// Script per concludere anticipatamente le votazioni
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const presidente = accounts[0];
    
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Verifica se le votazioni sono già finite
    const votoFinito = await votingInstance.votoFinito();
    
    if (votoFinito) {
      console.log("Le votazioni sono già concluse.");
      callback();
      return;
    }
    
    // Conclude le votazioni
    console.log("Conclusione anticipata delle votazioni...");
    
    try {
      const result = await votingInstance.concludiVotazioni({ from: presidente });
      console.log(`Votazioni concluse con successo! Tx: ${result.tx}`);
    } catch (error) {
      console.error(`Errore durante la conclusione delle votazioni:`, error.message);
      callback(error);
      return;
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};