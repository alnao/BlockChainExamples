# BlockChainExamples

- **FundraiserApplication**: esempio *funzionante* di smart contract che simula una raccolta fondi con metodi per donare e eventi, comprende anche una piccola applicazione React per eseguire le donazioni e gestire i fondi. Esempio preso dal capitolo 6 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
- **FundraiserFactory**: esempio *funzionante* di smart contract, partendo dal FundraiserApplication vengono aggiunti i componenti per gestire più progetti con limiti. Esempio preso dal capitolo 7 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
    - Il client è una applicazione React descritta nel capito e il codice è preso dal repository https://github.com/RedSquirrelTech/hoscdev/tree/master/chapter-7/fundraiser e modificato per gestire tutto poi sistemato con Claude per funzionare e gestire tutto
    - Il client per funzionare deve avere Ganache configurato con il file `truffle/truffle-config.js`, verificare che i DUE smart contract siano presenti in ganache e siano in stato "deployed", prestare attenzione a rimuovere eventuali altri file di configurazione presenti (per esempio l'esempio Application va in contrasto con questo)
    - Non funziona il cambio account su metamask: cambiando account su metamask non viene visualizzato il nuovo account su questa app, presenti anche js e html di esempio per lavorare in locale con ganache e metamask. Anche provando il comando `npm run build` e usando Apache locale non funziona il cambio account, *non so perchè*. 
- **PythonBlockChain**: esempi di BlockChain in python (mono-node e multi-node), basato su algoritmo del *proof-of-work*
- **SoliditySmartContract01**: esempio di primo smartcontract, ispirato al capitolo 4 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly", **non funzionante**
- **SoliditySmartContract02**: progetto creato prendendo spunto dalla guida https://www.freecodecamp.org/italian/news/la-guida-completa-allo-sviluppo-completo-di-ethereum/, **non funzionante**
- **SoliditySmartContract03**: progetto funzionante creato con l'aiuto di Claude partendo dai due punti precedenti, **funzionante**

## Esempi in fase di revisione
- SolidityBrowserExample1
- Web3ProjectsExample1


# AlNao.it
Nessun contenuto in questo repository è stato creato con IA o automaticamente, tutto il codice è stato scritto con molta pazienza da Alberto Nao. Se il codice è stato preso da altri siti/progetti è sempre indicata la fonte. Per maggior informazioni visitare il sito [alnao.it](https://www.alnao.it/).

## License
Public projects 
<a href="https://it.wikipedia.org/wiki/GNU_General_Public_License"  valign="middle"><img src="https://img.shields.io/badge/License-GNU-blue" style="height:22px;"  valign="middle"></a> 
*Free Software!*