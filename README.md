# ⚙️ BlockChainExamples 🪙


Questo repository raccoglie una serie di progetti e implementazioni relativi alla tecnologia blockchain, con particolare attenzione allo sviluppo di smart-contract su Ethereum e all'integrazione con applicazioni client. I progetti inclusi coprono diversi casi d'uso, tra cui sistemi di votazione 🗳️, gestione di NFT 🖼️, raccolte fondi 💰, validazione documentale on-chain 📄 e semplici blockchain didattiche in Python 🐍 e TypeScript 🟦. Ogni esempio è strutturato per favorire la comprensione delle principali tecniche di sviluppo, test e deployment di soluzioni decentralizzate, fornendo codice sorgente, script di migrazione, test automatici e, ove presente, interfacce utente per l'interazione con la blockchain.



- **FundraiserApplication** 💰: esempio *funzionante* di smart-contract che simula una raccolta fondi con metodi per donare e eventi, comprende anche una piccola applicazione React per eseguire le donazioni e gestire i fondi. Esempio preso dal capitolo 6 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
- **FundraiserFactory** 🏭: esempio *funzionante* di smart-contract, partendo dal FundraiserApplication vengono aggiunti i componenti per gestire più progetti. Esempio preso dal capitolo 7 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
    - Il client è una applicazione React descritta nel capito e il codice è preso dal repository [RedSquirrelTech](https://github.com/RedSquirrelTech/hoscdev/tree/master/chapter-7/fundraiser) e modificato per gestire tutto poi sistemato con Claude per funzionare e gestire le transazioni
    - Il client per funzionare deve avere Ganache configurato con il file `truffle/truffle-config.js`, verificare che i DUE smart-contract siano presenti in ganache e siano in stato "deployed", prestare attenzione a rimuovere eventuali altri file di configurazione presenti (per esempio l'esempio FundraiserApplication va in contrasto con questo)
    - Su metamask il cambio di account deve essere configurato: dopo aver selezionato la rete, cliccare sui tre puntini a fianco degli account e selezionare la voce "All Permission", qui selezionare la rete corretta e abilitare gli account corretti. Senza questa configurazione cambiando account su metamask non viene visualizzato il nuovo account nella app, *io ho perso un sacco di tempo perchè non si capisce il motivo*.
- **JavascriptBlockChain** 🟦: semplice esempio di BlockChain in typescript di tipo mono-node
- **PythonBlockChain** 🐍: esempio di BlockChain in python con entrmabi i tipi: mono-node e multi-node, è basato sull'algoritmo del *proof-of-work*
- **SoliditySmartContract01** 📝: esempio di primo smart contract, ispirato al capitolo 4 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly", *non funzionante e nemmeno la IA riesce a capire il motivo!*
- **SoliditySmartContract02** 📚: progetto di un semplice smart-contract, progetto creato prendendo spunto dalla guida di [freecodecamp.org](https://www.freecodecamp.org/italian/news/la-guida-completa-allo-sviluppo-completo-di-ethereum/), *non funzionante*
- **SoliditySmartContract03** ✅: progetto di un semplice smart-contract, funzionante creato con l'aiuto di Claude partendo dai due punti precedenti, *funzionante*
- **SoliditySmartContract04NFT** 🖼️: progetto di smart-contract per la gestione di NFT molto semplice con la possibliti di creare/mintare NFT e di trasferirli. L'esempio è *funzionante* con script di esempio 
- **SoliditySmartContract05Votations** 🗳️: progetto di smart-contract per sistema di votazione (campagne e diritti al voto) con due web-app per la gestione delle campagne e i voti, *funzionante*
    - presente uno script "invia-eth" per lo scambio di ETH, indispensabile perchè ogni chiamata allo smart consuma fee/gas!
    - presente uno script per cambiare il presidente della campagna!
- **SoliditySmartContract06VotationsV2** 👥: progetto di smart-contract per sistema di votazione evoluto rispetto al punto precedente con in agggiunta l'avvio specifico delle campagna, gestione delle cadidature e un sistema migliorato delle votazioni. *Funzionante* con semplice frontend per la gestione delle candidature e delle votazioni
- **SoliditySmartContract07DocumentValidatorArbitrum** 📎: progetto di smart-contract per sistema di validazione documento onChain (i documenti vengono salvati da un emittende e chiunque può verificare la validità). Document Validator è un sistema per la certificazione e verifica di documenti costruito su blockchain Ethereum compatibile con **Arbitrum**. Il sistema permette di emettere, verificare e revocare certificati digitali in modo sicuro e trasparente, garantendo l'integrità e l'autenticità dei documenti attraverso la tecnologia blockchain, *funzionante* con semplice frontend per la gestione dei documenti. Sviluppato con Hardhat.
- **SoliditySmartContract08guessTheNumberGame** 🎲: Un gioco blockchain "indovina il numero" multi-partita dove ogni utente può avviare la propria partita e chiunque può provare a indovinare su tutte le partite attive simultaneamente. Sviluppato con **Hardhat**, per eseguirlo in locale non servono truffle, ganache e metamask.
    - esempio eseguito anche con geth su istanza AWS-EC2 (visto che Amazon Managed Blockchain non prevede rete di test)
- **Web3ProjectsExample1** 🏗️: esempio in fase di revisione


## Prerequisiti
La maggior parte dei progetti di esempio hanno bisogno di alcuni software dedicati: 
- Node.js (v14+) con installazione della libreria web3 con il comando:
    - `npm install web3`
- **Hardhat** è un ambiente di sviluppo moderno per smart contract Ethereum che offre un'esperienza di sviluppo completa e flessibile. È diventato lo standard de facto per lo sviluppo di DApps negli ultimi anni. *Molto meglio di Truffle* e non necessita di Ganache per funzionare in locale. 
- Truffle Framework installato nel sistema con il comando:
    - `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`
    - **Truffle** è uno dei primi e più maturi framework per sviluppo Ethereum, molto popolare fino a qualche anno fa.
    - `npm install @openzeppelin/contracts @nomicfoundation/hardhat-ethers @nomicfoundation/hardhat-toolbox`
- **Ganache** o un'altra blockchain Ethereum locale per lo sviluppo
    - Ganache è una blockchain Ethereum locale pensata per lo sviluppo e il testing di smart contract in modo rapido e sicuro.
    - ogni volta che si avvia Ganache bisogna prestare attenzione a quale file di configurazione `truffle-config.js` è configurato
    - ogni rete ha 10 account configurati automaticamente, è possibile importare gli account anche su Metamask copiando le chiavi private
- **Metamask** o un altro wallet Ethereum per interagire con la blockchain
    - MetaMask è un wallet digitale che consente di gestire account Ethereum e interagire con dApp direttamente dal browser.
    - se si usano più account su Metamask bisogna ricordarsi di autorizzare i successivi account: cliccando su tre icone al fianco dell'account, premere su voce "All permission", selezionare la rete corretta come "localhost:3000" e selezionare gli account da abilitare. Senza questa configurazione la libreria web3 non funziona correttamente e nei frontend viene caricata SOLO l'account principale configurato in Metamask! *Ho perso un sacco di tempo per questa stupida configurazione* 
- Per il corretto funzionamento di questi esempi è consigliato utilizzare un sistema GNU Linux ma è possibile usare anche altri sistemi oprativi se ben configurati.


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
Una possibilità è eseguire **Geth** su un’istanza AWS-EC2 per rilasciare uno smart contract ed eseguire operazioni. Nell’esempio viene usato *SoliditySmartContract08guessTheNumberGame*. I passi da seguire sono:

1. Avviare una nuova istanza EC2
    - Andare su **EC2** → **Launch Instance**
    - Scegliere una AMI Ubuntu (es: Ubuntu 22.04 LTS)
    - Scegliere una dimensione (t2.medium o superiore per test)
    - Scegliere una chiave pem già esistente (o crearne una nuova)
    - Configurare il security group:
        - Autorizzare porta SSH-22 dall’IP attuale
        - Autorizzare le porte **30303** (TCP/UDP) e **8545** (RPC, opzionale, solo per IP sicuri)
        - Nota sicurezza: non esporre la porta 8545 pubblicamente in produzione! Usare VPN o limitare l’accesso agli IP sicuri. Questo è solo un esempio/prototipo
    - Avviare l’istanza e annotare l’IP pubblico

2. Connettersi via SSH
    ```bash
    ssh -i /percorso/chiave.pem ubuntu@<IP_EC2>
    ```

3. Installare Geth
    ```bash
    sudo add-apt-repository -y ppa:ethereum/ethereum
    sudo apt update
    sudo apt install -y ethereum
    geth -version
    ```
    La versione dovrebbe essere `geth version 1.16.3-stable-d818a9af` (a settembre 2025)

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
          "terminalTotalDifficulty": "0"
        },
        "difficulty": "0x1",
        "gasLimit": "8000000",
        "alloc": {}
      }
      ```
    - Inizializzare la blockchain:
      ```bash
      geth --datadir ~/mychain init genesis.json
      ```

5. Avviare il nodo per creare la prima rete
    ```bash
    geth --datadir ~/mychain --networkid 2025 --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,personal" --allow-insecure-unlock --nodiscover --mine
    ```
    - Aggiungere `--http.corsdomain "*"` e `--http.vhosts "*"` per test da remoto (solo in ambienti sicuri)

6. Sbloccare un nuovo account per il deploy e creare un account:
    ```bash
    geth --datadir ~/mychain account new
    geth --datadir ~/mychain account list
    ```
    - Viene chiesto di inserire una password (scegline una e ricordala!).
    - Annotare l’indirizzo pubblico del nuovo account
    - A me non mostra l'account di risposta e il secondo comando ritorna la lsita degli account con il file di riferimento da annotare per il prossimo passo

7. Recuperare la chiave privata dalla password tramite uno script Node.js:
    - Installare nodejs, npm e web3:
      ```bash
      sudo apt install nodejs npm
      npm install web3
      ```
    - Scrivere il file web3.js:
      ```js
      const fs = require('fs');
      const { Web3 } = require('web3');

      const keyfile = fs.readFileSync('/home/ubuntu/mychain/keystore/UTC--<nomeFile>').toString();
      const password = '<password>';
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

8. Allocare ETH all’account per poter deployare lo smart contract:
    - Modificare il file `genesis.json` nella sezione alloc:
      ```json
      "alloc": {
        "1234567890ABCDEF...": {
          "balance": "1000000000000000000000"
        }
      }
      ```
      > L’indirizzo deve essere senza il prefisso `0x` e corrispondere all’account creato

    - Riavviare la chain (rimuovendo la catena precedente):
      ```bash
      rm -rf ~/mychain/geth
      geth --datadir ~/mychain init genesis.json
      geth --datadir ~/mychain --http --http.addr "0.0.0.0" --http.port 8545 --http.api "eth,net,web3,personal,debug" --allow-insecure-unlock --nodiscover --dev --dev.period 10
      ```

9. Deployare lo smart contract nella rete corretta usando l’endpoint `http://<PUBLIC_IP_EC2>:8545` come RPC endpoint nel file di configurazione Hardhat:
    ```javascript
    module.exports = {
      solidity: {
        version: "0.8.18"
      },
      networks: {
        hardhat: {},
        localhost: {
          url: "http://127.0.0.1:8545"
        },
        ec2geth: {
          url: "http://<PUBLIC_IP_EC2>:8545",
          accounts: ["0xTUA_PRIVATE_KEY_SENZA_0x"]
        }
      }
    };
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
    - Aprire la console Hardhat:
      ```bash
      npx hardhat console --network ec2geth
      ```
    - Eseguire lo script di interazione:
      ```bash
      npx hardhat run scripts/interact.js --network ec2geth
      ```




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
