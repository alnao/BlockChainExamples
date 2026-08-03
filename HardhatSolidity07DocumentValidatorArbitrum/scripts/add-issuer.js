// scripts/add-issuer.js
// Aggiunge un issuer autorizzato al contratto deployato.
// Uso: ISSUER=0x<indirizzo> npx hardhat run scripts/add-issuer.js --network <rete>

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const issuerAddress = process.env.ISSUER;
  if (!issuerAddress) {
    throw new Error("Specifica l'indirizzo issuer con: ISSUER=0x... npx hardhat run ...");
  }

  const deployInfo = JSON.parse(fs.readFileSync("deployed-contract.json", "utf8"));
  const [admin] = await hre.ethers.getSigners();

  console.log(`Rete:     ${hre.network.name}`);
  console.log(`Contratto: ${deployInfo.contractAddress}`);
  console.log(`Admin:    ${admin.address}`);
  console.log(`Issuer:   ${issuerAddress}`);

  const contract = await hre.ethers.getContractAt(
    "DocumentCertifier",
    deployInfo.contractAddress
  );

  const already = await contract.isAuthorizedIssuer(issuerAddress);
  if (already) {
    console.log("ℹ️  Indirizzo già autorizzato come issuer.");
    return;
  }

  const tx = await contract.connect(admin).addIssuer(issuerAddress);
  const receipt = await tx.wait();
  console.log(`✅ Issuer aggiunto! Tx: ${receipt.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Errore:", err.message);
    process.exit(1);
  });
