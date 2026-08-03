require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Carica la chiave privata in modo sicuro — se non configurata, usa una chiave dummy
// per permettere compilazione e test locali senza errori
const PRIVATE_KEY = process.env.PRIVATE_KEY &&
  process.env.PRIVATE_KEY !== "0xyour_private_key_here"
  ? process.env.PRIVATE_KEY
  : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default #0

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // -----------------------------------------------------------------------
    // Rete locale (sviluppo)
    // -----------------------------------------------------------------------
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000,
    },

    // -----------------------------------------------------------------------
    // Arbitrum Sepolia testnet — chainId 421614
    // RPC pubblico: https://sepolia-rollup.arbitrum.io/rpc
    // Block explorer: https://sepolia.arbiscan.io
    // Faucet: https://faucet.quicknode.com/arbitrum/sepolia
    //         https://faucets.chain.link/arbitrum-sepolia
    // -----------------------------------------------------------------------
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [PRIVATE_KEY],
    },

    // -----------------------------------------------------------------------
    // Arbitrum One mainnet — solo per produzione
    // -----------------------------------------------------------------------
    arbitrum: {
      url: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: [PRIVATE_KEY],
    },
  },

  // Etherscan / Arbiscan per la verifica del contratto
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
  },
};
