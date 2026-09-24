# ⚙️ BlockChainExamples 🪙


<p align="center">
  <img src="https://img.shields.io/badge/Python-3766AB?logo=Python&logoColor=white" height=32/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=TypeScript&logoColor=white" height=32/>
  <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>
  <img src="https://img.shields.io/badge/React-61DAFB?logo=React&logoColor=white" height=32/>
  <br />
  <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/>
  <img src="https://img.shields.io/badge/Ethereum-000000?logo=Ethereum&logoColor=white" height=32/>
  <img src="https://img.shields.io/badge/Arbitrum-000000?logo=Arbitrum&logoColor=white" height=32/>
</p>

Questo repository raccoglie una serie di progetti e implementazioni relativi alla tecnologia blockchain, con particolare attenzione allo sviluppo di smart-contract su Ethereum e all'integrazione con applicazioni client. I progetti inclusi coprono diversi casi d'uso, tra cui sistemi di votazione 🗳️, gestione di NFT 🖼️, raccolte fondi 💰, validazione documentale on-chain 📄 e semplici blockchain didattiche in Python 🐍 e TypeScript 🟦. Ogni esempio è strutturato per favorire la comprensione delle principali tecniche di sviluppo, test e deployment di soluzioni decentralizzate, fornendo codice sorgente, script di migrazione, test automatici e, ove presente, interfacce utente per l'interazione con la blockchain.


🟡 Non divulgare mai le chiavi private associate ai tuoi account blockchain: custodirle con la massima attenzione è fondamentale per la sicurezza dei tuoi fondi e dei tuoi smart contract. Condividere o esporre accidentalmente una chiave privata può portare alla perdita irreversibile di tutti i tuoi asset digitali. 🟡


# Examples

| Section | Name | Description |
|-----|----|----|
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity06VotationsV2/) **HardhatSolidity06VotationsV2** | progetto di smart-contract per sistema di votazione evoluto rispetto all'esempio `TruffleSmartContract05Votations` è stato sviluppato con HardHat con aggiunta della gestione delle candidature e un sistema migliorato delle votazioni. *Funzionante* con semplice frontend per la gestione delle candidature e delle votazioni.<br/>Revisionato in luglio 2026 |
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity07DocumentValidatorArbitrum/) **HardhatSolidity07DocumentValidatorArbitrum** | progetto di smart-contract per sistema di validazione documento onChain: il contenuto di un documento viene salvato come hash on chain da un address emittende e chiunque può verificare la validità del contenuto. Con certificazione e verifica di documenti costruito su blockchain Ethereum compatibile con **Arbitrum**. L'esempio è *funzionante* con semplice frontend per la gestione dei documenti. Sviluppato con Hardhat e rilasciato su TestNet Sepolia. <br/>Revisionato in agosto 2026 |
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity08guessTheNumberGame/) **HardhatSolidity08guessTheNumberGame** | Un gioco blockchain "indovina il numero" multi-partita dove ogni utente può avviare la propria partita e chiunque può provare a indovinare su tutte le partite attive simultaneamente. Disponibile anche su **Testnet Sepolia** (vedi sezione dedicata in questo README) e rilasciato anche con geth su istanza AWS-EC2 con **geth** (vedi sezione dedicata in questo README) <br />Revisionato in settembre 2026|
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity09Staking/) **HardhatSolidity09Staking** | progetto di smart-contract per un sistema di Staking & Yield Farming dove gli utenti possono bloccare i loro token ERC20 per guadagnare interessi nel tempo. Esempio *funzionante* con token implementato, completo di test, script di interazione e client React con sincronizzazione automatica degli ABI e indirizzi. <br />Revisionato in settembre 2026 |
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity10DexAmm/) **HardhatSolidity10DexAmm** | progetto di Exchange Decentralizzato (AMM Constant Product $x \cdot y = k$) per la coppia NAO/ETH. Esempio *funzionante* con protezione ReentrancyGuard, tolleranza allo slippage, deadline e script di simulazione interattivo. <br />Revisionato in settembre 2026 |
| <img src="https://img.shields.io/badge/Hardhat-302C53?logo=Hardhat&logoColor=white" height=32/> <img src="https://img.shields.io/badge/Solidity-000000?logo=Solidity&logoColor=white" height=32/>| [`📁`](./HardhatSolidity11DaoGovernanceToken/) **HardhatSolidity11DaoGovernanceToken** | progetto di Organizzazione Autonoma Decentralizzata (DAO) basata su OpenZeppelin Governor (`ERC20Votes`, `TimeLock`). Esempio *funzionante* con ciclo di vita completo della proposta (Proposta $\rightarrow$ Voto $\rightarrow$ Queue $\rightarrow$ Esecuzione). |
| <img src="https://img.shields.io/badge/Python-3766AB?logo=Python&logoColor=white" height=32/> | [`📁`](./PythonBlockChain/) **PythonBlockChain** | esempio *funzionante* di BlockChain in python con entrmabi i tipi: mono-node e multi-node, è basato sull'algoritmo del *proof-of-work* |
| Truffle <br /> *deprecato* |  [`📁`](./TruffleFundraiserApplication/) **TruffleFundraiserApplication** | esempio *funzionante* di smart-contract che simula una raccolta fondi con metodi per donare e eventi, comprende anche una piccola applicazione React per eseguire le donazioni e gestire i fondi. Esempio preso dal capitolo 6 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly" |
| Truffle <br /> *deprecato* | [`📁`](./TruffleFundraiserFactory/) **TruffleFundraiserFactory** | esempio *funzionante* di smart-contract, partendo  dal FundraiserApplication vengono aggiunti i componenti per gestire più progetti. Esempio preso dal capitolo 7 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
| Truffle <br /> *deprecato* | [`📁`](./TruffleSmartContract01/) **TruffleSmartContract01** | esempio di smart-contract, esempio preso dal capitolo 4 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly", *non funzionante e nemmeno la IA riesce a capire il motivo!*
| Truffle <br /> *deprecato* | [`📁`](./TruffleSmartContract02/) **TruffleSmartContract02** | progetto di un semplice smart-contract, progetto creato prendendo spunto dalla guida di [freecodecamp.org](https://www.freecodecamp.org/italian/news/la-guida-completa-allo-sviluppo-completo-di-ethereum/), *non funzionante*
| Truffle <br /> *deprecato* | [`📁`](./TruffleSmartContract03/)  **TruffleSmartContract03**  | progetto di un semplice smart-contract, funzionante creato con l'aiuto di Claude partendo dai due punti precedenti, *funzionante* |
| Truffle <br /> *deprecato* | [`📁`](./TruffleSmartContract04NFT/)  **TruffleSmartContract04NFT** | progetto di smart-contract per la gestione di NFT molto semplice con la possibliti di creare/mintare NFT e di trasferirli. L'esempio è *funzionante* con script di esempio |
| Truffle <br /> *deprecato* | [`📁`](./TruffleSmartContract05Votations/) **TruffleSmartContract05Votations** | progetto di smart-contract per sistema di votazione (campagne e diritti al voto) con due web-app per la gestione delle campagne e i voti, *funzionante*. Presente uno script "invia-eth" per lo scambio di ETH, indispensabile perchè ogni chiamata allo smart consuma fee/gas e presente uno script per cambiare il presidente della campagna!
| <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=TypeScript&logoColor=white" height=32/> | [`📁`](./TypescriptBlockChain/) **TypescriptBlockChain** | esempio *funzionante* di BlockChain in typescript di tipo mono-node

- Nota: gli esempi sviluppati con Truffle sono *abbandonati* visto che Truffle è considerato deprecato e sostituito da Hardhat, vedere sezione dedicata sotto
- In Ethereum (standard ERC20), uno smart contract (come il gioco) non può prelevare token dal tuo portafoglio senza il tuo esplicito permesso. Presenti alcuni script per eseguire l'approvazione delle  fee necessarie per l'avvio delle partite e per i guess. E' una misura di sicurezza fondamentale: senza approve, la transazione transferFrom nel gioco fallirebbe.
- Il file `NAO-TOKEN-ERC20.sol` implementa un bello smartcontract, è pensato per essere identico tra  i progetti dove è presente (08, 09, 10, 12, 13)


## Coming soon 
- **HardhatSolidity12MarketplaceNFT**: NFT Marketplace con Royalties, *Esempio in fase di sviluppo*
- **HardhatSolidity13LotteryChainlink**: Lotteria con Chainlink VRF, *Esempio in fase di sviluppo*
- **Web3ProjectsExample1** 🏗️: esempio in fase di revisione, *Esempio in fase di sviluppo*



## Prerequisiti
La maggior parte dei progetti di esempio hanno bisogno di alcuni software dedicati: 
- Node.js (v22+) 
  - su Debian 13 i comandi per aggiornare Node.js alla versione 22 sono:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
    apt install nodejs	-y
    node -v
    ```
  - installazione della libreria web3 con il comando:
    - `npm install web3`
- **Hardhat** è un ambiente di sviluppo moderno per smart contract Ethereum che offre un'esperienza di sviluppo completa e flessibile. È diventato lo standard de facto per lo sviluppo di DApps negli ultimi anni. *Molto meglio di Ganache* 
- Truffle Framework installato nel sistema con il comando:
    - `npm install -g truffle`
    - `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`
- **Truffle** è uno dei primi e più maturi framework per sviluppo Ethereum, molto popolare fino a qualche anno fa.
    - `npm install @openzeppelin/contracts @nomicfoundation/hardhat-ethers @nomicfoundation/hardhat-toolbox`
    - Truffle è stato sostituito da Hardhat, molti esempi inizialmente previsti per Truffle sono stati adattati a Hardhat
- **Ganache** è stata una blockchain Ethereum locale pensata per lo sviluppo e il testing di smart contract in modo rapido e sicuro.
    - ogni volta che si avvia Ganache bisogna prestare attenzione a quale file di configurazione `truffle-config.js` è configurato
    - ogni rete ha 10 account configurati automaticamente, è possibile importare gli account anche su Metamask copiando le chiavi private
    - Ganache GUI usa spesso 1337 di default per l'RPC, anche se mostra 5777 nell'interfaccia
    - Ganache è stato sostituito da Hardhat, molti esempi inizialmente previsti per Ganache sono stati adattati a Hardhat
- **Metamask** o un altro wallet Ethereum per interagire con la blockchain
    - MetaMask è un wallet digitale che consente di gestire account Ethereum e interagire con dApp direttamente dal browser.
    - quando si esegue una rete in locale bisogna ricordarsi di censire su metamask la rete con i parametri
      - Network Name: Ganache / Hardhat
      - RPC URL: `http://127.0.0.1:7545`
      - Chain ID: `1337` (Ganache GUI usa spesso 1337 di default per l'RPC, anche se mostra 5777 nell'interfaccia. Prova 1337 prima. Se fallisce, prova 5777). A volte Hardhat usa la 31337.
      - Currency Symbol: ETH oppure NAO
    - se si usano più account su Metamask bisogna ricordarsi di autorizzare i successivi account, 
      - nelle vecchie versioni di metamask i passi da eseguire erano:
        - tre icone al fianco dell'account
        - voce "All permission"
        - selezionare la rete corretta come "localhost:3000" e selezionare gli account da abilitare
      - nella nuova versione di metamask i passi da seguire sono
        - tre icone in alto a destra
        - voce "siti connessi" / "Dapp Connections" e selezionare la rete `localhost:5173`
        - selezionare gli account da abilitare!
      - Senza questa configurazione la libreria web3 non funziona correttamente e nei frontend viene caricata SOLO l'account principale configurato in Metamask!
        - *Ho perso un sacco di tempo per questa stupida configurazione* 
- Per il rilascio su rete **Testnet Sepolia** è necessario un account nel sito `https://developer.metamask.io/`, per questi smartcontract di esempio è possibile usare senza problemi il profilo *free*
- Per il corretto funzionamento di questi esempi è consigliato utilizzare un sistema GNU Linux ma è possibile usare anche altri sistemi oprativi se ben configurati


## Esecuzione su Testnet Sepolia
**Sepolia** è una delle principali testnet pubbliche di Ethereum, progettata per testare smart contract e DApp in un ambiente sicuro e gratuito, senza usare ETH reale. È possibile configurare il tuo progetto con un endpoint RPC Sepolia (ad esempio Infura o Alchemy) e importare la chiave privata di un account con ETH di test ottenuto da un faucet. Puoi deployare e interagire con i tuoi smart contract su Sepolia come faresti su mainnet, ma *senza rischi economici o a costo zero*.


I passi per eseguire il rilascio del progetto di esempio "08 Guess the number" su rete Sepolia tramite Infura sono: 

1. Registrarsi su Infura nel sito `https://developer.metamask.io/`. Per le prove di un semplice SmartContract è possibile selezionare il piano gratuito che prevede una API Key e un numero limitato di richieste. In fase di creazione della key vengono generati un KeyId e un KeySecret. Nelle pagine di configurazione `https://developer.metamask.io/key/settings` è possibile recuperare l'AccountId, utile per determinare l'endpoint della rete che sarà del tipo:
    ```
    https://sepolia.infura.io/v3/<account_id>
    ```
    La lista di tutti gli endpoint a disposizione su Infura è disponibile nella sezione "Active Endpoints" nel dettaglio delle API.

2. Testare la rete creata con una chiamata alle API, per esempio usando il comando `curl`:
    ```bash
    curl --user :<YOUR-API-KEY-SECRET> \
      https://sepolia.infura.io/v3/<YOUR-API-KEY> \
      -d '{"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}'  
    ```

3. **Monitoraggio Limiti**: Utilizzare questo servizio richiede di monitorare l'utilizzo per rimanere entro i limiti previsti dal profilo *free* di Infura; per un uso intensivo è necessario effettuare l'[upgrade a un piano a pagamento](https://docs.metamask.io/developer-tools/dashboard/how-to/upgrade-your-plan/) che offre limiti più elevati rispetto a quelli gratuiti. Tutti i dettagli sono descritti nella [Documentazione ufficiale](https://docs.metamask.io/developer-tools/dashboard/how-to/secure-an-api/set-rate-limits/).

4. Procurarsi la chiave privata di un account testnet con ETH di test (puoi usare faucet pubblici):
    - **Nota sulla Chiave Privata**: La chiave privata non viene generata da Infura (che fornisce solo i nodi RPC), ma dal proprio wallet Ethereum (ad esempio **MetaMask**: *Dettagli Account* $\rightarrow$ *Mostra chiave privata*).

5. Nel progetto installare le dipendenze dichiarate nel `package.json`:
    ```bash
    npm install --legacy-peer-deps
    ```

6. Configurare il file `.env` (e `hardhat.config.js`) per la rete specifica:
    ```env
    PRIVATE_KEY=0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    PUBLIC_KEY=0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
    SECOND_PRIVATE_KEY=0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
    INFURA_PROJECT_ID=DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD
    ```
    Nel file `.env` è necessario indicare la PROJECT_ID/KEY_ID creata su Infura e le chiavi private. La prima chiave sarà usata come owner/deployer del contratto, mentre le successive saranno utilizzate dallo script `interact.js`.

    🟡 **Attenzione**: Non rilasciare mai nei repository le chiavi private! Inserire sempre il file `.env` all'interno di `.gitignore` per evitare di pubblicarle accidentalmente.

7. Deploy sulla testnet Sepolia: avviare lo script di deploy puntando alla rete `sepolia`:
    ```bash
    npx hardhat run scripts/deploy.js --network sepolia
    ```

8. Gestione errore *insufficient funds*: al deploy nella rete Sepolia è necessario avere a disposizione degli Sepolia-ETH token per coprire il gas della transazione, altrimenti l'errore sarà `ProviderError: insufficient funds for gas * price + value: balance 0, tx cost xxxxxx`. Per ovviare a questo problema è possibile richiedere i token tramite i siti faucet (ad esempio `https://cloud.google.com/application/web3/faucet/ethereum/sepolia`). Dopo aver ricevuto i fondi, verifica il balance su Etherscan `https://sepolia.etherscan.io/address/0xACCA51187901f1caC30aFa57A2Ce5beA5151Ea78`

9. Una volta rilasciato lo smart contract comparirà un messaggio del tipo:
    ```
    Deploying contracts with the account: 0x1234567890ABCDEF1
    MockToken deployed to: 0x1234567890ABCDEF2
    GuessTheNumberMulti deployed to: 0x1234567890ABCDEF3
    Indirizzi salvati in: HardhatSolidity08guessTheNumberGame/deployed-addresses.json
    Deployment completed!
    Token address: 0x1234567890ABCDEF4
    Game address: 0x1234567890ABCDEF5
    ```

10. Infine sarà possibile interagire con lo smart contract manualmente tramite lo script:
    ```bash
    npx hardhat run scripts/interact.js --network sepolia
    ```
    Tramite MetaMask è possibile monitorare gli spostamenti dei token Sepolia ETH e dei token NAO (se l'indirizzo del token viene aggiunto a MetaMask). In aggiunta è possibile verificare transazioni ed eventi su **Etherscan Sepolia**.

### Etherscan Sepolia
*Etherscan Sepolia* è un block explorer dedicato alla testnet Sepolia di Ethereum, che permette di visualizzare in tempo reale transazioni, blocchi, indirizzi, smart contract e i loro eventi sulla rete Sepolia. Offre strumenti per verificare e interagire con smart contract (funzioni "Read/Write Contract") direttamente dal browser, purché il contratto sia stato verificato pubblicamente. È accessibile all’indirizzo https://sepolia.etherscan.io/.

Per esempio all'indirizzo:
```
https://sepolia.etherscan.io/address/0xAAAAAAAAAAAAAAA
```
è possibile monitorare i movimenti e lo stato del contratto.


## AWS Managed Blockchain


**AWS Managed Blockchain** è un servizio completamente gestito offerto da Amazon Web Services che permette di creare, gestire e scalare facilmente reti blockchain utilizzando framework open source come Hyperledger Fabric ed Ethereum. Questo servizio elimina la complessità dell’installazione manuale, della configurazione e della gestione dell’infrastruttura blockchain, consentendo agli sviluppatori e alle aziende di concentrarsi sulle applicazioni e sui casi d’uso.
- ✅ **Caratteristiche principali**
    - **Gestione semplificata**: AWS si occupa della creazione dei nodi, della gestione dei certificati, del monitoraggio della rete e degli aggiornamenti software, riducendo notevolmente il carico operativo.
    - **Scalabilità**: È possibile aggiungere o rimuovere rapidamente nodi di rete in base alle esigenze del progetto, senza dover riconfigurare l’intera infrastruttura.
    - **Affidabilità e sicurezza**: Il servizio integra le best practice di sicurezza AWS, tra cui la gestione delle chiavi, il controllo degli accessi tramite IAM e la cifratura dei dati in transito e a riposo.
    - **Supporto multi-framework**: Attualmente supporta Hyperledger Fabric (ideale per consorzi privati) ed Ethereum (per applicazioni pubbliche o consorziate).
- 🟢 **Casi d’uso**
    - **Tracciabilità della filiera**: Monitoraggio trasparente di prodotti e materiali lungo la catena di approvvigionamento.
    - **Gestione di asset digitali**: Creazione e scambio sicuro di token, NFT o altri asset digitali.
    - **Automazione di processi tramite smart contract**: Esecuzione automatica di accordi e transazioni senza intermediari.
    - **Consorzi aziendali**: Collaborazione tra più organizzazioni con regole condivise e dati immutabili.
- 📦 **Vantaggi rispetto alla gestione autonoma**
    - **Riduzione dei tempi di avvio**: Bastano pochi click per creare una rete blockchain funzionante.
    - **Costi operativi inferiori**: Non è necessario gestire server, aggiornamenti o sicurezza a basso livello.
    - **Integrazione con altri servizi AWS**: Facile collegamento con servizi come Amazon S3, Lambda, CloudWatch e IAM.
- 📝 *Limiti attuali*
    - **Supporto alle testnet**: Al momento, AWS Managed Blockchain non supporta tutte le testnet pubbliche di Ethereum (ad esempio Sepolia), il che può limitare lo sviluppo e il testing di smart contract.
    - **Vincoli di configurazione**: Alcune personalizzazioni avanzate potrebbero non essere disponibili rispetto a una rete blockchain gestita in autonomia.

Il supporto di AWS Managed Blockchain per la rete deprecata Goerli è terminato il 1° aprile 2024 Amazon Managed Blockchain Features
Goerli era l'ultima testnet supportata: AWS non ha ancora aggiunto il supporto per Sepolia (la testnet attualmente raccomandata)
- Goerli: supporto terminato ad aprile 2024
- Rinkeby, Ropsten: deprecate anni fa
- Sepolia: NON ancora supportata da AWS Managed Blockchain

🟡 Conclusione: Al momento, **AWS Managed Blockchain non è una buona scelta** per testare smart contract perché non supporta testnet attive. Meglio usare Infura/Alchemy + Sepolia o lavorare in locale con Hardhat!

Su AWS Managed Blockchain NON è più possibile creare una nuova rete Ethereum privata. La funzione “Create network” è disponibile solo per Hyperledger Fabric. Per Ethereum, AWS Managed Blockchain permette solo di creare nodi su reti pubbliche (Mainnet) o, se supportate, su alcune testnet pubbliche. Non puoi più creare una rete Ethereum privata come si poteva nelle versioni precedenti del servizio.

In sintesi: Cosa puoi fare per testare i tuoi smart contract:
- Usa una testnet pubblica (Sepolia, Holesky, ecc.) tramite provider come Infura o Alchemy.
- Crea una rete privata su EC2 (con Geth, Besu, ecc.) se vuoi una blockchain privata in cloud.
- Usa ambienti locali come Hardhat o Ganache per sviluppo e test.


## Esecuzione su EC2 con geth
Una possibilità è eseguire **Geth** su un’istanza AWS-EC2 per rilasciare uno smart contract ed eseguire operazioni. Nell’esempio viene usato *HardhatSolidity08guessTheNumberGame*. I passi da seguire sono:

1. Avviare una nuova istanza EC2
    - Andare su **EC2** → **Launch Instance**
      - Scegliere una AMI Ubuntu (es: Ubuntu 22.04 LTS)
      - Scegliere una dimensione (t2.medium o superiore per test)
      - Scegliere una chiave pem già esistente (o crearne una nuova)
      - Configurare il security group:
          - Autorizzare porta SSH-22 dall’IP attuale
          - Autorizzare le porte **30303** (TCP/UDP) e **8545** (RPC, opzionale, solo per IP sicuri)
          - Nota sicurezza: non esporre la porta 8545 pubblicamente in produzione! Usare VPN o limitare l’accesso agli IP sicuri. Questo è solo un esempio/prototipo a titolo di 
      - Avviare l’istanza e annotare l’IP pubblico
    - Nell'esempio `HardhatSolidity08guessTheNumberGame` è stato creato lo script `./create_ec2_node.sh` che salva anche l'ip nel file `.env` locale, poi è disponibile anche il `destroy_ec2_node.sh` per distruggere la EC2 e il security group!
2. Connettersi via SSH
    ```bash
    ssh -i /percorso/chiave.pem ubuntu@<IP_EC2>
    ```

3. Installare Geth (alla versione stabile v1.13 e non la ultimissima)
    ```bash
    sudo apt update
    cd ~
    wget https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.13.15-c5ba367e.tar.gz
    tar -xvf geth-linux-amd64-1.13.15-c5ba367e.tar.gz
    sudo mv geth-linux-amd64-1.13.15-c5ba367e/geth /usr/local/bin/
    rm -rf geth-linux-amd64-1.13.15-c5ba367e*
    sudo chmod 777 /usr/local/bin/geth 
    # Verifica la versione
    geth -version
    ```
    - La versione dovrebbe essere la `1.13.15-stable-c5ba367e`
    - **Nota sulle versioni recenti**: esistono versioni più recenti installabili tramite il repository ufficiale (es. `ppa:ethereum/ethereum`), ma dalla versione 1.14 in poi Geth ha rimosso o fortemente limitato il supporto alle reti locali legacy (Proof of Work e Proof of Authority/Clique). Installando versioni recenti si incapperà nell'errore:
      `ERROR: Geth only supports PoS networks. Please transition legacy networks using Geth v1.13.x. Fatal: Failed to register the Ethereum service: 'terminalTotalDifficulty' is not set in genesis block`.
      Pertanto, **è necessario utilizzare la versione 1.13.15** per questo setup basato su Proof of Authority (Clique).

4. Inizializzare la rete privata
    - Creare una cartella per la blockchain:
      ```bash
      mkdir ~/mychain && cd ~/mychain
      ```
    - Creare un file di genesis (esempio minimal):
      ```bash
      nano genesis.json
      ```
    - Incollare il contenuto (poi sarà modificato):
      ```json
      {
        "config": {
          "chainId": 2025,
          "homesteadBlock": 0,
          "eip150Block": 0,
          "eip155Block": 0,
          "eip158Block": 0,
          "byzantiumBlock": 0,
          "constantinopleBlock": 0,
          "petersburgBlock": 0,
          "istanbulBlock": 0,
          "berlinBlock": 0,
          "londonBlock": 0,
          "terminalTotalDifficulty": 0
        },
        "difficulty": "0x1",
        "gasLimit": "8000000",
        "alloc": {}
      }

      ```
5. Inizializzare la blockchain:
    ```bash
    geth --datadir ~/mychain init genesis.json
    
    ```

6. Sbloccare un nuovo account per il deploy e creare un account:
    ```bash
    geth --datadir ~/mychain account new
    geth --datadir ~/mychain account list
    ```
    - Viene chiesto di inserire una password (scegline una e ricordala!).
    - Annotare l’indirizzo pubblico del nuovo account
      - *Nota*: Se il primo comando non mostra l'indirizzo in chiaro, il secondo comando (`account list`) restituirà la lista degli account insieme al percorso del file keystore da utilizzare nel passo successivo.

7. Recuperare la chiave privata dalla password tramite uno script Node.js:
    - Installare nodejs, npm e web3:
      - non usare il pacchetto ufficiale perchè sarebbe troppo vecchia la versione installata con `sudo apt install nodejs npm`
      ```bash
      # Scarica lo script di setup per Node.js 20 (LTS)
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      # Installa Node.js
      sudo apt-get install -y nodejs
      npm install web3
      ```
    - Recuperare il nomefile nel keystore:
      ```bash
      ls /home/ubuntu/mychain/keystore/
      ```
    - Scrivere il file `web3.js` inserendo i parametri corretti come nomeFile e password dei punti precedenti:
      ```js
      const fs = require('fs');
      const { Web3 } = require('web3');

      const keyfile = fs.readFileSync('/home/ubuntu/mychain/keystore/UTC--<nome-nel-keystore>').toString();
      const password = '<la-tua-password>';
      const web3 = new Web3();
      const account = web3.eth.accounts.decrypt(JSON.parse(keyfile), password);
      account.then(e => console.log(e) );
      console.log('Private key:', account.privateKey);
      console.log('Address:', account.address);
      ```
    - Eseguire lo script:
      ```bash
      node web3.js
      ```
    - Annotare la private key (senza condividerla)
    - Creare variabile con la public-key
      ```bash
      ADDR="ABC" #senza 0x
      echo "0x$(printf '%064d' 0)${ADDR}$(printf '%0130d' 0)"
      ```

8. Allocare ETH all’account per poter deployare lo smart contract:
    - Modificare il file `genesis.json` nella sezione alloc:
      ```json
      {
        "config": {
          "chainId": 2025,
          "homesteadBlock": 0,
          "eip150Block": 0,
          "eip155Block": 0,
          "eip158Block": 0,
          "byzantiumBlock": 0,
          "constantinopleBlock": 0,
          "petersburgBlock": 0,
          "istanbulBlock": 0,
          "berlinBlock": 0,
          "londonBlock": 0,
          "clique": {
            "period": 15,
            "epoch": 30000
          }
        },
        "difficulty": "1",
        "gasLimit": "8000000",
        "extradata": "0x<valore-mostrato-al-punto-precedente-con-tanti-zeri>",
        "alloc": {
          "<address-senza-0x>": {
            "balance": "1000000000000000000000"
          }
        }
      }
      ```
      - L’indirizzo corrisponde al campo `address` del punto precedente e deve essere inserito senza il prefisso `0x`
      - Il valore di `extradata` deve essere quello tornato al punto precedene dall'istruzione ```echo "0x$(printf '%064d' 0)${ADDR}$(printf '%0130d' 0)"```
    - Riavviare la chain (rimuovendo la catena precedente) e impostando l'address del punto precedente:
      ```bash
      ADDR="0xADDRESS-CHIAVE-PUBBLICA-CON0x"
      echo "LA_TUA_PASSWORD" > password.txt
      killall geth
      rm -rf ~/mychain/geth
      geth --datadir ~/mychain init genesis.json
      # Avvio geth
      geth --datadir ~/mychain --networkid 2025 \
        --http --http.addr "0.0.0.0" --http.port 8545 \
        --http.api "eth,net,web3,debug,clique" \
        --nodiscover \
        --mine --miner.etherbase $ADDR \
        --unlock $ADDR --password password.txt \
        --allow-insecure-unlock
      ```
    - **Note aggiuntive**: 
      - **Clique (Proof-of-Authority)** è la modalità utilizzata in questo esempio per la rete privata. Non richiede mining intensivo e i blocchi vengono firmati automaticamente dall'account "sealer" configurato.
      - Aggiungere `--http.corsdomain "*"` e `--http.vhosts "*"` per test da remoto (da fare **solo in ambienti sicuri/VPN**, mai esporre RPC pubblicamente senza protezioni).
      - Come già detto, è imperativo rimanere sulla versione `1.13.x` per evitare conflitti con la rimozione del supporto legacy nelle versioni più recenti di Geth.
9. Deployare lo smart contract nella rete corretta usando l’endpoint `http://<PUBLIC_IP_EC2>:8545` come RPC endpoint nel file di configurazione Hardhat modificando il file `.env` locale 
    - In ogni caso bisogna modificare il file impostando "PUBLICK_KEY" e "PRIVATE_KEY" restituita al punto 7 ma se è stato usato lo script `create_ec2_node.sh` non serve eseguire l'aggiornamento del file
    - Configuare il file `addresses.js` con il nome della rete corretto `ec2geth`
    - Aggiornare il file `.env` con l'indirizzo ip del server
    - Configurazione IP server
      ```
      IP_EC2="<IP_EC2>"
      PUBLIC_KEY="<PUBLIC_KEY_CON_0x>"
      curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["<0xADDRESS-CHIAVE-PUBBLICA>", "latest"],"id":1}' -H "Content-Type: application/json" http://$IP_EC2:8545
      ```
      - Se la risposta contiene "result":"0x0", significa che il genesis non è stato caricato. Se invece vedi un valore esadecimale grande (es. 0x123456789), allora i fondi ci sono.
    - Eseguire transazione dall'indirizzo main ad un indirizzo (indirizzo indicato come `Deploying contracts with the account`)
      ```
      curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_sendTransaction","params":[{
          "from":"0xSORGENTE",
          "to":"0xDESTINAZIONE",
          "value":"0x56bc75e2d63100000"
        }],"id":1}' \
        http://$IP_EC2:8545
      # stato della transazione: "status":"0x1" = riuscita
      curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["<TX_HASH>"],"id":1}' \
        http://$IP_EC2:8545

      # saldo del destinatario
      curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xDESTINAZIONE","latest"],"id":1}' \
        http://$IP_EC2:8545
      ```  
    - Eseguire il deploy:
      ```bash
      npx hardhat run scripts/deploy.js --network ec2geth
      ```
    - Il risulstato è del tipo:
      ```
      Deploying contracts with the account: 0xAAAAAAAA
      MockToken deployed to: 0xBBBBBB
      GuessTheNumberMulti deployed to: 0xCCCCCCCCCCC
      Indirizzi salvati in: deployed-addresses.json

      Deployment completed!
      Token address: 0xCCCCCCCCCCCC
      Game address: 0xDDDDDDDD
      ```
    - Annotare gli indirizzi dei contratti e verificare il contenuto del file `deployed-addresses.json`

10. Interagire con il contratto:
    - Aprire la console Hardhat (opzionale):
      ```bash
      IP_EC2="<IP_EC2>"
      PUBLIC_KEY="<PUBLIC_KEY_CON_0x>"
      npx hardhat console --network ec2geth
      ```
    - Eseguire lo script di interazione CLI interattiva:
      ```bash
      npx hardhat run scripts/interact.js --network ec2geth
      ```

11. **Esecuzione dei Test (in Locale e su Nodo EC2 / Remote Network)**:
    - **Esecuzione dei Test Unitari in Locale (Hardhat Network In-Memory)**:
      Per verificare la correttezza della logica di business, prevenzione DoS, reentrancy e rate limiting senza consumare gas reale:
      ```bash
      cd HardhatSolidity08guessTheNumberGame
      npm test
      # Oppure
      npx hardhat test
      ```
    - **Esecuzione dei Test/Interazione contro Nodo EC2 (Geth Privato)**:
      - Quando il nodo Geth su EC2 è in esecuzione ed ha aperto la porta `8545` (`--http.addr "0.0.0.0"` e `--http.corsdomain "*"`):
      1. Verificare che l'indirizzo IP del nodo EC2 sia configurato nel file `.env`:
         ```env
         EC2_URL=http://<IP_EC2>:8545
         PRIVATE_KEY=0x<CHIAVE_PRIVATA_ACCOUNT_EC2>
         ```
      2. Eseguire il deploy dei contratti sulla rete EC2:
         ```bash
         npx hardhat run scripts/deploy.js --network ec2geth
         ```
      3. Verificare la connettività e lo stato dei contratti rilasciati avviando lo script di interazione:
         ```bash
         npx hardhat run scripts/interact.js --network ec2geth
         ```
      4. In caso di test automatici su rete live o locale Hardhat, è consigliato utilizzare il network helper `evm_increaseTime` ed `evm_mine` forniti da Hardhat Network Helpers per simulare il passaggio del tempo (es. scadenze di 30 giorni per `cancelGame` o finestre di 7 ore per il rate limit).


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
