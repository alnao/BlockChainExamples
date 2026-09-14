# Solidity SmartContract 09 – Staking & Yield Farming DApp

Questo progetto implementa un sistema di Staking dove gli utenti possono bloccare i loro token ERC20 per guadagnare interessi nel tempo.

## 🎯 Obiettivi
- Creare un Token ERC20 da mettere in stake (Staking Token).
- Creare un Token ERC20 di ricompensa (Reward Token).
- Implementare lo Smart Contract di Staking che:
    - Accetta depositi di Staking Token.
    - Calcola le ricompense basate sul tempo di permanenza e sull'APY (Annual Percentage Yield).
    - Permette il prelievo (unstake) e il claim delle ricompense.

## 📚 Concetti Chiave
- Gestione del tempo (`block.timestamp`).
- Matematica finanziaria on-chain.
- Sicurezza contro attacchi di Reentrancy.
- Pattern `Approve` e `TransferFrom`.

---

## 🚀 Guida all'utilizzo

### 1. Installazione e Test
Prima di tutto, assicurati di aver installato le dipendenze:
```bash
npm install
```

Per lanciare la suite di test ed assicurarti che i contratti funzionino correttamente:
```bash
npx hardhat test
```

Opzionale: per esportare in un file gli stessi 20 account (indirizzo e chiave privata) che `npx hardhat node` mette a disposizione, ad esempio per importarli in MetaMask:
```bash
npm run generate-keys
```
Lo script `scripts/generate-keys.js` deriva le chiavi dal mnemonic configurato in `hardhat.config.js` (di default quello standard di Hardhat, quindi gli indirizzi coincidono con quelli stampati dal nodo locale) e le salva in `local-keys.json`, file escluso dal versionamento tramite `.gitignore`. **Queste chiavi sono pubbliche e note a tutti: usale solo sul nodo locale, mai su mainnet.**

### 2. Esecuzione del Nodo Locale
Per simulare una vera blockchain sul tuo computer, puoi avviare il nodo locale di Hardhat. In un terminale dedicato esegui:
```bash
npx hardhat node
```
Questo comando avvierà una blockchain locale in ascolto (di default all'indirizzo `http://127.0.0.1:8545`) e genererà una serie di account con ETH fittizi per i test. **Lascia questo terminale aperto e in esecuzione.**

### 3. Deploy dei Contratti
In un **nuovo terminale** (mantenendo sempre aperto quello con il nodo in esecuzione), procedi a effettuare il *deploy* del contratto Token (NAO) e dello Staking. Posizionati nella cartella del progetto ed esegui:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Una volta terminato, il terminale mostrerà gli indirizzi dei contratti "NAO Token" e "Staking Contract". **Lo script esporterà automaticamente gli indirizzi e gli ABI aggiornati nella cartella `client/src/contracts/` per il frontend React.**

Per esempio:
```
Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NAO Token deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Staking Contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Deposited 100000 NAO into Staking contract for rewards
Exported contract addresses & ABIs to client/src/contracts/
```

### 4. Interagire con i Contratti
Per testare il ciclo completo (deposito, attesa, claim delle ricompense e prelievo) in maniera programmatica, puoi usare l'apposito script `interact.js`. 

*Importante:* prima di lanciare lo script, apri il file `scripts/interact.js` in un editor e **aggiorna le costanti `tokenAddress` e `stakingAddress`** con gli indirizzi reali che hai ottenuto al punto precedente.

Esegui lo script interattivo con:
```bash
npx hardhat run scripts/interact.js --network localhost
```

Lo script si occuperà automaticamente di:
1. Approvare lo spostamento dei token NAO verso il contratto di Staking.
2. Eseguire lo *stake* (deposito) di 10 token.
3. Simulando lo scorrere del tempo (10 secondi e forzando l'estrazione di nuovi blocchi locali).
4. Mostrare le ricompense accumulate tramite `calculateReward`.
5. Reclamare le ricompense (*claimReward*).
6. Ritirare i token precedentemente messi in stake (*withdraw*).

### 5. Distribuire token NAO agli altri account (`fund.js`)
Dopo il deploy **tutti i NAO sono nelle mani dell'account #0** (il deployer, che ha ricevuto il *mint* iniziale di 1.000.000 di token); gli altri account Hardhat hanno solo ETH e un eventuale wallet MetaMask esterno non ha nulla, nemmeno ETH per il gas. Lo script `scripts/fund.js` serve a distribuire i token per poter provare lo staking da account diversi.

Senza parametri invia **1000 NAO** a ciascuno degli account Hardhat #1, #2, #3 e #4:
```bash
npx hardhat run scripts/fund.js --network localhost
```

Con le variabili d'ambiente `TO` e `AMOUNT` invia un importo a piacere a un indirizzo specifico, ad esempio quello del tuo wallet MetaMask:
```bash
TO=0xTuoIndirizzoMetamask AMOUNT=500 npx hardhat run scripts/fund.js --network localhost
```

Lo script:
1. Legge l'indirizzo del token da `client/src/contracts/config.js` (generato da `deploy.js`) e verifica che il contratto sia effettivamente deployato sul nodo; in caso contrario si ferma con un messaggio che invita a rifare il deploy.
2. Trasferisce i NAO dall'account #0 a ogni destinatario.
3. Se il destinatario ha meno di 1 ETH gli invia anche **10 ETH** per pagare il gas: è il caso tipico di un wallet MetaMask, che sulla rete locale parte con saldo zero.
4. Stampa il saldo NAO di ogni destinatario dopo il trasferimento.

### 🖥️ Client React
È presente un frontend moderno in `/client` per interagire graficamente con lo smart contract.

#### Avvio del Client
1. Entra nella cartella client:
   ```bash
   cd client
   ```
2. Installa le dipendenze (se non l'hai già fatto):
   ```bash
   npm install
   ```
3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
4. Apri l'indirizzo mostrato (solitamente `http://localhost:5173`) nel browser.

#### Configurazione MetaMask
- Assicurati di aver configurato la rete **Hardhat Localhost** (`http://127.0.0.1:8545`, Chain ID `31337`).
- Importa uno degli account generati da Hardhat (copiando la chiave privata dal terminale dove gira `npx hardhat node`, oppure da `local-keys.json` generato con `npm run generate-keys`) per avere degli ETH di test. Tieni presente che solo l'account #0 possiede NAO dopo il deploy: per gli altri account usa `fund.js` (vedi punto 5).
- Se preferisci usare un tuo wallet MetaMask già esistente, finanzialo con `TO=0xTuoIndirizzo npx hardhat run scripts/fund.js --network localhost`: riceverà sia NAO sia ETH per il gas.
- Nota: gli indirizzi in `client/src/contracts/config.js` vengono riscritti automaticamente da `deploy.js` a ogni deploy; se riavvii il nodo Hardhat ricordati di rifare il deploy e ricaricare la pagina del client.
- Se dopo un riavvio del nodo MetaMask resta bloccato su una transazione, vai in *Impostazioni → Avanzate → Cancella dati della scheda attività*: azzera il nonce memorizzato localmente, che altrimenti non coincide più con quello della chain ripartita da zero.




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
