const hre = require("hardhat");
const crypto = require('crypto');

async function main() {
    const documentType = "Certificate";

    // Carica le informazioni del contratto deployato
    const deployInfo = JSON.parse(require('fs').readFileSync('deployed-contract.json', 'utf8'));
    const contractAddress = deployInfo.contractAddress;
    
    console.log("=== Interazione con DocumentCertifier ===");
    console.log("Contract Address:", contractAddress);
    
    const [admin, issuer1, issuer2, recipient1, recipient2] = await hre.ethers.getSigners();
    
    // Connetti al contratto
    const DocumentCertifier = await hre.ethers.getContractFactory("DocumentCertifier");
    const contract = DocumentCertifier.attach(contractAddress);
    
    console.log("\n=== Test emissione documenti ===");
    
    // Aggiungi i tipi di documento necessari
    const documentTypesToAdd = [documentType, "Workshop"];
    for (const type of documentTypesToAdd) {
        try {
            await contract.connect(admin).addDocumentType(type);
            console.log(`Tipo documento aggiunto: ${type}`);
        } catch (err) {
            if (err.message.includes("Type already exists")) {
                console.log(`Tipo documento già presente: ${type}`);
            } else {
                console.error(`Errore aggiunta tipo documento ${type}:`, err.message);
            }
        }
    }

    // Crea un hash del documento (simula il contenuto di un documento)
    const documentContent = "Certificato di completamento corso blockchain - " + Date.now();
    const docHash = "0x" + crypto.createHash('sha256').update(documentContent).digest('hex');
    const metadataURI = "https://ipfs.io/ipfs/QmExample123"; // Simula un URI IPFS
    
    console.log("Contenuto documento:", documentContent);
    console.log("Hash documento:", docHash);
    console.log("Metadata URI:", metadataURI);
    
    // Issuer1 emette un documento per recipient1
    console.log("\n--- Issuer1 emette documento per Recipient1 ---");
    const issueContract = contract.connect(issuer1);
    // Specifica il tipo di documento (assicurati che sia stato aggiunto dall'admin)
    
    const issueTx = await issueContract.issueDocument(recipient1.address, docHash, metadataURI, documentType);
    const issueReceipt = await issueTx.wait();

    console.log("✅ Documento emesso!");
    console.log("Transaction hash:", issueReceipt.hash);

    // Verifica il documento
    console.log("\n--- Verifica documento ---");
    const docInfo = await contract.getDocument(docHash);
    console.log("Issuer:", docInfo[0]);
    console.log("Recipient:", docInfo[1]);
    console.log("Metadata URI:", docInfo[2]);
    console.log("Issued At:", new Date(Number(docInfo[3]) * 1000).toLocaleString());
    console.log("Revoked:", docInfo[4]);
    console.log("Document Type:", docInfo[5]);
    
    // Test di revoca
    console.log("\n--- Test revoca documento ---");
    const revokeTx = await issueContract.revokeDocument(docHash);
    await revokeTx.wait();
    console.log("✅ Documento revocato!");
    
    // Verifica la revoca
    const revokedDocInfo = await contract.getDocument(docHash);
    console.log("Documento ora revocato:", revokedDocInfo[4]);
    
    // Test emissione di un secondo documento
    console.log("\n--- Emissione secondo documento ---");
    const docContent2 = "Certificato di partecipazione workshop - " + Date.now();
    const docHash2 = "0x" + crypto.createHash('sha256').update(docContent2).digest('hex');
    const metadataURI2 = "https://ipfs.io/ipfs/QmExample456";
    const documentType2 = "Workshop";

    const issuer2Contract = contract.connect(issuer2);
    const issueTx2 = await issuer2Contract.issueDocument(recipient2.address, docHash2, metadataURI2, documentType2);
    await issueTx2.wait();

    console.log("✅ Secondo documento emesso da Issuer2!");

    const docInfo2 = await contract.getDocument(docHash2);
    console.log("Nuovo documento - Issuer:", docInfo2[0]);
    console.log("Nuovo documento - Recipient:", docInfo2[1]);
    console.log("Nuovo documento - Revoked:", docInfo2[4]);
    console.log("Nuovo documento - Document Type:", docInfo2[5]);
    
    console.log("\n=== Test completati con successo! ===");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Errore:", error);
        process.exit(1);
    });