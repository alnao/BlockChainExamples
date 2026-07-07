import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // -----------------------------------------------------------------------
    // Rete locale persistente — usata con "npm run node" + "npm run deploy:local"
    // Il nodo gira su http://127.0.0.1:8545 (chainId 31337).
    // MetaMask: RPC http://127.0.0.1:8545, Chain ID 31337, simbolo ETH
    // -----------------------------------------------------------------------
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },

    // -----------------------------------------------------------------------
    // Reti EDR in-process (utili per test veloci e script one-shot senza nodo)
    // Non richiedono "npm run node", ma i dati non persistono tra esecuzioni.
    // -----------------------------------------------------------------------
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },

    // -----------------------------------------------------------------------
    // Testnet pubblica Sepolia
    // Richiede .env con SEPOLIA_RPC_URL e SEPOLIA_PRIVATE_KEY
    // -----------------------------------------------------------------------
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
