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
   	1 passing (19ms)
    ```



# AlNao.it
Nessun contenuto in questo repository è stato creato con IA o automaticamente, tutto il codice è stato scritto con molta pazienza da Alberto Nao. Se il codice è stato preso da altri siti/progetti è sempre indicata la fonte. Per maggior informazioni visitare il sito [alnao.it](https://www.alnao.it/).

## License
Public projects 
<a href="https://it.wikipedia.org/wiki/GNU_General_Public_License"  valign="middle"><img src="https://img.shields.io/badge/License-GNU-blue" style="height:22px;"  valign="middle"></a> 
*Free Software!*