const hre = require("hardhat");

async function main() {
    console.log("=== Deploy DocumentCertifier ===");
    console.log("Network:", hre.network.name);
    
    const [deployer, issuer1, issuer2, recipient1, recipient2] = await hre.ethers.getSigners();
    
    console.log("\n=== Account disponibili ===");
    console.log("Admin/Deployer:", deployer.address);
    console.log("Issuer 1:", issuer1.address);
    console.log("Issuer 2:", issuer2.address);
    console.log("Recipient 1:", recipient1.address);
    console.log("Recipient 2:", recipient2.address);
    
    // Usa getBalance con await invece di formatEther diretto
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("\nBalance Admin:", hre.ethers.formatEther(balance), "ETH");
    
    // Deploy del contratto
    console.log("\n=== Deploying DocumentCertifier ===");
    const DocumentCertifier = await hre.ethers.getContractFactory("DocumentCertifier");
    const contract = await DocumentCertifier.deploy();
    
    // Attendi il deploy
    await contract.waitForDeployment();
    
    // Ottieni l'indirizzo del contratto
    const contractAddress = await contract.getAddress();
    
    console.log("✅ DocumentCertifier deployato!");
    console.log("Contract Address:", contractAddress);
    
    // Verifica admin
    const adminAddress = await contract.admin();
    console.log("Admin:", adminAddress);
    
    // Setup iniziale: aggiungi degli issuer
    console.log("\n=== Setup iniziale ===");
    
    // Aggiungi issuer1 come issuer autorizzato
    console.log("Aggiungendo issuer1 come autorizzato...");
    const tx1 = await contract.addIssuer(issuer1.address);
    const receipt1 = await tx1.wait();
    console.log("✅ Issuer1 aggiunto - TX:", receipt1.hash);
    
    // Aggiungi issuer2 come issuer autorizzato
    console.log("Aggiungendo issuer2 come autorizzato...");
    const tx2 = await contract.addIssuer(issuer2.address);
    const receipt2 = await tx2.wait();
    console.log("✅ Issuer2 aggiunto - TX:", receipt2.hash);
    
    // Verifica che siano autorizzati
    console.log("\n=== Verifica autorizzazioni ===");
    const isIssuer1Authorized = await contract.isAuthorizedIssuer(issuer1.address);
    const isIssuer2Authorized = await contract.isAuthorizedIssuer(issuer2.address);
    
    console.log("Issuer1 autorizzato:", isIssuer1Authorized);
    console.log("Issuer2 autorizzato:", isIssuer2Authorized);
    
    // Salva le informazioni per gli script successivi
    const deployInfo = {
        contractAddress: contractAddress,
        admin: deployer.address,
        issuer1: issuer1.address,
        issuer2: issuer2.address,
        recipient1: recipient1.address,
        recipient2: recipient2.address,
        deployedAt: new Date().toISOString(),
        network: hre.network.name
    };
    
    require('fs').writeFileSync('deployed-contract.json', JSON.stringify(deployInfo, null, 2));
    console.log("\n📄 Informazioni salvate in deployed-contract.json");
    
    return { contract, deployer, issuer1, issuer2, recipient1, recipient2 };
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Errore durante il deploy:", error);
            process.exit(1);
        });
}

module.exports = main;