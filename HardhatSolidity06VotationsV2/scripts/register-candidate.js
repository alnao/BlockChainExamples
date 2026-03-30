// scripts/register-candidate.js
// Script per registrare un candidato alla votazione
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    // Ottieni i parametri dallo script
    const candidateIndex = parseInt(process.argv[4] || "1"); // Indice dell'account da usare come candidato (default: 1)
    const name = process.argv[5] || `Candidato ${candidateIndex}`; // Nome del candidato
    const proposal = process.argv[6] || `Proposta del candidato ${candidateIndex} per migliorare la comunità`; // Proposta del candidato
    
    const accounts = await web3.eth.getAccounts();
    const candidate = accounts[candidateIndex];
    
    console.log(`\n=== Registrazione candidato ===`);
    console.log(`Indirizzo candidato: ${candidate}`);
    console.log(`Nome: ${name}`);
    console.log(`Proposta: ${proposal}`);
    
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
    
    // Ottieni la commissione di registrazione
    const registrationFee = await votingInstance.registrationFee();
    console.log(`Commissione di registrazione: ${web3.utils.fromWei(registrationFee, "ether")} ETH`);
    
    // Verifica il saldo del candidato
    const balance = await web3.eth.getBalance(candidate);
    if (new web3.utils.BN(balance).lt(new web3.utils.BN(registrationFee))) {
      console.error(`Il candidato non ha fondi sufficienti. Saldo: ${web3.utils.fromWei(balance, "ether")} ETH`);
      callback("Fondi insufficienti");
      return;
    }
    
    // Registra il candidato
    console.log(`Registrazione del candidato in corso...`);
    const result = await votingInstance.registerCandidate(
      name,
      proposal,
      { from: candidate, value: registrationFee }
    );
    
    // Ottieni l'ID della votazione corrente
    const votingId = await votingInstance.getCurrentVotingId();
    
    console.log(`\n✅ Candidato registrato con successo!`);
    console.log(`ID votazione: ${votingId}`);
    console.log(`Transaction hash: ${result.tx}`);
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante la registrazione del candidato:`, error);
    callback(error);
  }
};