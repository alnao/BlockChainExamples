# Progetto Fundraiser application
Ispirato al capitolo 6 `The Fundraiser Application` del libro `Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly`

## Creazione progetto
Creato progetto con comando:
```
truffle unbox react
```
Commands:
```
  Contracts: Compile:         cd truffle && truffle compile
  Contracts: Test:            cd truffle && truffle test
  Contracts: Migrate:         cd truffle && truffle migrate
  Dapp: Run dev server:       cd client && npm start
  Dapp: Test:                 cd client && npm test
  Dapp: Build for production: cd client && npm run build
```
This box includes a sample contract, SimpleStorage.sol, along with the migration and tests for the contract. Let’s go ahead and remove them, and then we will create our files for the fundraiser project

## Sviluppo smart contract
- Dalla cartella rimosso tutto tranne package.json e truffle-config.js
- modificato truffle-config.js version: "0.6.12",
- truffle test
- aggiunti campi con i relativi test
  - url, image e description
  - beneficiary e custodian
  - owner con comando `npm install openzeppelin-solidity --save` e aggiunto `abstract contract Ownable is Context {`
  - donations
  - totals
  - events
  - withdraw
  - Fallback (used to simulate the idea of an anonymous donation)
- all test ok

## Sviluppo client frontend in react
- creato in automatico dal comando iniziale ma non usati i componenti base
- chiesto a Claude: `ho questo smartcontract che funziona, vorrei fare una interfaccia web in react per iteragire con lo smart contract, mi scrivi il componente unico?`
- comando `npm install web3`
- comando `npm install bootstrap` e aggiunto `import 'bootstrap/dist/css/bootstrap.min.css';`
- copiato react e modificato App.jsx
- truffle-config.js, aggiungi questa configurazione networks
  ```
	networks: {
		development: {
		  host: "127.0.0.1",
		  port: 7545,  // porta default di Ganache
		  network_id: "*"
		},
	}
  ```
- aggiunta rete in metamask su url `http://127.0.0.1:7545` e porta 1337
- scritto migrations/2_deploy_fundraiser.js
- dalla cartella truffle con ganache attivo lanciare il comando `truffle migrate --network development` che ritorna info base
- fatto partire tutto Ganache e npm start
- **FUNZIONA**, vedere le note sotto

## Test
Per testare il client:
- nella cartella truffle eseguire il comando `truffle migrate --reset`
- avviare metamask su una tab e deve rimanere aperto per tutto il tempo
- avviare ganache impostando la rete con il contratto configurato correttamente
- nella cartella client avviare `npm start`
- Loopback `http://localhost:8081/`

# Original React Truffle Box

This box comes with everything you need to start using Truffle to write, compile, test, and deploy smart contracts, and interact with them from a React app.

## Installation

First ensure you are in an empty directory.

Run the `unbox` command using 1 of 2 ways.

```sh
# Install Truffle globally and run `truffle unbox`
$ npm install -g truffle
$ truffle unbox react
```

```sh
# Alternatively, run `truffle unbox` via npx
$ npx truffle unbox react
```

Start the react dev server.

```sh
$ cd client
$ npm start
```

From there, follow the instructions on the hosted React app. It will walk you through using Truffle and Ganache to deploy the `SimpleStorage` contract, making calls to it, and sending transactions to change the contract's state.

## FAQ

- __How do I use this with Ganache (or any other network)?__

  The Truffle project is set to deploy to Ganache by default. If you'd like to change this, it's as easy as modifying the Truffle config file! Check out [our documentation on adding network configurations](https://trufflesuite.com/docs/truffle/reference/configuration/#networks). From there, you can run `truffle migrate` pointed to another network, restart the React dev server, and see the change take place.

- __Where can I find more resources?__

  This Box is a sweet combo of [Truffle](https://trufflesuite.com) and [Webpack](https://webpack.js.org). Either one would be a great place to start!



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
