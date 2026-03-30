// scripts/vote.js
// Script per votare un candidato
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    // Ottieni i parametri
    const candidateIndex = parseInt(process.argv[4] || "1"); // Indice del candidato da votare (1-based)
    const voterAccountIndex = parseInt(process.argv[5] || "3"); // Indice dell'account del votante (default: 3)
    
    const accounts = await web3.eth.getAccounts();
    const voter = accounts[voterAccountIndex];
    
    console.log(`\n=== Votazione ===`);
    console.log(`Indirizzo votante: ${voter}`);
    
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
    
    // Verifica che il votante non abbia già votato
    const hasVoted = await votingInstance.hasVoted(votingId, voter);
    if (hasVoted) {
      console.error("Hai già votato in questa sessione.");
      callback("Hai già votato");
      return;
    }
    
    // Ottieni l'elenco dei candidati
    const candidateAddresses = await votingInstance.getCandidatesList(votingId);
    
    if (candidateIndex <= 0 || candidateIndex > candidateAddresses.length) {
      console.error(`Indice candidato non valido. Scegli un numero tra 1 e ${candidateAddresses.length}.`);
      callback("Indice non valido");
      return;
    }
    
    const candidateAddress = candidateAddresses[candidateIndex - 1];
    const candidateDetails = await votingInstance.getCandidateDetails(votingId, candidateAddress);
    
    console.log(`Candidato scelto: ${candidateDetails.name} (${candidateAddress.substring(0, 10)}...)`);
    
    // Ottieni la commissione di voto
    const votingFee = await votingInstance.votingFee();
    console.log(`Commissione di voto: ${web3.utils.fromWei(votingFee, "ether")} ETH`);
    
    // Verifica il saldo del votante
    const balance = await web3.eth.getBalance(voter);
    if (new web3.utils.BN(balance).lt(new web3.utils.BN(votingFee))) {
      console.error(`Il votante non ha fondi sufficienti. Saldo: ${web3.utils.fromWei(balance, "ether")} ETH`);
      callback("Fondi insufficienti");
      return;
    }
    
    // Esegui il voto
    console.log(`Votazione in corso...`);
    const result = await votingInstance.vote(
      candidateAddress,
      { from: voter, value: votingFee }
    );
    
    console.log(`\n✅ Voto registrato con successo!`);
    console.log(`ID votazione: ${votingId}`);
    console.log(`Transaction hash: ${result.tx}`);
    
    // Verifica se la votazione è stata completata automaticamente
    const newState = await votingInstance.getCurrentState();
    if (newState == 0) { // 0 = Inactive (votazione completata)
      console.log(`\n🏆 La votazione è stata completata automaticamente!`);
      console.log(`Il candidato ha raggiunto il numero massimo di voti richiesti.`);
      
      // Ottieni i risultati
      const results = await votingInstance.getVotingResults(votingId);
      console.log(`Vincitore: ${results.winnerName} (${results.winner.substring(0, 10)}...)`);
      console.log(`Voti ottenuti: ${results.voteCount.toString()}`);
    } else {
      // Ottieni il conteggio dei voti aggiornato
      const updatedDetails = await votingInstance.getCandidateDetails(votingId, candidateAddress);
      console.log(`Voti attuali per ${candidateDetails.name}: ${updatedDetails.voteCount.toString()}`);
    }
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante la votazione:`, error);
    callback(error);
  }
};