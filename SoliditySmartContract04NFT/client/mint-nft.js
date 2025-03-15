// scripts/mint-nft.js
// Script per coniare un nuovo NFT
const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];
    
    console.log("Utilizzando l'account:", owner);
    
    // Ottieni l'istanza del contratto
    const nftInstance = await SimpleNFT.deployed();
    console.log("Contratto NFT trovato all'indirizzo:", nftInstance.address);
    
    // Conia un nuovo NFT
    const tokenURI = "https://example.com/metadata/new-token";
    const recipient = process.argv[4] || owner; // Usa l'indirizzo passato come argomento o l'owner
    
    console.log(`Coniando un nuovo NFT per ${recipient} con URI: ${tokenURI}`);
    const result = await nftInstance.mint(recipient, tokenURI, { from: owner });
    
    const tokenId = result.logs[0].args.tokenId.toString();
    console.log(`NFT coniato con successo! Token ID: ${tokenId}`);
    console.log(`Transazione: ${result.tx}`);
    
    callback();
  } catch (error) {
    console.error("Errore durante il minting dell'NFT:", error);
    callback(error);
  }
};