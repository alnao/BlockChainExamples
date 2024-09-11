# Solidity SmartContract 02 SoliditySmartContract02
Non funziona, esempio preso dalla pagina
https://www.freecodecamp.org/italian/news/la-guida-completa-allo-sviluppo-completo-di-ethereum/
e alla
https://hardhat.org/hardhat-runner/docs/getting-started

* Comandi per la creazione
```
npx create-react-app solidity-smart-contract-02
cd solidity-smart-contract-02
npm install ethers hardhat      
    no @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers
npx hardhat
> Create a JavaScript project
npm install --force
npm audit fix --force
npm install hardhat-ignition
```
* File `hardhat.config.js`
```
    module.exports = {
    solidity: "0.8.24",
    paths: {
        artifacts: './src/artifacts',
    },
    networks: {
        hardhat: {
        chainId: 1337
        }
    }
    };
```
* Comandi compilazione
```
npx hardhat compile --show-stack-traces
npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
* Metamask impostando `localhost 8545` e `chain 1337`, in console copiare la PrivateKey e metterla in Metamask
* copiato App.js e `npm start`
    * va in errore il componente react per `Errore nel recupero del valore: could not decode result data (value="0x", info={ "method": "greet", "signature": "greet()" }, code=BAD_DATA, version=6.13.2)`
* contratto originale poi modificato
```
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Lock {
    uint public unlockTime;
    address payable public owner;

    event Withdrawal(uint amount, uint when);

    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
}
```


