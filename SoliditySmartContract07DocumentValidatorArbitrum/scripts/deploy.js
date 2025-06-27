const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with account:", deployer.address);

    const ContractFactory = await hre.ethers.getContractFactory("DocumentCertifier");
    const contract = await ContractFactory.deploy();

    await contract.deployed();

    console.log("✅ DocumentCertifier deployed to:", contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});