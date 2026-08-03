import { ethers } from 'ethers';

// ---------------------------------------------------------------------------
// Configurazione rete — letta da src/deployed-contract.json
// Questo file viene aggiornato automaticamente da:
//   npm run deploy:local            → localhost (chainId 31337)
//   npm run deploy:arbitrum-sepolia → Arbitrum Sepolia (chainId 421614)
// ---------------------------------------------------------------------------
import deployedInfo from '../deployed-contract.json';

// ---------------------------------------------------------------------------
// Configurazione rete
// Modifica NETWORK per cambiare rete attiva:
//   'localhost'         → Hardhat locale (chainId 31337)
//   'arbitrumSepolia'   → Arbitrum Sepolia testnet (chainId 421614)
//   'arbitrum'          → Arbitrum One mainnet (chainId 42161)
// ---------------------------------------------------------------------------
const NETWORK_CONFIG = {
  localhost: {
    chainId: 31337,
    chainIdHex: '0x7a69',
    rpcUrl: 'http://127.0.0.1:8545',
    chainName: 'Hardhat Localhost',
    blockExplorerUrls: null,
    label: 'Locale (Hardhat)',
  },
  arbitrumSepolia: {
    chainId: 421614,
    chainIdHex: '0x66eee',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainName: 'Arbitrum Sepolia',
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    label: 'Arbitrum Sepolia',
  },
  arbitrum: {
    chainId: 42161,
    chainIdHex: '0xa4b1',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainName: 'Arbitrum One',
    blockExplorerUrls: ['https://arbiscan.io'],
    label: 'Arbitrum One',
  },
};

// Rete attiva — viene letta dal file deployed-contract.json generato dal deploy
// In questo modo basta fare npm run deploy:arbitrum-sepolia e il frontend
// si aggiorna automaticamente senza modifiche manuali.
const ACTIVE_NETWORK = NETWORK_CONFIG[deployedInfo.network] || NETWORK_CONFIG.localhost;

export const CONTRACT_ADDRESS = deployedInfo.contractAddress;
export const CHAIN_ID = ACTIVE_NETWORK.chainId;
export const RPC_URL = ACTIVE_NETWORK.rpcUrl;
export const NETWORK_LABEL = ACTIVE_NETWORK.label;

// ABI del contratto
export const CONTRACT_ABI = [
  'function admin() view returns (address)',
  'function isAuthorizedIssuer(address) view returns (bool)',
  'function addIssuer(address issuer)',
  'function removeIssuer(address issuer)',
  'function addDocumentType(string documentType)',
  'function removeDocumentType(string documentType)',
  'function documentTypes(uint256) view returns (string)',
  'function issueDocument(address recipient, bytes32 docHash, string metadataURI, string documentType)',
  'function revokeDocument(bytes32 docHash)',
  'function getDocument(bytes32 docHash) view returns (address issuer, address recipient, string metadataURI, uint256 issuedAt, bool revoked, string documentType)',
  'function transferAdmin(address newAdmin)',
  'event IssuerAdded(address indexed issuer)',
  'event IssuerRemoved(address indexed issuer)',
  'event DocumentTypeAdded(string documentType)',
  'event DocumentTypeRemoved(string documentType)',
  'event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed recipient, string documentType)',
  'event DocumentRevoked(bytes32 indexed hash)',
];

// Crea un hash del contenuto del documento (keccak256)
export const createDocumentHash = (content) => {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
};

// Formatta un indirizzo Ethereum abbreviato
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Formatta un timestamp Unix in data leggibile
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(Number(timestamp) * 1000).toLocaleString('it-IT');
};

/**
 * Chiede a MetaMask di passare alla rete configurata.
 * Se la rete non è presente nel wallet, la aggiunge automaticamente.
 */
export const switchToConfiguredNetwork = async () => {
  if (!window.ethereum) {
    alert('MetaMask non è installato!');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Errore 4902: la rete non è ancora nel wallet — la aggiungiamo
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.chainName,
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: ACTIVE_NETWORK.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Errore aggiunta rete:', addError);
        return false;
      }
    }
    console.error('Errore cambio rete:', switchError);
    return false;
  }
};

// Mantieni la compatibilità con il vecchio nome usato in App.js
export const switchToArbitrum = switchToConfiguredNetwork;
