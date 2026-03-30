// scripts/get-voting-stats.js
// Script per visualizzare lo stato corrente della votazione
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    
    console.log(`\n=== Statistiche votazione ===`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Ottieni l'admin del contratto
    const admin = await votingInstance.admin();
    console.log(`Amministratore: ${admin}`);
    
    // Ottieni lo stato corrente
    const currentState = await votingInstance.getCurrentState();
    const stateNames = ["Inattivo", "Registrazione", "Votazione", "Completato"];
    console.log(`Stato corrente: ${stateNames[currentState]}`);
    
    // Se non ci sono votazioni attive, mostra le votazioni passate
    if (currentState == 0) { // Inactive
      const pastVotingIds = await votingInstance.getPastVotingSessions();
      
      if (pastVotingIds.length == 0) {
        console.log(`\nNessuna votazione passata trovata.`);
        callback();
        return;
      }
      
      console.log(`\nVotazioni passate: ${pastVotingIds.length}`);
      
      // Ottieni i risultati di tutte le votazioni passate
      const pastResults = await votingInstance.getAllPastVotingResults();
      
      console.log(`\nRisultati delle votazioni passate:`);
      for (let i = 0; i < pastResults.votingIds.length; i++) {
        const id = pastResults.votingIds[i].toString();
        const title = pastResults.titles[i];
        const winner = pastResults.winners[i];
        const winnerName = pastResults.winnerNames[i];
        const voteCount = pastResults.voteCounts[i].toString();
        
        // Ottieni dettagli aggiuntivi
        const details = await votingInstance.getVotingSessionDetails(id);
        
        console.log(`\n--- Votazione #${id}: ${title} ---`);
        console.log(`Durata: ${new Date(details.startTimestamp * 1000).toLocaleString()} - ${new Date(details.endTimestamp * 1000).toLocaleString()}`);
        console.log(`Vincitore: ${winnerName} (${winner.substring(0, 10)}...)`);
        console.log(`Voti: ${voteCount}/${details.totalVotes} (${details.totalVotes > 0 ? Math.round(voteCount * 100 / details.totalVotes) : 0}%)`);
        console.log(`Commissioni raccolte: ${web3.utils.fromWei(
          new web3.utils.BN(details.registrationFee).mul(new web3.utils.BN(details.totalCandidates))
          .add(new web3.utils.BN(details.votingFee).mul(new web3.utils.BN(details.totalVotes))), 
          "ether"
        )} ETH`);
      }
      
      callback();
      return;
    }
    
    // Ottieni i dettagli della votazione corrente
    const votingId = await votingInstance.getCurrentVotingId();
    console.log(`ID votazione corrente: ${votingId}`);
    
    const details = await votingInstance.getVotingSessionDetails(votingId);
    
    console.log(`\n--- Votazione #${votingId}: ${details.title} ---`);
    console.log(`Descrizione: ${details.description}`);
    console.log(`Inizio: ${new Date(details.startTimestamp * 1000).toLocaleString()}`);
    console.log(`Commissione registrazione: ${web3.utils.fromWei(details.registrationFee, "ether")} ETH`);
    console.log(`Commissione voto: ${web3.utils.fromWei(details.votingFee, "ether")} ETH`);
    
    if (currentState >= 2) { // Voting o Completed
      console.log(`Voti massimi richiesti: ${details.maxVotesRequired}`);
    }
    
    // Ottieni l'elenco dei candidati
    const candidateAddresses = await votingInstance.getCandidatesList(votingId);
    console.log(`\nCandidati registrati: ${candidateAddresses.length}`);
    
    // Mostra i dettagli dei candidati
    if (candidateAddresses.length > 0) {
      console.log(`\nDettagli candidati:`);
      
      for (let i = 0; i < candidateAddresses.length; i++) {
        const address = candidateAddresses[i];
        const candidateDetails = await votingInstance.getCandidateDetails(votingId, address);
        
        console.log(`\n${i+1}. ${candidateDetails.name} (${address.substring(0, 10)}...)`);
        console.log(`   Proposta: ${candidateDetails.proposal}`);
        
        if (currentState >= 2) { // Voting o Completed
          console.log(`   Voti: ${candidateDetails.voteCount}`);
        }
      }
    }
    
    // Se la votazione è completata, mostra il vincitore
    if (details.state == 3) { // Completed
      console.log(`\nRisultati:`);
      console.log(`Vincitore: ${details.winnerName} (${details.winner.substring(0, 10)}...)`);
      console.log(`Voti totali: ${details.totalVotes}`);
      
      // Ottieni i voti del vincitore
      const winnerDetails = await votingInstance.getCandidateDetails(votingId, details.winner);
      console.log(`Voti vincitore: ${winnerDetails.voteCount} (${details.totalVotes > 0 ? Math.round(winnerDetails.voteCount * 100 / details.totalVotes) : 0}%)`);
    }
    
    // Ottieni il saldo del contratto (solo se sei admin)
    if (accounts[0] === admin) {
      const balance = await votingInstance.getBalance();
      console.log(`\nSaldo contratto: ${web3.utils.fromWei(balance, "ether")} ETH`);
    }
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante il recupero delle statistiche:`, error);
    callback(error);
  }
};