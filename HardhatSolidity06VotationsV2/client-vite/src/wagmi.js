// src/wagmi.js
// Configurazione wagmi + viem per il Sistema di Votazione
// Supporta: rete locale Hardhat (chainId 31337) e Sepolia

import { createConfig, http } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [
    injected(), // MetaMask e qualsiasi wallet EIP-1193 (Rabby, Coinbase Wallet, ecc.)
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
  },
});
