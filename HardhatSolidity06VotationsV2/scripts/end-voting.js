// scripts/end-voting.js
// Script per terminare manualmente la votazione e determinare il vincitore
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; // L'amministratore è il primo account
    
    console.log(`\n=== Termine votazione ===`);
    console.log(`Amministratore: ${admin}`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Verifica che sia in fase di votazione
    const currentState = await votingInstance.getCurrentState();
    if (currentState != 2) { // 2 = Voting
      console.error("La votazione non è in fase di voto.");
      callback("Fase non valida");
      return;
    }
    
    // Ottieni l'ID della votazione corrente
    const votingId = await votingInstance.getCurrentVotingId();
    
    // Ottieni l'elenco dei candidati e i voti
    const candidateAddresses = await votingInstance.getCandidatesList(votingId);
    
    console.log(`\nStatistiche prima della terminazione:`);
    for (let i = 0; i < candidateAddresses.length; i++) {
      const address = candidateAddresses[i];
      const details = await votingInstance.getCandidateDetails(votingId, address);
      console.log(`${i+1}. ${details.name}: ${details.voteCount} voti`);
    }
    
    // Termina la votazione
    console.log(`\nTerminazione votazione in corso...`);
    const result = await votingInstance.endVoting({ from: admin });
    
    console.log(`\n✅ Votazione terminata con successo!`);
    console.log(`ID votazione: ${votingId}`);
    console.log(`Transaction hash: ${result.tx}`);
    
    // Ottieni i risultati
    const results = await votingInstance.getVotingResults(votingId);
    
    console.log(`\n🏆 Risultati finali:`);
    console.log(`Vincitore: ${results.winnerName} (${results.winner.substring(0, 10)}...)`);
    console.log(`Voti ottenuti: ${results.voteCount.toString()}`);
    console.log(`Voti totali: ${results.totalVotes.toString()}`);
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante la terminazione della votazione:`, error);
    callback(error);
  }
};