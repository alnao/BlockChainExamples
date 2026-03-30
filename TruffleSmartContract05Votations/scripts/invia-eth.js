//in una rete locale con ganache come faccio a mandare un po' di eth da un indirizzo ad un altro ?
//truffle exec scripts/invia-eth.js 0xMittenteAddress 0xDestinatarioAddress 10

// scripts/invia-eth.js
module.exports = async function(callback) {
    try {
      const accounts = await web3.eth.getAccounts();
      const from = process.argv[4];
      const to = process.argv[5];
      const amount = process.argv[6]; // in ETH
      
      if (!from || !to || !amount) {
        console.error("Uso: truffle exec scripts/invia-eth.js <indirizzo-mittente> <indirizzo-destinatario> <importo-in-eth>");
        callback("Parametri mancanti");
        return;
      }
      
      console.log(`Invio di ${amount} ETH da ${from} a ${to}...`);
      
      const result = await web3.eth.sendTransaction({
        from: from,
        to: to,
        value: web3.utils.toWei(amount, 'ether')
      });
      
      console.log("Trasferimento completato!");
      console.log("Hash transazione:", result.transactionHash);
      
      // Visualizza i nuovi saldi
      const balanceSender = await web3.eth.getBalance(from);
      const balanceReceiver = await web3.eth.getBalance(to);
      
      console.log(`Nuovo saldo mittente: ${web3.utils.fromWei(balanceSender, 'ether')} ETH`);
      console.log(`Nuovo saldo destinatario: ${web3.utils.fromWei(balanceReceiver, 'ether')} ETH`);
      
      callback();
    } catch (error) {
      console.error("Errore durante il trasferimento:", error);
      callback(error);
    }
  };
