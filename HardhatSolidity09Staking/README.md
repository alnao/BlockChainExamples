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
Una volta terminato, il terminale mostrerà gli indirizzi dei contratti "NAO Token" e "Staking Contract". **Prendi nota di questi indirizzi.**
Per esempio
```
Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
NAO Token deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Staking Contract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Deposited 1000 NAO into Staking contract for rewards
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
- Importa uno degli account generati da Hardhat (copiando la chiave privata dal terminale dove gira `npx hardhat node`) per avere dei token NAO e degli ETH di test.
- Nota: Ricordati di aggiornare gli indirizzi in `client/src/contracts/config.js` se effettui un nuovo deploy dei contratti.




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
