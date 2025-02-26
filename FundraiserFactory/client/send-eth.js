/*
SIMPLE SCRIPT to send 10 ETH from the first account of Ganache to another address.
To run : node send-eth.js
*/

const Web3 = require('web3');
const web3 = new Web3('HTTP://127.0.0.1:7545'); // Usa la porta corretta

async function sendEth() {
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0]; // Account pre-finanziato di Ganache
  const recipient = '0xF715954AEa4bC859230F7806524311Da3cbcBE61'; // Sostituisci con il tuo indirizzo
  
  console.log(`Inviando 10 ETH da ${sender} a ${recipient}`);
  
  const result = await web3.eth.sendTransaction({
    from: sender,
    to: recipient,
    value: web3.utils.toWei('10', 'ether')
  });
  
  console.log('Transazione completata:', result.transactionHash);
}

sendEth().catch(console.error);