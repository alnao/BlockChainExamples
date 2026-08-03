// scripts/interact.js — ethers v6
// Dimostra il flusso completo: addIssuer → issueDocument → getDocument → revokeDocument

const hre = require("hardhat");
const crypto = require("crypto");
const fs = require("fs");

async function main() {
  const deployInfo = JSON.parse(fs.readFileSync("deployed-contract.json", "utf8"));
  const contractAddress = deployInfo.contractAddress;

  console.log("=== Interazione con DocumentCertifier ===");
  console.log("Contract Address:", contractAddress);

  const [admin, issuer1, issuer2, recipient1, recipient2] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("DocumentCertifier", contractAddress);

  // ---- 1. Aggiungi tipi di documento ------------------------------------
  console.log("\n=== Setup tipi di documento ===");
  for (const type of ["Certificate", "Workshop"]) {
    try {
      await (await contract.connect(admin).addDocumentType(type)).wait();
      console.log(`✅ Tipo aggiunto: ${type}`);
    } catch (err) {
      if (err.message.includes("Type already exists")) {
        console.log(`ℹ️  Tipo già presente: ${type}`);
      } else throw err;
    }
  }

  // ---- 2. Autorizza gli issuer ------------------------------------------
  console.log("\n=== Autorizzazione issuer ===");
  for (const [label, issuer] of [["issuer1", issuer1], ["issuer2", issuer2]]) {
    try {
      await (await contract.connect(admin).addIssuer(issuer.address)).wait();
      console.log(`✅ ${label} autorizzato: ${issuer.address}`);
    } catch (err) {
      if (err.message.includes("Already authorized")) {
        console.log(`ℹ️  ${label} già autorizzato`);
      } else throw err;
    }
  }

  // ---- 3. Issuer1 emette documento per Recipient1 -----------------------
  console.log("\n=== Emissione documento #1 ===");
  const content1 = "Certificato blockchain - " + Date.now();
  // ethers v6: ethers.keccak256 + ethers.toUtf8Bytes (oppure crypto SHA256)
  // Usiamo lo stesso approccio del contratto per simulare l'hash del file
  const docHash1 = "0x" + crypto.createHash("sha256").update(content1).digest("hex");
  const uri1 = "https://ipfs.io/ipfs/QmExample123";

  console.log("Contenuto:", content1);
  console.log("Hash:     ", docHash1);

  await (await contract.connect(issuer1).issueDocument(
    recipient1.address, docHash1, uri1, "Certificate"
  )).wait();
  console.log("✅ Documento emesso!");

  const doc1 = await contract.getDocument(docHash1);
  console.log("  Issuer:      ", doc1.issuer);
  console.log("  Recipient:   ", doc1.recipient);
  console.log("  Type:        ", doc1.documentType);
  console.log("  Issued At:   ", new Date(Number(doc1.issuedAt) * 1000).toLocaleString("it-IT"));
  console.log("  Revoked:     ", doc1.revoked);

  // ---- 4. Revoca documento -----------------------------------------------
  console.log("\n=== Revoca documento #1 ===");
  await (await contract.connect(issuer1).revokeDocument(docHash1)).wait();
  console.log("✅ Documento revocato!");

  const doc1Rev = await contract.getDocument(docHash1);
  console.log("  Revoked ora:", doc1Rev.revoked);

  // ---- 5. Issuer2 emette documento per Recipient2 -----------------------
  console.log("\n=== Emissione documento #2 ===");
  const content2 = "Workshop blockchain - " + Date.now();
  const docHash2 = "0x" + crypto.createHash("sha256").update(content2).digest("hex");
  const uri2 = "https://ipfs.io/ipfs/QmExample456";

  await (await contract.connect(issuer2).issueDocument(
    recipient2.address, docHash2, uri2, "Workshop"
  )).wait();
  console.log("✅ Secondo documento emesso da issuer2!");

  const doc2 = await contract.getDocument(docHash2);
  console.log("  Issuer:    ", doc2.issuer);
  console.log("  Recipient: ", doc2.recipient);
  console.log("  Type:      ", doc2.documentType);
  console.log("  Revoked:   ", doc2.revoked);

  // ---- 6. Verifica che un non-issuer non possa emettere -----------------
  console.log("\n=== Test sicurezza ===");
  const [,,,,, attacker] = await hre.ethers.getSigners();
  const hashFake = "0x" + crypto.createHash("sha256").update("attacco").digest("hex");
  try {
    await contract.connect(attacker).issueDocument(
      attacker.address, hashFake, "uri", "Certificate"
    );
    console.log("❌ ERRORE: l'attaccante ha emesso un documento!");
  } catch {
    console.log("✅ Non-issuer correttamente bloccato.");
  }

  console.log("\n=== Tutti i test completati con successo! ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Errore fatale:", err.message);
    process.exit(1);
  });
