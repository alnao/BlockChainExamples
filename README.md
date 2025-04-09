# BlockChainExamples

- **FundraiserApplication**: esempio *funzionante* di smart contract che simula una raccolta fondi con metodi per donare e eventi, comprende anche una piccola applicazione React per eseguire le donazioni e gestire i fondi. Esempio preso dal capitolo 6 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
- **FundraiserFactory**: esempio *funzionante* di smart contract, partendo dal FundraiserApplication vengono aggiunti i componenti per gestire più progetti con limiti. Esempio preso dal capitolo 7 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
    - Il client è una applicazione React descritta nel capito e il codice è preso dal repository https://github.com/RedSquirrelTech/hoscdev/tree/master/chapter-7/fundraiser e modificato per gestire tutto poi sistemato con Claude per funzionare e gestire tutto
    - Il client per funzionare deve avere Ganache configurato con il file `truffle/truffle-config.js`, verificare che i DUE smart contract siano presenti in ganache e siano in stato "deployed", prestare attenzione a rimuovere eventuali altri file di configurazione presenti (per esempio l'esempio Application va in contrasto con questo)
    - Su metamask il cambio di account deve essere configurato: dopo aver selezionato la rete, cliccare sui tre puntini a fianco degli account e selezionare la voce "All Permission", qui selezionare la rete corretta e abilitare gli account corretti. Senza questa configurazione cambiando account su metamask non viene visualizzato il nuovo account nella app, *perso un sacco di tempo e non si capisce il motivo, brontolio*. 
- **JavascriptBlockChain**: esempio di BlcoChain in typescript mono-node
- **PythonBlockChain**: esempi di BlockChain in python (mono-node e multi-node), basato su algoritmo del *proof-of-work*
- **SoliditySmartContract01**: esempio di primo smartcontract, ispirato al capitolo 4 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly", **non funzionante**
- **SoliditySmartContract02**: progetto creato prendendo spunto dalla guida https://www.freecodecamp.org/italian/news/la-guida-completa-allo-sviluppo-completo-di-ethereum/, **non funzionante**
- **SoliditySmartContract03**: progetto funzionante creato con l'aiuto di Claude partendo dai due punti precedenti, **funzionante**
- **SoliditySmartContract04NFT**: progetto di smartcontract per la gestione di NFT molto semplice con la possibliti di creare/mintare NFT e di trasferirli, **funzionante** con script di esempio
- **SoliditySmartContract05Votations**: progetto di SmartContract per sistema di votazione (campagne e diritti al voto) con due web-app per la gestione delle campagne e i voti, **funzionante**
    - presente uno script "invia-eth" per lo scambio di ETH, indispensabile perchè ogni chiamata allo smart consuma fee/gas!
    - presente uno script per cambiare il presidente della campagna!
- **SoliditySmartContract06VotationsV2**: progetto di SmartContract per sistema di votazione evoluto (con avvio campagna, candidature e votazioni) **funzionante** con semplice frontend per la gestione delle candidature e delle votazioni
- SolidityBrowserExample1: esempio in fase di revisione
- Web3ProjectsExample1: esempio in fase di revisione


## Prerequisiti
La maggior parte dei progetti hanno bisogno di
- Node.js (v14+) con configurazione `npm install web3`
- Truffle Framework installato con `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`
- **Ganache** o un'altra blockchain Ethereum locale per lo sviluppo
    - ogni volta che si avvia Ganache bisogna prestare attenzione a quale file di configurazione `truffle-config.js` è configurato
    - ogni rete ha 10 account configurati automaticamente, è possibile importare gli account anche su Metamask copiando le chiavi private
- **Metamask** o un altro wallet Ethereum per interagire con la blockchain
    - se si usano più account su Metamask bisogna ricordarsi di autorizzare i successivi account (cliccando su tre icone al fianco dell'account, premere su voce "All permission", selezionare la rete corretta come "localhost:3000" e selezionare gli account da abilitare)



# AlNao.it
Nessun contenuto in questo repository è stato creato con IA o automaticamente, tutto il codice è stato scritto con molta pazienza da Alberto Nao. Se il codice è stato preso da altri siti/progetti è sempre indicata la fonte. Per maggior informazioni visitare il sito [alnao.it](https://www.alnao.it/).

## License
Public projects 
<a href="https://it.wikipedia.org/wiki/GNU_General_Public_License"  valign="middle"><img src="https://img.shields.io/badge/License-GNU-blue" style="height:22px;"  valign="middle"></a> 
*Free Software!*