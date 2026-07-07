// src/contractConfig.js
// Indirizzo del contratto per ogni rete.
// Gli indirizzi vengono aggiornati automaticamente da "npm run deploy:local"
// oppure "npm run deploy:sepolia" tramite scripts/post-deploy.js.
//
// In alternativa puoi sovrascriverli manualmente nel file client-vite/.env:
//   VITE_CONTRACT_ADDRESS_31337=0x...   (Hardhat locale)
//   VITE_CONTRACT_ADDRESS_11155111=0x... (Sepolia)

import contractArtifact from './contracts/AdvancedVotingSystem.json';

// Indirizzi per rete (chainId come chiave)
const CONTRACT_ADDRESSES = {
  // Hardhat locale (chainId 31337)
  31337: import.meta.env.VITE_CONTRACT_ADDRESS_31337 || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  // Sepolia (chainId 11155111)
  11155111: import.meta.env.VITE_CONTRACT_ADDRESS_11155111 || '',
};

/**
 * Ritorna l'indirizzo del contratto per il chainId attivo.
 * Se non configurato, ritorna una stringa vuota e il frontend mostrerà un warning.
 */
export function getContractAddress(chainId) {
  return CONTRACT_ADDRESSES[chainId] || '';
}

export const CONTRACT_ABI = contractArtifact.abi;

// Enum VotingState (deve corrispondere al contratto Solidity)
export const VotingState = {
  Inactive:     0,
  Registration: 1,
  Voting:       2,
  Completed:    3,
};

export const STATE_LABELS = ['Inattivo', 'Registrazione Candidati', 'Votazione in Corso', 'Completato'];
export const STATE_COLORS = ['#888888', '#3498db', '#2ecc71', '#95a5a6'];
