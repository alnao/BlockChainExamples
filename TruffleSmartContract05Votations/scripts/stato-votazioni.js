// scripts/stato-votazioni.js
// Script per visualizzare lo stato attuale delle votazioni
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni i dati sul presidente
    const presidente = await votingInstance.presidente();
    console.log(`Presidente: ${presidente}`);
    
    // Ottieni i dati sulle tempistiche
    const inizioVotazioni = await votingInstance.inizioVotazioni();
    const durataVotazioni = await votingInstance.durataVotazioni();
    const votoFinito = await votingInstance.votoFinito();
    
    const now = Math.floor(Date.now() / 1000);
    const fineVotazioni = parseInt(inizioVotazioni) + parseInt(durataVotazioni);
    
    console.log(`\nTempistiche di votazione:`);
    console.log(`- Inizio: ${new Date(inizioVotazioni * 1000).toLocaleString()}`);
    console.log(`- Fine: ${new Date(fineVotazioni * 1000).toLocaleString()}`);
    
    if (now < fineVotazioni && !votoFinito) {
      const tempoRimanente = fineVotazioni - now;
      const ore = Math.floor(tempoRimanente / 3600);
      const minuti = Math.floor((tempoRimanente % 3600) / 60);
      console.log(`- Stato: ATTIVO (${ore} ore e ${minuti} minuti rimanenti)`);
    } else {
      console.log(`- Stato: TERMINATO`);
    }
    
    // Ottieni le proposte
    const numProposte = await votingInstance.getNumeroProposte();
    console.log(`\nProposte totali: ${numProposte.toString()}`);
    
    if (numProposte > 0) {
      console.log("\nDettagli proposte:");
      
      // Crea un array per ordinare le proposte per voti
      let proposte = [];
      
      for (let i = 0; i < numProposte; i++) {
        const proposta = await votingInstance.getDettagliProposta(i);
        proposte.push({
          id: proposta.id.toString(),
          descrizione: proposta.descrizione,
          votiTotali: proposta.votiTotali.toString(),
          eseguita: proposta.eseguita
        });
      }
      
      // Ordina le proposte per voti (decrescente)
      proposte.sort((a, b) => parseInt(b.votiTotali) - parseInt(a.votiTotali));
      
      // Mostra le proposte
      for (const proposta of proposte) {
        console.log(`\nID: ${proposta.id}`);
        console.log(`- Descrizione: ${proposta.descrizione}`);
        console.log(`- Voti totali: ${proposta.votiTotali}`);
        console.log(`- Eseguita: ${proposta.eseguita ? 'Sì' : 'No'}`);
        
        if (proposte[0].id === proposta.id && parseInt(proposta.votiTotali) > 0) {
          console.log(`- Stato: VINCENTE 🏆`);
        }
      }
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};