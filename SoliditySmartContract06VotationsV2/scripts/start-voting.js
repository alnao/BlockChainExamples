// scripts/start-voting.js
// Script per chiudere la registrazione e iniziare la fase di votazione
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; // L'amministratore è il primo account
    
    // Ottieni i parametri
    const maxVotes = parseInt(process.argv[4] || "3"); // Numero massimo di voti per vincere
    
    console.log(`\n=== Inizio fase di votazione ===`);
    console.log(`Amministratore: ${admin}`);
    console.log(`Voti massimi richiesti: ${maxVotes}`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Verifica che sia in fase di registrazione
    const currentState = await votingInstance.getCurrentState();
    if (currentState != 1) { // 1 = Registration
      console.error("La votazione non è in fase di registrazione.");
      callback("Fase non valida");
      return;
    }
    
    // Ottieni l'ID della votazione corrente
    const votingId = await votingInstance.getCurrentVotingId();
    
    // Ottieni l'elenco dei candidati
    const candidateAddresses = await votingInstance.getCandidatesList(votingId);
    console.log(`Numero di candidati registrati: ${candidateAddresses.length}`);
    
    if (candidateAddresses.length < 2) {
      console.error("Sono necessari almeno due candidati per iniziare la votazione.");
      callback("Candidati insufficienti");
      return;
    }
    
    // Mostra i candidati registrati
    console.log(`\nCandidati registrati:`);
    for (let i = 0; i < candidateAddresses.length; i++) {
      const address = candidateAddresses[i];
      const details = await votingInstance.getCandidateDetails(votingId, address);
      console.log(`${i+1}. ${details.name} (${address.substring(0, 10)}...)`);
    }
    
    // Chiudi la registrazione e inizia la votazione
    console.log(`\nChiusura registrazione e inizio votazione...`);
    const result = await votingInstance.closeRegistrationAndStartVoting(
      maxVotes, 
      { from: admin }
    );
    
    console.log(`\n✅ Fase di votazione iniziata con successo!`);
    console.log(`ID votazione: ${votingId}`);
    console.log(`Transaction hash: ${result.tx}`);
    console.log(`Voti massimi richiesti: ${maxVotes}`);
    console.log(`Stato corrente: Votazione`);
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante l'inizio della fase di votazione:`, error);
    callback(error);
  }
};