require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SECOND_PRIVATE_KEY = process.env.SECOND_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const LOCALHOST_URL = "http://127.0.0.1:8545";
const EC2_URL = process.env.EC2_URL || "http://1.2.3.4:8545";

// Gestione flessibile dell'endpoint Sepolia:
// 1. SEPOLIA_URL completo se fornito (es. https://sepolia.infura.io/v3/XXX o https://user:secret@sepolia...)
// 2. Oppure tramite INFURA_PROJECT_ID (con eventuale INFURA_CLIENT_SECRET)
let sepoliaUrl = process.env.SEPOLIA_URL;

if (!sepoliaUrl) {
  const projectId = process.env.INFURA_PROJECT_ID || process.env.INFURA_CLIENT_ID || "";
  const clientSecret = process.env.INFURA_CLIENT_SECRET || "";
  
  if (clientSecret) {
    sepoliaUrl = `https://${projectId}:${clientSecret}@sepolia.infura.io/v3/${projectId}`;
  } else {
    sepoliaUrl = `https://sepolia.infura.io/v3/${projectId}`;
  }
}

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
      url: sepoliaUrl,
      accounts: [PRIVATE_KEY, SECOND_PRIVATE_KEY]
    }
  }
};
