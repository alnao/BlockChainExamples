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
