const fs = require("fs");
const path = require("path");

// Funzione per salvare gli indirizzi deployati
function saveDeployedAddresses(tokenAddress, gameAddress) {
  const addresses = {
    timestamp: new Date().toISOString(),
    network: "localhost",
    token: tokenAddress,
    game: gameAddress
  };
  
  const filePath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
  console.log("Indirizzi salvati in:", filePath);
}

// Funzione per leggere gli indirizzi deployati
function loadDeployedAddresses() {
  const filePath = path.join(__dirname, "../deployed-addresses.json");
  
  if (!fs.existsSync(filePath)) {
    throw new Error("File deployed-addresses.json non trovato. Esegui prima il deploy!");
  }
  
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

module.exports = {
  saveDeployedAddresses,
  loadDeployedAddresses
};
