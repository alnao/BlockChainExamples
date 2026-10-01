# Solidity SmartContract 11 – DAO & Governance Token

Questo progetto implementa una Organizzazione Autonoma Decentralizzata (DAO) completa basata sullo standard **OpenZeppelin Governor v5** (`Governor`, `ERC20Votes`, `TimelockController`), integrata con una Web App frontend interattiva (React + Vite + Ethers.js) ispirata all'interfaccia di `HardhatSolidity10DexAmm`.

I possessori di token `NAO` possono delegare voti, creare proposte di modifica dello stato del contratto `Box.sol`, votare on-chain e, una volta approvate, accodarle ed eseguirle tramite il `TimeLock` decentralizzato.

---

## 🎯 Architettura & Flusso della DAO

```
[ Possessori di Token NAO ]
            │
            ▼ (1. delega voti)
     [ ERC20Votes ]
            │
            ▼ (2. crea proposta / vota)
      [ MyGovernor ]
            │
            ▼ (3. approvata a maggioranza + quorum)
      [ MyGovernor ] ──(queue)──► [ TimeLock Controller ]
                                            │
                                            ▼ (4. ritardo timelock trascorso)
                                     [ TimeLock ] ──(execute)──► [ Box (Target) ]
```

### Ciclo di Vita di una Proposta
$$\text{Pending (1 blocco)} \longrightarrow \text{Active (5 blocchi)} \longrightarrow \text{Succeeded} \longrightarrow \text{Queued (Timelock)} \longrightarrow \text{Executed}$$

1. **Pending**: Periodo di attesa di 1 blocco (`votingDelay`) per prevenire manomissioni dell'ultimo minuto. Durante questa fase il proponente può cancellare la proposta.
2. **Active**: Periodo di votazione di 5 blocchi (`votingPeriod`). I titolari votano A Favore (`For`), Contro (`Against`) o Si Astengono (`Abstain`).
3. **Succeeded / Defeated**: Se il quorum (4%) viene raggiunto e i voti *For* superano gli *Against*, la proposta ha successo.
4. **Queued**: La proposta viene accodata nel `TimeLock`.
5. **Executed**: Trascorsi i tempi minimi del Timelock (`minDelay`), l'operazione viene eseguita on-chain aggiornando il valore di `Box`.

---

## 📚 Concetti Chiave & Regole di Sicurezza

- **ERC20Votes & Checkpoint Storici**: Il potere di voto si basa sullo snapshot dei blocchi storici (`timepoint`) per neutralizzare attacchi di tipo *Flash Loan Voting*.
- **Obbligo di Delegazione (`delegate`)**: Nei token `ERC20Votes`, il semplice saldo non conferisce potere di voto finché il possessore non esegue una chiamata esplicita a `delegate(...)` (anche verso se stesso).
- **Ruoli Timelock**:
  - `PROPOSER_ROLE`: concesso al contratto `MyGovernor` affinché solo le proposte approvate dal voto possano essere accodate.
  - `CANCELLER_ROLE`: concesso al contratto `MyGovernor` per consentire la cancellazione coordinata.
  - `EXECUTOR_ROLE`: concesso a `address(0)` affinché chiunque possa triggerare l'esecuzione una volta scaduto il ritardo.
  - `DEFAULT_ADMIN_ROLE`: revocato al deployer dopo il setup per rendere la governance totalmente autonoma.

---

## 🚀 Guida all'utilizzo

### 1. Installazione e Test
Installa le dipendenze principali:
```bash
npm install
```

Esegui la suite di test completa (include test di Access Control, quorum fallito, maggioranza contraria e cancellazione):
```bash
npm test
```

### 2. Simulazione Interattiva da Terminale
Simula l'intero ciclo di vita (delega, proposta, voto a maggioranza, accodamento in Timelock ed esecuzione finale):
```bash
npm run interact
```

### 3. Distribuzione Crediti & Token agli Account
Per inviare 10.000 token NAO e attivare il potere di voto agli account locali #1..#4:
```bash
npm run fund:local
```
Per finanziare un indirizzo specifico (ad esempio il tuo account MetaMask) con token NAO e 10 ETH per le gas fee:
```bash
TO=0xTuoIndirizzoMetamask AMOUNT=5000 npm run fund:local
```

### 4. Esportazione Chiavi Locali per MetaMask (Opzionale)
Per esportare gli stessi 20 account con chiavi private forniti dal nodo locale di Hardhat:
```bash
npm run generate-keys
```
Le chiavi verranno salvate in `local-keys.json` (escluso dal repository).

---

## 💻 Frontend Client (Vite + React)

Il progetto include una DApp moderna in `client/` con interfaccia dark glassmorphism:
- **Dashboard Statistiche**: Saldo NAO, Potere di Voto attivo, Delegato corrente e valore memorizzato nel contratto `Box`.
- **Auto-Delega con 1 Click**: Attivazione immediata del potere di voto.
- **Lista Proposte Interattiva**: Visualizzazione in tempo reale di tutte le proposte con stato colorato, barre percentuali dei voti e pulsanti contestuali (*Vota*, *Accoda*, *Esegui*, *Cancella*).
- **Creazione Proposte**: Form per sottoporre modifiche al contratto `Box`.
- **Simulatore Fast-Forward Blocchi**: Pulsanti integrati per minare blocchi sul nodo Hardhat locale direttamente dal browser (`evm_mine`), facilitando il passaggio tra gli stati `Pending` $\rightarrow$ `Active` $\rightarrow$ `Succeeded`.

### Avvio Completo con Nodo Locale e Frontend

1. **Terminale 1 – Avvia la blockchain locale:**
   ```bash
   npm run node
   ```

2. **Terminale 2 – Esegui il deploy dei contratti sul nodo:**
   ```bash
   npm run deploy:local
   ```
   *(Lo script salverà automaticamente la configurazione e le ABI aggiornate in `client/src/contracts/`)*.

3. **Terminale 3 – Avvia l'interfaccia client:**
   ```bash
   npm run client:dev
   ```
   Apri il browser su [http://localhost:5174](http://localhost:5174), connetti MetaMask alla rete locale (RPC `http://127.0.0.1:8545`, Chain ID `31337`) e inizia a governare la DAO!






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
