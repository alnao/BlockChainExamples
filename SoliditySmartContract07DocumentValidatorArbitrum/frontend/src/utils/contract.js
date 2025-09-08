import { ethers } from 'ethers';

// Configurazione del contratto
export const CONTRACT_ADDRESS = "0xb1bFf47830DabEfF596c59b8D7dd37cD4c478e57"; // Sostituisci con l'address del tuo contratto
export const RPC_URL = "http://127.0.0.1:8545";
export const CHAIN_ID = 31337;

// Configurazione del contratto
//export const RPC_URL = "https://arb1.arbitrum.io/rpc"; // Cambiato per Arbitrum
//export const CHAIN_ID = 42161; // Arbitrum One

// ABI del contratto (versione semplificata delle funzioni principali)
export const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function isAuthorizedIssuer(address) view returns (bool)",
  "function addIssuer(address issuer)",
  "function removeIssuer(address issuer)",
  "function addDocumentType(string documentType)",
  "function removeDocumentType(string documentType)",
  "function documentTypes(uint256) view returns (string)",
  "function issueDocument(address recipient, bytes32 docHash, string metadataURI, string documentType)",
  "function revokeDocument(bytes32 docHash)",
  "function getDocument(bytes32 docHash) view returns (address issuer, address recipient, string metadataURI, uint256 issuedAt, bool revoked, string documentType)",
  "function transferAdmin(address newAdmin)",
  "event IssuerAdded(address indexed issuer)",
  "event IssuerRemoved(address indexed issuer)",
  "event DocumentTypeAdded(string documentType)",
  "event DocumentTypeRemoved(string documentType)",
  "event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed recipient, string documentType)",
  "event DocumentRevoked(bytes32 indexed hash)"
];

// Funzione per creare un hash del documento
export const createDocumentHash = (content) => {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
};

// Funzione per formattare l'indirizzo
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Funzione per formattare la data
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

export const switchToArbitrum = async () => {
  if (!window.ethereum) {
    alert('MetaMask non è installato!');
    return false;
  }

  try {
    // Try to switch to the configured network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: CHAIN_ID === 42161 ? 'Arbitrum One' : 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: CHAIN_ID === 42161 ? ['https://arbiscan.io'] : null,
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