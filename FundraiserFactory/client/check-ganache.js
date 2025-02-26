/*
SIMPLE SCRIPT to send 10 ETH from the first account of Ganache to another address.
To run : node check-ganache.js
*/

// check-ganache.js
const Web3 = require('web3');

// Controlla la versione di Web3
console.log('Web3 Version:', Web3.version);

async function checkAccounts() {
  try {
    // Connessione al provider Ethereum locale (ad es. Ganache)
    // Modifica l'URL in base alla tua configurazione
    const provider = new Web3.providers.HttpProvider('HTTP://127.0.0.1:7545');
    const web3 = new Web3(provider);
    
    console.log('==== CONNESSIONE ETHEREUM ====');
    console.log('Connesso a:', await web3.eth.net.getNetworkType());
    console.log('Chain ID:', await web3.eth.getChainId());
    console.log('Versione Ethereum:', await web3.eth.getNodeInfo());
    
    console.log('\n==== ACCOUNT DISPONIBILI ====');
    // Ottieni tutti gli account disponibili
    const accounts = await web3.eth.getAccounts();
    console.log('Numero di account disponibili:', accounts.length);
    
    // Mostra gli account e i loro saldi
    console.log('\nDettagli degli account:');
    for (let i = 0; i < accounts.length; i++) {
      const balance = await web3.eth.getBalance(accounts[i]);
      console.log(`Account ${i+1}: ${accounts[i]}`);
      console.log(`  Saldo: ${web3.utils.fromWei(balance, 'ether')} ETH`);
      
      // Ottieni il numero di transazioni effettuate dall'account
      const txCount = await web3.eth.getTransactionCount(accounts[i]);
      console.log(`  Transazioni effettuate: ${txCount}`);
      console.log('-----------------------------------');
    }
    
    console.log('\n==== ACCOUNT CORRENTE ====');
    // Nota: In Node.js non c'è un concetto di "account corrente" come in MetaMask
    // Solitamente si utilizza il primo account dell'elenco per default
    console.log('Account predefinito (primo dell\'elenco):', accounts[0]);
    
    console.log('\n==== INFORMAZIONI DI RETE ====');
    console.log('Gas price attuale:', web3.utils.fromWei(await web3.eth.getGasPrice(), 'gwei'), 'gwei');
    console.log('Blocco corrente:', await web3.eth.getBlockNumber());
    
  } catch (error) {
    console.error('Errore durante il controllo degli account:', error);
  }
}

// Esegui la funzione
checkAccounts()
  .then(() => console.log('\nVerifica completata con successo.'))
  .catch(error => console.error('\nErrore durante l\'esecuzione:', error));