// scripts/create-voting.js
// Script per creare una nuova sessione di votazione
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; // L'amministratore è il primo account
    
    // Parametri della nuova votazione
    const title = process.argv[4] || "Elezione Rappresentante";
    const description = process.argv[5] || "Votazione per eleggere il rappresentante della comunità";
    const registrationFee = web3.utils.toWei(process.argv[6] || "0.1", "ether"); // Commissione C1 (0.1 ETH)
    const votingFee = web3.utils.toWei(process.argv[7] || "0.01", "ether"); // Commissione C2 (0.01 ETH)
    
    console.log(`\n=== Creazione di una nuova sessione di votazione ===`);
    console.log(`Titolo: ${title}`);
    console.log(`Descrizione: ${description}`);
    console.log(`Commissione registrazione: ${web3.utils.fromWei(registrationFee, "ether")} ETH`);
    console.log(`Commissione voto: ${web3.utils.fromWei(votingFee, "ether")} ETH`);
    console.log(`Admin: ${admin}`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Verifica che non ci siano votazioni attive
    const currentState = await votingInstance.getCurrentState();
    if (currentState != 0) { // 0 = Inactive
      console.error("C'è già una votazione attiva. Impossibile crearne una nuova.");
      callback("Votazione già attiva");
      return;
    }
    
    // Crea la nuova votazione
    console.log(`Creazione della votazione in corso...`);
    const result = await votingInstance.createVotingSession(
      title,
      description,
      registrationFee,
      votingFee,
      { from: admin }
    );
    
    // Ottieni l'ID della votazione creata dall'evento
    const votingId = result.logs[0].args.votingId.toString();
    
    console.log(`\n✅ Votazione creata con successo!`);
    console.log(`ID votazione: ${votingId}`);
    console.log(`Transaction hash: ${result.tx}`);
    console.log(`Stato corrente: Registrazione candidati`);
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante la creazione della votazione:`, error);
    callback(error);
  }
};