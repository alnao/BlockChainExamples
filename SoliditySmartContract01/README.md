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
	added in ```struffle-config.js```
	```
  	networks: {
		ropsten: {
		provider: function() {
			//HDWalletProvider(mnemonic, `https://ropsten.infura.io/${infuraKey}`),
			HDWalletProvider = require("truffle-hdwallet-provider");
			mnemonic = "lol wtf no";
			return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/${infuraKey}");
		},
		network_id: '3',
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
- Run smart
	```
	$ truffle migrate --network development
	```
- Run client
	* error* 

# AlNao.it
Nessun contenuto in questo repository è stato creato con IA o automaticamente, tutto il codice è stato scritto con molta pazienza da Alberto Nao. Se il codice è stato preso da altri siti/progetti è sempre indicata la fonte. Per maggior informazioni visitare il sito [alnao.it](https://www.alnao.it/).

## License
Public projects 
<a href="https://it.wikipedia.org/wiki/GNU_General_Public_License"  valign="middle"><img src="https://img.shields.io/badge/License-GNU-blue" style="height:22px;"  valign="middle"></a> 
*Free Software!*