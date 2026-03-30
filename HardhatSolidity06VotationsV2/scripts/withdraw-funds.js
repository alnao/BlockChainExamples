// scripts/withdraw-funds.js
// Script per prelevare i fondi raccolti dal contratto
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; // L'amministratore è il primo account
    
    // Ottieni l'importo da prelevare (se specificato)
    const amountEth = process.argv[4]; // Importo in ETH da prelevare
    
    console.log(`\n=== Prelievo fondi ===`);
    console.log(`Amministratore: ${admin}`);
    
    // Ottieni l'istanza del contratto
    const votingInstance = await AdvancedVotingSystem.deployed();
    console.log(`Contratto trovato all'indirizzo: ${votingInstance.address}`);
    
    // Verifica che l'account sia l'admin
    const contractAdmin = await votingInstance.admin();
    if (admin !== contractAdmin) {
      console.error("Solo l'amministratore può prelevare i fondi.");
      callback("Non autorizzato");
      return;
    }
    
    // Ottieni il saldo corrente del contratto
    const balance = await votingInstance.getBalance();
    console.log(`Saldo contratto: ${web3.utils.fromWei(balance, "ether")} ETH`);
    
    if (balance == 0) {
      console.log(`Non ci sono fondi da prelevare.`);
      callback();
      return;
    }
    
    // Determina l'importo da prelevare
    let amount;
    if (amountEth) {
      amount = web3.utils.toWei(amountEth, "ether");
      
      // Verifica che l'importo non superi il saldo
      if (new web3.utils.BN(amount).gt(new web3.utils.BN(balance))) {
        console.error(`L'importo specificato (${amountEth} ETH) supera il saldo del contratto (${web3.utils.fromWei(balance, "ether")} ETH).`);
        callback("Importo non valido");
        return;
      }
    } else {
      // Preleva l'intero saldo
      amount = balance;
      console.log(`Nessun importo specificato. Prelievo dell'intero saldo.`);
    }
    
    // Preleva i fondi
    console.log(`Prelievo di ${web3.utils.fromWei(amount, "ether")} ETH in corso...`);
    
    // Ottieni il saldo precedente dell'admin
    const adminBalanceBefore = await web3.eth.getBalance(admin);
    
    const result = await votingInstance.withdrawFunds(amount, { from: admin });
    
    // Ottieni il saldo aggiornato del contratto e dell'admin
    const newBalance = await votingInstance.getBalance();
    const adminBalanceAfter = await web3.eth.getBalance(admin);
    
    // Calcola il gas speso
    const tx = await web3.eth.getTransaction(result.tx);
    const receipt = await web3.eth.getTransactionReceipt(result.tx);
    const gasUsed = new web3.utils.BN(receipt.gasUsed);
    const gasPrice = new web3.utils.BN(tx.gasPrice);
    const gasCost = gasUsed.mul(gasPrice);
    
    // Calcola l'importo effettivamente ricevuto (considerando il costo del gas)
    const expectedBalanceIncrease = new web3.utils.BN(amount);
    const actualBalanceIncrease = new web3.utils.BN(adminBalanceAfter).sub(new web3.utils.BN(adminBalanceBefore)).add(gasCost);
    
    console.log(`\n✅ Prelievo completato con successo!`);
    console.log(`Transaction hash: ${result.tx}`);
    console.log(`Gas utilizzato: ${gasUsed.toString()} unità`);
    console.log(`Costo gas: ${web3.utils.fromWei(gasCost, "ether")} ETH`);
    console.log(`Importo prelevato: ${web3.utils.fromWei(amount, "ether")} ETH`);
    console.log(`Nuovo saldo contratto: ${web3.utils.fromWei(newBalance, "ether")} ETH`);
    
    callback();
  } catch (error) {
    console.error(`\n❌ Errore durante il prelievo dei fondi:`, error);
    callback(error);
  }
};