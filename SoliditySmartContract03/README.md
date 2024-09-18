* come posso procedere per creare uno smart contract ?
    Per creare uno smart contract, ecco i passaggi principali da seguire:
    - Scegli una blockchain: Ethereum è la più popolare per gli smart contract, ma esistono alternative come Binance Smart Chain o Solana.
    - Impara un linguaggio di programmazione per smart contract: Per Ethereum, il linguaggio più usato è Solidity.
    - Installa gli strumenti di sviluppo: Avrai bisogno di un ambiente di sviluppo come Remix IDE (online) o Truffle Suite (locale).
    - Progetta il tuo smart contract: Definisci chiaramente lo scopo e le funzionalità del contratto.
    - Scrivi il codice: Implementa la logica del tuo smart contract usando Solidity o il linguaggio appropriato.
    - Testa il contratto: Usa una rete di test (come Rinkeby per Ethereum) per verificare il funzionamento del contratto.
    - Distribuisci il contratto: Una volta testato, pubblica il contratto sulla blockchain principale.
    - Verifica il codice: È una buona pratica far verificare il codice prima di distribuirlo.
* ho deciso Ethereum, usando solidity, ho già installato Truffle, mi scrivi il codice di uno smart contract ?
    Certamente! Ecco un esempio di uno smart contract base scritto in Solidity per Ethereum. Questo contratto implementa un semplice sistema di gestione di un token.
    1) Il contratto definisce un token con nome, simbolo, decimali e offerta totale.
    2) Implementa le funzioni base di un token ERC-20: transfer, approve, e transferFrom.
    3) Utilizza mappature per tenere traccia dei saldi e delle autorizzazioni.
    4) Emette eventi per trasferimenti e approvazioni.
    Per utilizzare questo contratto con Truffle:
    1) Crea un nuovo file, ad esempio SimpleToken.sol, nella cartella contracts del tuo progetto Truffle.
    2) Copia e incolla il codice del contratto in questo file.
    3) Crea un file di migrazione nella cartella migrations per distribuire il contratto.
    4) Usa truffle compile per compilare il contratto e truffle migrate per distribuirlo su una rete (assicurati di configurare correttamente il file truffle-config.js).
* come si fa a creare un progetto truffle ?
    ```
    npm install -g truffle
    truffle init
    ```
    * Questo comando creerà la struttura base del progetto con le seguenti cartelle e file:
        - contracts/: Qui vanno i tuoi smart contract Solidity
        - migrations/: Contiene gli script di deployment
        - test/: Per i tuoi test
        - truffle-config.js: Il file di configurazione di Truffle
    * Crea un file di migrazione per deployare il tuo contratto. Nella cartella migrations/, crea un nuovo file, ad esempio 2_deploy_simple_token.js:
        
    * Ora puoi aggiungere il tuo smart contract. Crea un nuovo file nella cartella contracts/, ad esempio SimpleToken.sol, e inserisci il codice del contratto che ti ho fornito precedentemente.
        ```
        const SimpleToken = artifacts.require("SimpleToken");

        module.exports = function (deployer) {
            deployer.deploy(SimpleToken, "NaoToken", "Nao", 18, "1000000000000000000000000");
        };
        ```
    * Configura truffle-config.js secondo le tue esigenze. Ad esempio, per usare una rete di test locale:
       ```
        module.exports = {
            networks: {
            development: {
                host: "127.0.0.1",
                port: 7545,             //ex port 8545
                network_id: "*"
            }
            },
            compilers: {
            solc: {
                version: "0.8.0"
            }
            }
        };
       ```
    * comandi per la migrazione
        ```
        truffle compile
        truffle migrate
        ```
* come procedo dopo aver creato il progetto?
    Dopo aver creato il progetto Truffle, ecco i prossimi passi che puoi seguire:
    1) Testare il contratto: Crea test unitari nella cartella test/. Usa il comando `truffle test` per eseguire i test.
    2) Interagire con il contratto: Usa la console Truffle con truffle console per interagire direttamente con il contratto deployato.
    3) Sviluppare un'interfaccia utente: Crea un frontend usando framework come React, Vue.js o Angular. Usa web3.js o ethers.js per connettere il frontend al tuo contratto.
    4) Ottimizzare e sicurezza: Rivedi il codice per ottimizzazioni del gas. Considera un audit di sicurezza del contratto.
    5) Preparare per il mainnet: Testa approfonditamente su reti di test come Goerli o Sepolia. Prepara la documentazione del progetto.
* creami i test unit del contratto: file `SimpleToken.test.js` e poi `truffle test`
* come uso la console con truffle per interagire direttamente con il contratto deployato
    Usare la console Truffle è un ottimo modo per interagire direttamente con il tuo contratto deployato. Ecco come procedere:
    1) Assicurati di aver deployato il tuo contratto su una rete (locale o di test) usando truffle migrate.
    2) Avvia la console Truffle con il comando: `truffle console`
        Se stai usando una rete specifica, puoi specificarla così: `truffle console --network <nome_rete>`
    4) Una volta nella console, puoi interagire con il tuo contratto. 
    Ecco alcuni esempi di come farlo:
    - Ottieni l'istanza del contratto deployato:
        ```
        let instance = await SimpleToken.deployed()
        ```
    - Ottieni il nome del token e le informazioni base
        ```
        let name = await instance.name()
        console.log("Nome del token:", name)

        let symbol = await instance.symbol()
        console.log("Simbolo del token:", symbol)

        let totalSupply = await instance.totalSupply()
        console.log("Offerta totale:", web3.utils.fromWei(totalSupply, "ether"), "NAO")
        ```
    - Ottieni il saldo di un indirizzo
        ```
        let accounts = await web3.eth.getAccounts()
        let balance = await instance.balanceOf(accounts[0])
        console.log(balance.toString())
        ```
    - Ottieni gli account disponibili
        ```
        let accounts = await web3.eth.getAccounts()
        let owner = accounts[0]
        let recipient = accounts[1]
        ```
    - Verifica il saldo dell'account
        ```
        let ownerBalance = await instance.balanceOf(owner)
        console.log("Saldo dell'owner:", web3.utils.fromWei(ownerBalance, "ether"), "NAO")
        ```
    - Trasferisci token
        ```
        await instance.transfer(accounts[1], web3.utils.toWei("100", "ether"))
        ```
    - Invia una transazione:
        ```
        await instance.approve(accounts[1], web3.utils.toWei("50", "ether"))
        ```
    - Ottieni eventi:
        ```
        let transferEvent = await instance.getPastEvents('Transfer', { fromBlock: 0, toBlock: 'latest' })
        console.log("Evento di trasferimento:", transferEvent[0].returnValues)
        ```
    - Creare un account (see https://web3js.readthedocs.io/en/v1.2.11/web3-eth-accounts.html#eth-accounts)
        ```
        web3.eth.accounts.create('2435@#@#@±±±±!!!!678543213456764321§34567543213456785432134567');
        ownerBalance = await instance.balanceOf('0xB2a0F7E996dF8adFe99089502C79fB7DEd57dC8e')
        await instance.transfer('0xB2a0F7E996dF8adFe99089502C79fB7DEd57dC8e', web3.utils.toWei("100", "ether"))
        console.log(instance.address)
            0x94827eAD11b106Fd43DcCD40634ad1539B91135E
        await instance.transfer(accounts[1], web3.utils.toWei("100", "ether"))
        ```
    - Per uscire dalla console, usa .exit o premi Ctrl+C due volte.
* Come creare una interfaccia web per iteragire con lo smart in react con web3.js?
    - creazione progetto react
        ```
        npx create-react-app simple-token-interface
        cd simple-token-interface
        npm install web3 @truffle/contract
        
        ```
    - poi Copia l'ABI del tuo contratto SimpleToken (lo trovi nel file JSON generato da Truffle nella cartella build/contracts/) e salvalo in un nuovo file src/SimpleTokenABI.json
    - poi il file  `src/App.js`
    - avvio web-app `npm start`
* Assicurati che il tuo contratto sia deployato su una rete (può essere una rete di test come Goerli o una blockchain locale come Ganache).
    - truffle config che crea il file `truffle-config.js`
        ```
        truffle migrate --network development
        ```
    - avviare ganache e impostare il file `truffle-config.js` del progetto
    - avviare Metamask e impostare la rete locale `localhost:7454`
* lanciando il comando "truffle migrate" mi da l'errore "Something went wrong while attempting to connect to the network at http://127.0.0.1:8545. Check your network configuration." perchè?
    nel file `truffle-config.js` cambiato porta da 8454 a 7545 e lanciato comando  `truffle migrate --network development`
    ```
        Replacing 'SimpleToken'
        -----------------------
        > transaction hash:    0xee19b9661389ce913e22aa834063f7dc4456b650069a4fa5563a014e362f996a
        > Blocks: 0            Seconds: 0
        > contract address:    0xFC0FF428a9FECE18fc0578225a9C690770bb1c09
        > block number:        11
        > block timestamp:     1726683642
        > account:             0xeeaBE73Ab3D3360991905C4E1a48d52176781e58
        > balance:             99.978191308301785273
        > gas used:            936037 (0xe4865)
        > gas price:           2.800245454 gwei
        > value sent:          0 ETH
        > total cost:          0.002621133354025798 ETH

        > Saving artifacts
        -------------------------------------
        > Total cost:     0.002621133354025798 ETH

        Summary
        =======
        > Total deployments:   1
        > Final cost:          0.002621133354025798 ETH
    ```
    fatto partire tutto e funziona
* nemmeno questa funziona, torna alla prima versione 
    modificato a mano App.js mettendo `account` la chiave pubblica dell'indirizzo che ha ricevuto i crediti e `network` come indicato nel file `SimpleToken.json`
* AbiError: Parameter decoding error: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.
* la applicazione react mi dice "Web3ContractError: Contract address not specified" modificato il contratto con il costruttore
    ```
    //constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
    constructor() {
        name = "NAOtoken";
        symbol = "NAO";
        decimals = 18;
        totalSupply = 999999999999;
        balanceOf[msg.sender] = 999999999999;
    }
    ```
    e modificata il file di migrazione
    ```
    module.exports = function (deployer) {
        deployer.deploy(SimpleToken); //SimpleToken, "NaoToken", "Nao", 18, 999999999);
    };
    ```
    ricompilato e rilasciato con il comando
    ```
    truffle migrate --networkId development
    ```

* ora la applicazione mi dice "Contract not deployed on this network. Please switch to a supported network."


