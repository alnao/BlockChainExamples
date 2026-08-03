// scripts/deploy.js
// Deploya DocumentCertifier su qualsiasi rete configurata in hardhat.config.js.
// Su reti locali (hardhat/localhost) usa i 5 account di default.
// Su reti pubbliche (arbitrumSepolia, arbitrum) usa solo l'account del deployer.

const hre = require("hardhat");

async function main() {
  console.log("=== Deploy DocumentCertifier ===");
  const networkName = hre.network.name;
  console.log("Network:", networkName);

  const isPublicNetwork = !["hardhat", "localhost"].includes(networkName);

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`\nDeployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  if (isPublicNetwork && parseFloat(hre.ethers.formatEther(balance)) < 0.001) {
    throw new Error(
      `Saldo insufficiente (${hre.ethers.formatEther(balance)} ETH).\n` +
      `Ottieni ETH Arbitrum Sepolia da:\n` +
      `  https://faucet.quicknode.com/arbitrum/sepolia\n` +
      `  https://faucets.chain.link/arbitrum-sepolia`
    );
  }

  // ---- Deploy ---------------------------------------------------------------
  console.log("\n=== Deploying DocumentCertifier ===");
  const Factory = await hre.ethers.getContractFactory("DocumentCertifier");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ DocumentCertifier deployato a: ${contractAddress}`);
  if (networkName === "arbitrumSepolia") {
    console.log(`🔍 Block explorer: https://sepolia.arbiscan.io/address/${contractAddress}`);
  } else if (networkName === "arbitrum") {
    console.log(`🔍 Block explorer: https://arbiscan.io/address/${contractAddress}`);
  }

  // ---- Setup issuer (solo in locale) ----------------------------------------
  // Su rete pubblica non aggiungiamo issuer automaticamente perché
  // l'admin è lo stesso deployer e gli issuer vanno gestiti via script separato.
  if (!isPublicNetwork && signers.length >= 3) {
    const [, issuer1, issuer2] = signers;
    console.log("\n=== Setup issuer (rete locale) ===");

    const tx1 = await contract.addIssuer(issuer1.address);
    await tx1.wait();
    console.log(`✅ Issuer1 aggiunto: ${issuer1.address}`);

    const tx2 = await contract.addIssuer(issuer2.address);
    await tx2.wait();
    console.log(`✅ Issuer2 aggiunto: ${issuer2.address}`);
  } else if (isPublicNetwork) {
    console.log(
      "\nℹ️  Su rete pubblica gli issuer si aggiungono manualmente dopo il deploy:\n" +
      `   ISSUER=0x<indirizzo> npx hardhat run scripts/add-issuer.js --network ${networkName}`
    );
  }

  // ---- Salva informazioni ---------------------------------------------------
  const deployInfo = {
    contractAddress,
    admin: deployer.address,
    network: networkName,
    deployedAt: new Date().toISOString(),
    ...(isPublicNetwork
      ? {}
      : {
          issuer1: signers[1]?.address,
          issuer2: signers[2]?.address,
          recipient1: signers[3]?.address,
          recipient2: signers[4]?.address,
        }),
  };

  require("fs").writeFileSync("deployed-contract.json", JSON.stringify(deployInfo, null, 2));
  console.log("\n📄 deployed-contract.json aggiornato");

  // Copia anche nella src/ del frontend in modo che l'import funzioni
  const frontendSrc = require("path").join(__dirname, "../frontend/src/deployed-contract.json");
  require("fs").writeFileSync(frontendSrc, JSON.stringify(deployInfo, null, 2));
  console.log(`📄 frontend/src/deployed-contract.json aggiornato`);

  if (isPublicNetwork) {
    console.log("\n=== Prossimi passi ===");
    console.log("1. Aggiungi un issuer:");
    console.log(`   ISSUER=0x<indirizzo> npx hardhat run scripts/add-issuer.js --network ${networkName}`);
    console.log("2. Verifica il contratto su Arbiscan (opzionale, richiede ARBISCAN_API_KEY):");
    console.log(`   npx hardhat verify ${contractAddress} --network ${networkName}`);
  }

  return contract;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Errore:", err.message);
      process.exit(1);
    });
}

module.exports = main;
