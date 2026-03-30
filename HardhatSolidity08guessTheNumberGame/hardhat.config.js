require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config(); // Assicurati di avere dotenv

// Usa una chiave dummy se la variabile non c'è, così la compilazione non fallisce
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SECOND_PRIVATE_KEY = process.env.SECOND_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"; // Aggiunto
const LOCALHOST_URL = "http://127.0.0.1:8545";
const REMOTE_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID || "YOUR_INFURA_PROJECT_ID_HERE"}`;
const EC2_URL = process.env.EC2_URL || "http://1.2.3.4:8545";


module.exports = {
  solidity: {
    version: "0.8.24"
  },
  networks: {
    hardhat: {},
    localhost: {
      url: LOCALHOST_URL
    },
    ec2geth: {
      url: EC2_URL,
      accounts: [PRIVATE_KEY]
    },
    sepolia: {
      url: REMOTE_URL, // o endpoint Alchemy
      accounts: [PRIVATE_KEY,SECOND_PRIVATE_KEY] // inserire la private key dell’account di Sepolia
    }
  }
 
};
