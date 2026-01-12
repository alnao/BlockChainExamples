# Solidity SmartContract07 Document Validator Arbitrum
Document Validator è un sistema per la certificazione e verifica di documenti costruito su blockchain Ethereum (compatibile con **Arbitrum**). Il sistema permette di emettere, verificare e revocare certificati digitali in modo sicuro e trasparente, garantendo l'integrità e l'autenticità dei documenti attraverso la tecnologia blockchain.
- Gestione Ruoli: Sistema di autorizzazioni con Admin e Issuer
- Emissione Documenti: Creazione di certificati digitali con hash univoci e categorizzazione dei documenti
- Verifica Documenti: Controllo dell'autenticità e validità dei documenti
- Revoca Documenti: Possibilità di invalidare certificati esistenti
- Metadata Support: Supporto per informazioni aggiuntive tramite URI
- Certificato: Il contenuto resta off-chain, ma il file è hashato e registrato on-chain per verificarne l'integrità.
- Utente finale non amministratore: Può mostrare il PDF + verifica pubblica (via UI o contratto).


Perché usare Arbitrum invece di Ethereum mainnet:
- Costi di transazione molto più bassi: Le fee su Arbitrum sono una frazione di quelle su Ethereum mainnet.
- Maggiore velocità: Le transazioni sono confermate più rapidamente.
- Scalabilità: Arbitrum può gestire molte più transazioni al secondo.
- Nessuna differenza nel linguaggio Solidity: I contratti scritti per Ethereum funzionano su Arbitrum senza modifiche.
- Deployment: Cambia solo la rete su cui fai il deploy (endpoint RPC, chainId).
- Limitazioni: Alcune opzioni avanzate (es. precompiles, gas estimation) possono comportarsi in modo leggermente diverso, ma per la maggior parte dei casi d’uso non ci sono differenze.
- Bridge: Se vuoi trasferire asset tra Ethereum e Arbitrum, devi usare bridge specifici.


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
- tipo documento: ogni documento ha un tipo, l'elenco dei tipi è gestito dall'utente amministratore


Flusso di utilizzo
- Admin abilita ente A e crea tipi di documenti
- Ente A carica un PDF, lo carica su IPFS, calcola l’hash
- Chiama issueDocument(user, hash, uri) e viene registrato on-chain
- Utente finale riceve URI + hash per verifica (es. via link)
- Chiunque può verificare l’autenticità fornendo l’hash del PDF


## 2. Struttura tecnica
- Struttura del progetto
    ```
	/contracts
	  └── DocumentCertifier.sol
	/scripts
      |   deploy.js
      |   generate-keys.js
	  └── interact.js
    /test
	  └── DocumentCertifier.test.js
	.env
	hardhat.config.js
    ```
- Installa Hardhat (se non già presente):
    ```
	npm init -y
	npm install --save-dev hardhat  --legacy-peer-deps
	npx hardhat
	npm install --save-dev @nomiclabs/hardhat-ethers ethers dotenv  --legacy-peer-deps
    ```
- File `.env` per la chiave privata e l'RPC di Arbitrum:
    ```
    PRIVATE_KEY=0xyour_private_key
    # testnet: 
    ARBITRUM_RPC=https://sepolia-rollup.arbitrum.io/rpc
    # Prodnet
    ARBITRUM_RPC_PROD=https://arb1.arbitrum.io/rpc  
    ```
- File `hardhat.config.js`, aggiungere la rete specifica:
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
- Script di deploy `scripts/deploy.js`: vedere il files
- Esecuzione del deploy su Testnet (o su Arbitrum One):
    ```
    npm init -y
    npm install --save-dev hardhat
    npm install --save-dev @nomiclabs/hardhat-ethers ethers
    npm install --save-dev dotenv
    npm install --save-dev ethers hardhat @nomicfoundation/hardhat-toolbox --legacy-peer-deps
    npm install --save-dev "@nomicfoundation/hardhat-chai-matchers@^2.0.0" "@nomicfoundation/hardhat-ethers@^3.0.0" "@nomicfoundation/hardhat-ignition-ethers@^0.15.0" "@nomicfoundation/hardhat-network-helpers@^1.0.0" "@nomicfoundation/hardhat-verify@^2.0.0" "@typechain/ethers-v6@^0.5.0" "@typechain/hardhat@^9.0.0" "@types/chai@^4.2.0" "@types/mocha@>=9.1.0" "chai@^4.2.0" "hardhat-gas-reporter@^2.3.0" "solidity-coverage@^0.8.1" "ts-node@>=8.0.0" "typechain@^8.3.0" "typescript@>=4.5.0" --legacy-peer-deps
    npm install --save-dev "@nomicfoundation/hardhat-ignition@^0.15.12" "@nomicfoundation/ignition-core@^0.15.12" --force
    npm install --save-dev hardhat@latest @nomicfoundation/hardhat-toolbox@latest
    npm install ethers@^6.8.0
- Generazione chiavi da eseguire solo la prima volta. 
    ```
    node scripts/generate-keys.js
    ```
    *il file non deve essere commitato e le chiavi NON devono mai essere condivise*
- Avvia la rete locale (in un terminale separato)
    ```
    npx hardhat node
    ```
    - oppure per non fermare la console
        ```
        npx hardhat node --no-watch 
        ```
    - se errore `Error: ENOSPC: System limit for number of file watchers reached, watch`
        ```
        # Controlla il limite attuale
        cat /proc/sys/fs/inotify/max_user_watches
        # Aumenta temporaneamente il limite
        sudo sysctl fs.inotify.max_user_watches=524288
        # Per renderlo permanente, aggiungi al file di configurazione
        echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
        # Ricarica la configurazione
        sudo sysctl -p
        ```
- Deploy del contratto (in un altro terminale se non fermato)
    ```
    npx hardhat run scripts/deploy.js --network localhost

    ```
    Vedere nella ripsosta quali sono gli account admin e issuer
    ```
    Network: localhost
    === Account disponibili ===
    Admin/Deployer: 0x123ABC
    Issuer 1: 0x123ABC
    Issuer 2: 0x123ABC
    Recipient 1: 0x123ABC
    Recipient 2: 0x123ABC
    Balance Admin: 10000.0 ETH
    === Deploying DocumentCertifier ===
    ✅ DocumentCertifier deployato!
    Contract Address: 0x123ABC
    Admin: 0x123ABC
    === Setup iniziale ===
    Aggiungendo issuer1 come autorizzato...
    ✅ Issuer1 aggiunto - TX: 0x123ABC
    Aggiungendo issuer2 come autorizzato...
    ✅ Issuer2 aggiunto - TX: 0x123ABC
    === Verifica autorizzazioni ===
    Issuer1 autorizzato: true
    Issuer2 autorizzato: true
    📄 Informazioni salvate in deployed-contract.json
    ```
- Interazione con il contratto
    ```
    npx hardhat run scripts/interact.js --network localhost
    ```
    Vedere la risposta dove viene salvato l'endpoint
- Esegui i test
    ```
    npm install --save-dev @nomicfoundation/hardhat-toolbox
    npx hardhat test --network localhost
    ```
- Possibile configurare il fork di Arbitrum *mah non dire*
    ```
    npx hardhat node --fork https://arb1.arbitrum.io/rpc
    modifica hardhat.config.js
    npx hardhat run scripts/deploy.js --network arbitrumFork
    ```
    - Note: ottenere ETH testnet da: https://faucet.quicknode.com/arbitrum/sepolia
- Frontend in react con grafica bootstrap:
    - Creazione del progetto
        ```
        npx create-react-app frontend
        cd frontend
        npm install bootstrap
        npm install bootstrap react-bootstrap ethers
        index.js import 'bootstrap/dist/css/bootstrap.min.css';
        npm build
        ```
    - Struttura progetto frontend
        ```
        frontend/
        ├── src/
        │   ├── components/
        │   │   ├── AdminPanel.js
        │   │   ├── IssuerPanel.js
        │   │   ├── VerifyDocument.js
        │   │   └── ConnectWallet.js
        │   ├── hooks/
        │   │   └── useContract.js
        │   ├── utils/
        │   │   └── contract.js
        │   ├── App.js
        │   └── index.js
        ├── contracts/
        ├── scripts/
        ├── tests/
        ├── hardhat.config.js
        └── package.json
        ```
    - Prima di eseguie il progetto aggiornare il file `frontend/src/utils/contract.js` con l'indirizzo contratto restituito nel punto precedente!
    - Configurazione metamask per prove in locale con frontend
        - aggiungere rete "ArbitrumLH GoChain Testnet" -> "Arbitrum locale 127.0.0.1:8545", "simbolo GO", chainId 31337
        - aggiungere indirizzi (chiavi) nel local-keys.json
        - configurazione di sicurezza: panino (tre barrette) > "all permissions" > `localhost:3000` > 
            - see accounts > "aggiungere path"
            - see networks > "ArbitrumLH GoChain Testnet"
    - Prove eseguite su frontend utilizzando gli address creati nel file `local-keys.json`:
        - selezionare su metamask account "admin"
            - rimuovi issuer (tra quelli che esiste già)
        - selezionare su metamask account issuer appena rimosso
            - notare che non può emettere documenti
        - selezionare su metamask account "admin"
            - aggiungere account appena tolto
        - selezionare su metamask account issuer appena rimesso
            - "emetti documento" in indirizzo e contenuto, segnarsi hash
        - selezionare su metamask account utente normale
            - verificare documento contenuto
            - verificare documento hash
        - selezionare su metamask account issuer
            - revocare il documento
        - selezionare su metamask account utente normale
            - verificare che il documento è revocato
        - selezionare utente admin e aggiungere un tipo documento e successivamente rimuovere un tipo documento
- Prossimi passi da sviluppare     
    - Arbitrum
    - Elenco documenti validati: non c'è un metodo per recupeare tutti i documenti firmati, potrebbe essere utile sviluppare una lista di documenti ciclabile, attualmente nello smart-contract c'è solo la mappa `mapping(bytes32 => Document) public documents;` che non è iterabile.
    - Audit log on-chain: Registra tutte le operazioni amministrative e di emissione/revoca in un log consultabile.
    - Estensione a layer 2 multipli: Oltre Arbitrum, aggiungi compatibilità con altre soluzioni (Optimism, zkSync).
    - Notifiche e webhook: Invia notifiche (email, webhook) agli utenti quando viene emesso o revocato un documento.


# &lt; AlNao /&gt;
Tutti i codici sorgente e le informazioni presenti in questo repository sono frutto di un attento e paziente lavoro di sviluppo da parte di AlNao, che si è impegnato a verificarne la correttezza nella misura massima possibile. Qualora parte del codice o dei contenuti sia stato tratto da fonti esterne, la relativa provenienza viene sempre citata, nel rispetto della trasparenza e della proprietà intellettuale. 


Alcuni contenuti e porzioni di codice presenti in questo repository sono stati realizzati anche grazie al supporto di strumenti di intelligenza artificiale, il cui contributo ha permesso di arricchire e velocizzare la produzione del materiale. Ogni informazione e frammento di codice è stato comunque attentamente verificato e validato, con l’obiettivo di garantire la massima qualità e affidabilità dei contenuti offerti. 


Per ulteriori dettagli, approfondimenti o richieste di chiarimento, si invita a consultare il sito [AlNao.it](https://www.alnao.it/).


## License
Made with ❤️ by <a href="https://www.alnao.it">AlNao</a>
&bull; 
Public projects 
<a href="https://www.gnu.org/licenses/gpl-3.0"  valign="middle"> <img src="https://img.shields.io/badge/License-GPL%20v3-blue?style=plastic" alt="GPL v3" valign="middle" /></a>
*Free Software!*


Il software è distribuito secondo i termini della GNU General Public License v3.0. L'uso, la modifica e la ridistribuzione sono consentiti, a condizione che ogni copia o lavoro derivato sia rilasciato con la stessa licenza. Il contenuto è fornito "così com'è", senza alcuna garanzia, esplicita o implicita.


The software is distributed under the terms of the GNU General Public License v3.0. Use, modification, and redistribution are permitted, provided that any copy or derivative work is released under the same license. The content is provided "as is", without any warranty, express or implied.
