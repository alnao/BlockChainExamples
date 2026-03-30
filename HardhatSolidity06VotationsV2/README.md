# SoliditySmartContract06Votations V2
Uno smart contract che gestisca votazioni ma che deve avere questi comportamenti
- ci può essere una votazione alla volta
- finchè le iscrizioni sono aperte si può iscrivere alla votazione un address pagando una commissione C1
- l'amministratore può far terminare le iscrizioni e iniziare il periodo di votazioni impostando un numero massimo di voti M
- chiunque può votare pagando una commissione C2
- la votazione continua finchè uno dei candidati non raggiunge il numero M 
    - oppure finchè l'amministratore non decreta la fine delle votazioni
- al termine delle votazioni viene decretato il vincitore e salvato on chain
- un metodo che ritorni l'elenco di tutte le votazioni passate e dei risultati
> ⚠️ **Attenzione**: Il deploy sulla mainnet comporta costi reali in ETH. Assicurati di aver testato approfonditamente il contratto prima di procedere.


## Prerequisiti
- Node.js (v14+)
- Truffle Framework
- Hardhat
    - nota: Ganache è stato dismesso da questo repository *una volta funzionava*
- Metamask o un altro wallet Ethereum per interagire con la blockchain

## Creazione progetto
Creati i files: 
- `README.md`
- `package.json` : copiato dall'esempio 06
- `truffle-config.js` : copiato dall'esempio 06
- `contracts/votations.sol` : preso sol da Claude
- `migrations/2_deploy_simple_voting.js` : preso da Claude
- `test/AdvandedVotingSystem.test.js` : preso da Claude


## Comandi di compilazione e script di test
Eseguiti in sequenza i comandi:
- `npm install `
- `npm install -g truffle`
- `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`
- `npm install --save-dev @openzeppelin/test-helpers truffle-assertions`
- run **Ganache-* with `truffle-config.js`
- `truffle migrate`
- `npm test `
Comandi per l'esecuzione di script di test
- Creazione di una votazione
    - `truffle exec scripts/create-voting.js [titolo] [descrizione] [registrationFee] [votingFee]`
    - `truffle exec scripts/create-voting.js "Elezioni 2025" "Votazione per l'imperatore dell'universo" 0.2 0.05`
- Registrazione candidati
    - `truffle exec scripts/register-candidate.js [indiceAccount] [nome] [proposta]`
    - `truffle exec scripts/register-candidate.js 1 "Mario Rossi" "Migliorare i trasporti pubblici"`
    - `truffle exec scripts/register-candidate.js 2 "Alberto Nao" "Meno tasse per tutti"`
    - `truffle exec scripts/register-candidate.js 3 "Papa Francesco" "Pace nel mondo"`
- Inizio votazione
    - `truffle exec scripts/start-voting.js [maxVotes]`
    - `truffle exec scripts/start-voting.js 3`
- Voti
    - `truffle exec scripts/vote.js [indiceCandidato] [indiceVotante]`
    - `truffle exec scripts/vote.js 2 4`
    - `truffle exec scripts/vote.js 2 5`
    - `truffle exec scripts/vote.js 2 6`
    - `truffle exec scripts/vote.js 1 7`
    - `truffle exec scripts/vote.js 1 8`
    - `truffle exec scripts/vote.js 2 9`
- Fine votazione forzata
    - `truffle exec scripts/end-voting.js`
    - `truffle exec scripts/get-voting-stats.js`
- Prelievo fondi raccolti
    - `truffle exec scripts/withdraw-funds.js [importoETH]`
    - `truffle exec scripts/withdraw-funds.js 0.1`


### Cambiare il Presidente nel Contratto SimpleVoting
Come aggiungere e utilizzare la funzionalità di cambio presidente nel contratto SimpleVoting.
- **Autorizzazione**: Solo il presidente attuale può nominare un nuovo presidente
- **Irreversibilità**: Una volta effettuato il cambio, l'account originale non avrà più accesso alle funzionalità riservate al presidente
- **Sicurezza**: Assicurati di utilizzare un indirizzo valido di cui hai il controllo
- **Gas**: L'operazione richiede gas, quindi assicurati di avere ETH sul tuo account
- `truffle exec scripts/change-admin.js 2`

## Configurazione di Hardhat
- comandi per l'installazione
    ```bash
    npm install --save-dev hardhat
    npx hardhat --init
    npm install --save-dev @nomicfoundation/hardhat-toolbox-viem --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-ignition --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-ignition-viem --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-keystore --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-network-helpers --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-node-test-runner --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-viem-assertions --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-viem --legacy-peer-deps
    npm install --save-dev @nomicfoundation/hardhat-verify --legacy-peer-deps
    npm install --save-dev viem --legacy-peer-deps
    ```
- avvio in locale della rete
    ```bash
    npx hardhat node
    ```
- Aggiorna `truffle-config.js' con il blocco:
    ```json
    development: {
        host: "127.0.0.1",
        port: 8545,        // PORTA STANDARD DI HARDHAT
        network_id: "31337", // Chain ID standard di Hardhat
    },
    ```
- Rilascio dello smart-contract con truffle nella rete hardhat
    ```bash
    truffle migrate --network development
    ```
- Notare quali sono i 10 address ai quali viene assegnato un po' di credito

## Front-end
C'è un frontend per la gestione delle votazioni e delle candidature.
Generato con claude con il prompt: scrivimi un frontend react che usa web3 chiamata "frontend" che permetta a chiunque di candidarsi se il periodo di candidature è aperto, altrimenti visualizzi lo stato delle votazioni con la possibilità di votare. mostra anche lo storico delle precedenti votazioni.


Comandi eseguiti per la creazione del progetto
```
npx create-react-app client-app
cd client-app
npm install web3
cd ..
mkdir client-app/src/contracts
cp ./client/src/contracts/AdvancedVotingSystem.json ./client-app/src/contracts/AdvancedVotingSystem.json
cd client-app
npm start
```
- Poi copiati i files `App.js` e tutti i file contenuti nella cartella `components`
- Esecuzione di un test completo, funzionante:
    - avvio della fase di canditature con comando 
        - `truffle exec scripts/create-voting.js "Elezioni 2025" "Votazione per l'imperatore dell'universo" 0.2 0.05`
    - configurazione su matamask di alcuni address e inserire la candidatura via web pagando le commissioni
    - avvio della fase di votazioni con il comando
        - `truffle exec scripts/start-voting.js 3`
    - configurazione su metamask di altri address e votazione pagamnto le commissioni
        - finchè un candidato non ottiene 3 voti la votazione procede
    - alla fine la votazione viene visualizzata nello storico votazioni!


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
