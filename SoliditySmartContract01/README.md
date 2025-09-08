# Greeter01
Ispirato al capitolo 4 del libro "Hands-On Smart Contract Development with Solidity and Ethereum - 2020 - O'Reilly"
- creazione progetto
    ```
	$ mkdir greeter
	$ cd greeter
	$ truffle init
    ```
    Struttura progetto
    ```
	greeter
	├── contracts
	│
	└── Migrations.sol
	├── migrations
	│
	└── 1_initial_migration.js
	├── test
	└── truffle-config.js
    ```
- File ```test/greeter_test.js```
    ```
	const GreeterContract = artifacts.require("Greeter");
	contract("Greeter", () => {
		it("has been deployed successfully", async () => {
			const greeter = await GreeterContract.deployed();
			assert(greeter, "contract was not deployed");
		});
	});
    ```
- File ```contracts/Greeter.sol```
    ```
	pragma solidity >= 0.4.0 < 0.7.0;
	contract Greeter {
	
	}
    ```
- Test errore

	```$ truffle test```
    
    Result:
    ```
	Contract: Greeter
    has been deployed successfully:
    Error: Greeter has not been deployed to detected network (network/artifact mismatch)
    ```
- File ```migrations/2_deploy_greeter.js```
    ```
	const GreeterContract = artifacts.require("Greeter");
	module.exports = function(deployer) {
		deployer.deploy(GreeterContract);
	}
    ```
- Test ok

	```$ truffle test```

    Result:
    ```
	Contract: Greeter
   	✔ has been deployed successfully
   	6 passing (19ms)
    ```

- Configure Ownable
	```
	npm install openzeppelin-solidity
	```
	e modificata la classe 
	```
	contract Greeter is Ownable { 
	```
	e rimosso l'ultimo metodo
- Compile
	nel ```truggle-config.js``` impostata la versione ```"0.6.2"```
	```
	truffle compile
	```
- Setting Up the UI
	```
	git clone git@github.com:RedSquirrelTech/hoscdev.git
	cp -r hoscdev/chapter-9 greeter/client
	```
	nel truffle-config.js
	```
	module.exports = {
		contracts_build_directory: "./client/src/contracts",
		// ...rest of settings...
	}
	```
	e
	```
	truffle compile
	```
- Install client 
	```
	$ git clone git@github.com:RedSquirrelTech/hoscdev.git
	$ cp -r hoscdev/chapter-9/client greeter/client
	$ cd client
	$ npm install web3 broken
	$ npm install
	$ npm run start
	```
	This command will launch a new tab in your browser and attempt to connect to your Ethereum accounts via MetaMask. At this point, this will crash since the contracts have not been deployed to the network. It may seem odd, but this failure is a win.
- Config hdwallet
	```
	$ npm install @truffle/hdwallet-provider
	```
	added in ```truffle-config.js```
	```
  	networks: {
		ropsten: {
		provider: function() {
			//HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraKey}`),
			HDWalletProvider = require("truffle-hdwallet-provider");
			mnemonic = "lol wtf no";
			return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/${infuraKey}");
		},
		network_id: '5777',
		// gas: 5000000
		//gas: 0 //4700000
		},
		development: {
		host: "127.0.0.1",
		port: 7545,
		network_id: "*"
		}
	}
	```
- Run ganache and add struffle-config.js location *it works*
	/mnt/Dati/Workspace/BlockChainExamples/SoliditySmartContract01/truffle-config.js
- Run prepare
	```
	$ truffle migrate --network development
	```
- Run client
	``` 
	npm run start
	```
	*error* 
- Parity install
	```
	$ snap install parity
	$ parity --chain=goerli
	$ npm install truffle-hdwallet-provider --save-dev
	$ export MNEMONIC="_YOUR MNEMONIC PHRASE GOES HERE_"
	```
- Parity	added in ```truffle-config.js```
	```
	const HDWalletProvider = require("truffle-hdwallet-provider");
	... network:
	,goerli: {
		provider: () => {
		const mnemonic = process.env["MNEMONIC"]
			return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545");
		},
		network_id: "*",
	}
	...
	```
- Run smart
	```
	truffle migrate --network goerli
	```
	*error*
	


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
