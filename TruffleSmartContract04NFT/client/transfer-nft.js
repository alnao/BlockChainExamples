
// scripts/transfer-nft.js
// Script per trasferire un NFT esistente
const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];
    
    // Ottieni i parametri dallo script
    const tokenId = process.argv[4];
    const to = process.argv[5];
    
    if (!tokenId || !to) {
      console.error("Uso: truffle exec scripts/transfer-nft.js <tokenId> <destinatario>");
      callback("Parametri mancanti");
      return;
    }
    
    console.log(`Trasferimento del Token ID ${tokenId} da ${from} a ${to}`);
    
    const nftInstance = await SimpleNFT.deployed();
    
    // Verifica che il mittente sia il proprietario
    const owner = await nftInstance.ownerOf(tokenId);
    if (owner.toLowerCase() !== from.toLowerCase()) {
      console.error(`L'account ${from} non è il proprietario del Token ID ${tokenId}`);
      callback("Non autorizzato");
      return;
    }
    
    // Trasferisci l'NFT
    const result = await nftInstance.transferFrom(from, to, tokenId, { from });
    
    console.log(`NFT trasferito con successo!`);
    console.log(`Transazione: ${result.tx}`);
    
    callback();
  } catch (error) {
    console.error("Errore durante il trasferimento dell'NFT:", error);
    callback(error);
  }
};
