require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
const fs = require('fs');

// Funzione per caricare le chiavi in modo sicuro
function loadLocalKeys() {
  try {
    if (fs.existsSync('./local-keys.json')) {
      const keysData = JSON.parse(fs.readFileSync('./local-keys.json', 'utf8'));
      return keysData.keys.map(key => ({
        privateKey: key.privateKey,
        balance: "10000000000000000000000"
      }));
    }
  } catch (error) {
    console.log("Nessun file local-keys.json trovato, usando account predefiniti");
  }
  
  return [];
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: loadLocalKeys()
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000
    },
    arbitrumFork: {
      url: "http://127.0.0.1:8545",
      chainId: 42161
    }/*,
    arbitrum: {
        url: process.env.ARBITRUM_RPC,
        accounts: [process.env.PRIVATE_KEY],
    }*/
  },
    // Configura il watcher per ridurre i file monitorati
    watchPaths: ["./contracts"],
    // Ignora cartelle problematiche
  paths: {
    sources: "./contracts"//,    tests: "./test"
  }
};

/*
const { version } = require("hardhat");

require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            chainId: 31337,
            accounts: keys.keys.map(key => ({
                privateKey: key.privateKey,
                balance: "10000000000000000000000"
            }))
        },
        // Fork di Arbitrum per test più realistici
        arbitrumFork: {
            url: "http://127.0.0.1:8545",
            chainId: 42161,
            forking: {
                url: "https://arb1.arbitrum.io/rpc",
                blockNumber: undefined
            }
        },
        arbitrum: {
            url: process.env.ARBITRUM_RPC,
            accounts: [process.env.PRIVATE_KEY],
        },

    },
    
};
*/