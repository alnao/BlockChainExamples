// scripts/aggiungi-proposte.js
// Script per aggiungere nuove proposte
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const presidente = accounts[0];
    
    console.log("Account presidente:", presidente);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni le proposte da aggiungere come argomenti
    const proposte = process.argv.slice(4);
    
    if (proposte.length === 0) {
      console.log("Nessuna proposta specificata. Uso proposte predefinite...");
      proposte.push("Proposta di test #1: Aumentare il budget");
      proposte.push("Proposta di test #2: Ridurre le tasse");
      proposte.push("Proposta di test #3: Migliorare le infrastrutture");
    }
    
    console.log(`Aggiunta di ${proposte.length} proposte...`);
    
    // Verifica se le votazioni sono attive
    const inizioVotazioni = await votingInstance.inizioVotazioni();
    const durataVotazioni = await votingInstance.durataVotazioni();
    const votoFinito = await votingInstance.votoFinito();
    
    const now = Math.floor(Date.now() / 1000);
    const fineVotazioni = parseInt(inizioVotazioni) + parseInt(durataVotazioni);
    
    if (now >= fineVotazioni || votoFinito) {
      console.log("Le votazioni sono terminate. Impossibile aggiungere nuove proposte.");
      callback();
      return;
    }
    
    for (const descrizione of proposte) {
      try {
        // Aggiungi la proposta
        const result = await votingInstance.aggiungiProposta(descrizione, { from: presidente });
        
        // Ottieni l'ID della proposta dall'evento
        const idProposta = result.logs.find(log => log.event === 'PropostaAggiunta').args.idProposta.toString();
        
        console.log(`Proposta "${descrizione}" aggiunta con successo! ID: ${idProposta}, Tx: ${result.tx}`);
      } catch (error) {
        console.error(`Errore durante l'aggiunta della proposta "${descrizione}":`, error.message);
      }
    }
    
    console.log("Aggiunta proposte completata.");
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};
