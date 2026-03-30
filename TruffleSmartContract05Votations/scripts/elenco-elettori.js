// scripts/elenco-elettori.js
// Script per visualizzare l'elenco degli elettori registrati
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = async function(callback) {
  try {
    // Ottieni l'istanza del contratto
    const votingInstance = await SimpleVoting.deployed();
    console.log("Contratto di votazione trovato all'indirizzo:", votingInstance.address);
    
    // Ottieni l'elenco degli elettori
    const elencoElettori = await votingInstance.getElencoElettori();
    
    console.log(`\nElettori registrati: ${elencoElettori.length}`);
    console.log("------------------------------------------");
    
    if (elencoElettori.length === 0) {
      console.log("Nessun elettore registrato.");
      callback();
      return;
    }
    
    // Ottieni il presidente per evidenziarlo
    const presidente = await votingInstance.presidente();
    
    // Per ogni elettore, mostra informazioni dettagliate
    for (let i = 0; i < elencoElettori.length; i++) {
      const indirizzo = elencoElettori[i];
      const elettore = await votingInstance.elettori(indirizzo);
      const isPredidente = (indirizzo === presidente);
      const proposteVotate = await votingInstance.getProposteVotate(indirizzo);
      
      console.log(`Elettore #${i+1}: ${indirizzo} ${isPredidente ? '(Presidente)' : ''}`);
      console.log(`  Peso: ${elettore.peso.toString()}`);
      
      if (proposteVotate.length > 0) {
        console.log(`  Proposte votate: ${proposteVotate.map(id => id.toString()).join(', ')}`);
        
        // Per ogni proposta votata, mostra i dettagli
        for (const idProposta of proposteVotate) {
          try {
            const dettagliProposta = await votingInstance.getDettagliProposta(idProposta);
            console.log(`    - ID ${idProposta}: "${dettagliProposta.descrizione}" (${dettagliProposta.votiTotali} voti)`);
          } catch (e) {
            console.log(`    - ID ${idProposta}: Impossibile ottenere dettagli`);
          }
        }
      } else if (elettore.peso.toString() === '0') {
        console.log(`  Stato: Ha delegato il suo voto (peso = 0)`);
      } else {
        console.log(`  Stato: Non ha ancora votato`);
      }
      
      console.log("------------------------------------------");
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'esecuzione dello script:", error);
    callback(error);
  }
};