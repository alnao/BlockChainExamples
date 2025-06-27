# SoliditySmartContract07DocumentValidatorArbitrum

Panoramica del sistema:
- Blockchain: Arbitrum (ottima scelta per costi e velocità).
- Tipo di documento: PDF generici, non standardizzati.
- Autorizzazione: Solo enti abilitati da un admin possono emettere certificati.
- Certificato: Il contenuto resta off-chain, ma il file è hashato e registrato on-chain per verificarne l'integrità.
- Utente finale: Può mostrare il PDF + verifica pubblica (via UI o contratto).


Smart contract – Funzioni principali
- `addIssuer(address)`: L’admin abilita un ente
- `removeIssuer(address)`: L’admin rimuove un ente
- `issueDocument(address user, bytes32 hash, string metadataURI)`: Un ente emette un certificato con hash del PDF
- `revokeDocument(bytes32 hash)`:Revoca un documento emesso (opzionale)
- `verifyDocument(bytes32 hash)`: Ritorna validità e metadati di un documento


Dati salvati on-chain
- PDF hash (SHA256 o keccak256 del file PDF)
- URI dei metadati (es. IPFS con JSON: nome corso, data, nome utente, ecc.)
- timestamp di emissione
- ente emettitore
- (opzionale) revocato: bool


Flusso di utilizzo
- Admin abilita ente A
- ente A carica un PDF, lo carica su IPFS, calcola l’hash
- Chiama issueDocument(user, hash, uri) → viene registrato on-chain
- Utente finale riceve URI + hash per verifica (es. via link)
- Chiunque può verificare l’autenticità fornendo l’hash del PDF


Sicurezza & Integrità
- Solo admin può modificare la whitelist di enti.
- Solo enti abilitati possono emettere documenti.
- Nessun documento può essere modificato post-emissione (immutabilità).
- Verifica semplice: l’hash del PDF deve coincidere con uno registrato.


## Disegno dettagliato dello smart contract
Lo smart contract deve:
- Consentire solo agli enti autorizzati di emettere documenti.
- Permettere all’admin di gestire gli enti.
- Salvare su blockchain:
- L’hash del PDF
- Un URI con metadati opzionali (es. link IPFS)
- Il wallet del destinatario
- Il wallet dell'emittente
- La data di emissione
- Fornire la possibilità di revocare un documento (opzionale).


## 2. Struttura tecnica
- Struttura del progetto
    ```
	/contracts
	  └── DocumentCertifier.sol
	/scripts
	  └── deploy.js
	.env
	hardhat.config.js
    ```
- Installa Hardhat (se non l’hai già):
    ```
	npm init -y
	npm install --save-dev hardhat
	npx hardhat
    ```
- Installa i pacchetti utili:
    ```
	npm install --save-dev @nomiclabs/hardhat-ethers ethers dotenv
    ```
- File `.env` per la chiave privata e l'RPC di Arbitrum:
    ```
    PRIVATE_KEY=0xyour_private_key
    # testnet: 
    ARBITRUM_RPC=https://sepolia-rollup.arbitrum.io/rpc
    # Prodnet
    ARBITRUM_RPC_PROD=https://arb1.arbitrum.io/rpc  
    ```
- File `hardhat.config.js`:
    ```
    require("@nomiclabs/hardhat-ethers");
    require("dotenv").config();
    module.exports = {
        solidity: "0.8.20",
        networks: {
        arbitrum: {
            url: process.env.ARBITRUM_RPC,
            accounts: [process.env.PRIVATE_KEY],
        },
        },
    };
    ```
- Script di deploy `scripts/deploy.js`:
    ```
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
    ```
- Esecuzione del deploy su Testnet (o su Arbitrum One):
    ```
	npx hardhat run scripts/deploy.js --network arbitrum
    ```
    Note: ottenere ETH testnet da: https://faucet.quicknode.com/arbitrum/sepolia
- Sviluppo di un frontend in react con grafica bootstrap:
    - Creazione del progetto
        ```
        npx create-react-app frontend
        npm install bootstrap
        index.js import 'bootstrap/dist/css/bootstrap.min.css';
        ```
	- Inserisci l’indirizzo del contratto in CONTRACT_ADDRESS.
	- Salva l’ABI del contratto in ./abis/DocumentCertifier.json.
	- Assicurati che Metamask sia configurato per Arbitrum.

- Test:
    - Creazione della cartella `test/`
    - Installazione: 
        ```
        npm install --save-dev @nomicfoundation/hardhat-toolbox
        ```
    - Esecuzione con il comando
        ```
        npx hardhat test
        ```


# Licenza
Questo progetto è distribuito sotto la licenza MIT. Vedi il file `LICENSE` per ulteriori informazioni.

