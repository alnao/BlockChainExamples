// scripts/change-admin.js
// Script per cambiare l'amministratore del contratto
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const currentAdmin = accounts[0]; // L'amministratore attuale
    
    // Ottieni l'indirizzo del nuovo admin
    const newAdminIndex = parseInt(process.argv[4] || "1"); // Indice del nuovo admin (default: 1)
    const newAdmin = process.argv[5] || accounts[newAdminIndex]; // Indirizzo del nuovo admin
    
    console.log(`\n=== Cambio amministratore ===`);
    console.log(`Amministratore attuale: ${currentAdmin}`);
    console.log(`Nuovo amministratore: ${newAdmin}`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Verifica che l'account corrente sia l'admin
    const contractAdmin = await votingInstance.admin();
    if (currentAdmin !== contractAdmin) {
      console.error("Solo l'amministratore attuale può cambiare amministratore.");
      callback("Non autorizzato");
      return;
    }
    
    // Verifica che il nuovo admin sia diverso da quello attuale
    if (newAdmin.toLowerCase() === contractAdmin.toLowerCase()) {
      console.error("Il nuovo amministratore deve essere diverso dall'attuale.");
      callback("Admin identico");
      return;
    }
    
    // Cambia l'amministratore
    console.log(`Cambio amministratore in corso...`);
    const result = await votingInstance.changeAdmin(newAdmin, { from: currentAdmin });
    
    // Verifica che il cambio sia avvenuto correttamente
    const updatedAdmin = await votingInstance.admin();
    
    console.log(`\n✅ Amministratore cambiato con successo!`);
    console.log(`Transaction hash: ${result.tx}`);
    console.log(`Nuovo amministratore: ${updatedAdmin}`);
    
    // Avvisi importanti
    console.log(`\nAVVISO IMPORTANTE:`);
    console.log(`- L'account ${currentAdmin} non ha più i privilegi di amministratore.`);
    console.log(`- L'account ${updatedAdmin} è il nuovo amministratore e ha ora il controllo completo del contratto.`);
    console.log(`- Solo il nuovo amministratore può creare votazioni, prelevare fondi e gestire il contratto.`);
    
    // Controlla se c'è una votazione attiva
    const currentState = await votingInstance.getCurrentState();
    if (currentState != 0) { // Non inattivo
      console.log(`\nAVVISO: C'è una votazione attiva al momento. Il nuovo amministratore è ora responsabile di gestirla.`);
    }
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante il cambio di amministratore:`, error);
    callback(error);
  }
};