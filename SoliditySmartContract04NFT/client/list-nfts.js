
// scripts/list-nfts.js
// Script per elencare tutti gli NFT di un utente
const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = async function(callback) {
  try {
    // Ottieni l'indirizzo dell'utente dalle args o usa il primo account
    const accounts = await web3.eth.getAccounts();
    const userAddress = process.argv[4] || accounts[0];
    
    console.log(`Elencando gli NFT per l'indirizzo: ${userAddress}`);
    
    const nftInstance = await SimpleNFT.deployed();
    
    // Il contratto non ha un metodo nativo per elencare tutti i token di un utente
    // Dobbiamo simularlo cercando eventi di trasferimento
    
    // Ottieni il saldo dell'utente
    const balance = await nftInstance.balanceOf(userAddress);
    console.log(`Trovati ${balance.toString()} NFT per questo indirizzo`);
    
    if (balance > 0) {
      // Cerca tutti gli eventi Transfer
      const transferEvents = await nftInstance.getPastEvents('Transfer', {
        filter: { to: userAddress },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      // Usa un set per tenere traccia dei token unici (gestisce i trasferimenti multipli)
      const userTokens = new Set();
      
      // Aggiungi i token trasferiti a questo utente
      transferEvents.forEach(event => {
        userTokens.add(event.returnValues.tokenId.toString());
      });
      
      // Rimuovi i token trasferiti da questo utente
      const transferOutEvents = await nftInstance.getPastEvents('Transfer', {
        filter: { from: userAddress },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      transferOutEvents.forEach(event => {
        userTokens.delete(event.returnValues.tokenId.toString());
      });
      
      // Stampa i dettagli di ogni token
      console.log("\nDettagli NFT:");
      for (const tokenId of userTokens) {
        try {
          const uri = await nftInstance.tokenURI(tokenId);
          console.log(`- Token ID: ${tokenId}, URI: ${uri}`);
        } catch (error) {
          console.log(`- Token ID: ${tokenId}, Errore recupero URI`);
        }
      }
    }
    
    callback();
  } catch (error) {
    console.error("Errore durante l'elenco degli NFT:", error);
    callback(error);
  }
};