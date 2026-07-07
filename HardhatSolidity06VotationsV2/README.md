# HardhatSolidity06VotationsV2

Sistema di votazione decentralizzato su Ethereum — **Hardhat v3 + viem + wagmi**.

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-000000?logo=Solidity&logoColor=white" height=28/>
  <img src="https://img.shields.io/badge/Hardhat-3.x-302C53?logo=Hardhat&logoColor=white" height=28/>
  <img src="https://img.shields.io/badge/viem-2.x-purple" height=28/>
  <img src="https://img.shields.io/badge/wagmi-2.x-blue" height=28/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=React&logoColor=white" height=28/>
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=Vite&logoColor=white" height=28/>
</p>

## Funzionalità

Il contratto `AdvancedVotingSystem` implementa un sistema di votazione a stato:

```
Inactive → Registration → Voting → Completed → Inactive
```

- **Creazione sessione** (solo admin): titolo, descrizione, commissione candidatura e commissione voto
- **Registrazione candidati**: chiunque paga la commissione C1 può candidarsi
- **Avvio votazione** (solo admin): imposta il numero massimo di voti M per la vittoria automatica
- **Votazione**: ogni indirizzo paga la commissione C2 e vota una sola volta
- **Completamento automatico**: la votazione termina non appena un candidato raggiunge M voti
- **Termine manuale** (solo admin): determina il vincitore per maggioranza
- **Cancellazione sessione** (solo admin): annulla una sessione attiva
- **Prelievo fondi** (solo admin): ritira le commissioni accumulate
- **Storico**: tutte le sessioni passate con risultati sono conservate on-chain
- **Frontend React** (Vite + wagmi): interfaccia completa con pannello admin integrato

---

## Struttura del progetto

```
HardhatSolidity06VotationsV2/
├── contracts/
│   └── votations.sol               # Smart contract AdvancedVotingSystem
├── ignition/
│   └── modules/
│       └── AdvancedVotingSystem.js # Modulo deploy Hardhat Ignition
├── scripts/
│   ├── _helpers.js                 # Funzioni condivise (getContract)
│   ├── copy-abi.js                 # Copia ABI in client-vite/src/contracts/
│   ├── create-voting.js            # Crea una nuova sessione
│   ├── register-candidate.js       # Registra un candidato
│   ├── start-voting.js             # Avvia la fase di votazione
│   ├── vote.js                     # Vota per un candidato
│   ├── end-voting.js               # Termina la votazione manualmente
│   ├── get-voting-stats.js         # Mostra statistiche e storico
│   ├── withdraw-funds.js           # Preleva fondi dal contratto
│   ├── change-admin.js             # Cambia l'amministratore
│   └── send-op-tx.ts               # Esempio transazione OP L2
├── test/
│   └── AdvancedVotingSystem.test.js # 23 test con Hardhat v3 + node:test
├── client-vite/                    # Frontend React 19 + Vite + wagmi
│   ├── src/
│   │   ├── wagmi.js                # Configurazione wagmi (Hardhat local + Sepolia)
│   │   ├── contractConfig.js       # ABI + indirizzo contratto + costanti
│   │   ├── App.jsx                 # Componente principale
│   │   └── components/
│   │       ├── Header.jsx          # Header con stato votazione e disconnect
│   │       ├── Footer.jsx
│   │       ├── ConnectWallet.jsx   # Connessione wallet via wagmi
│   │       ├── RegistrationForm.jsx
│   │       ├── VotingSection.jsx
│   │       ├── PastVotings.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── AdminPanel.jsx      # Pannello admin integrato nel frontend
│   ├── package.json
│   └── vite.config.js
├── hardhat.config.ts               # Hardhat v3: viem plugin + EDR + Sepolia
├── package.json
└── .gitignore
```

---

## MetaMask — quale rete usare

Il frontend rileva automaticamente la rete attiva in MetaMask e usa l'indirizzo del contratto corretto. Se sei su una rete non supportata, mostra un messaggio con le istruzioni.

| Rete | Chain ID | Quando usarla |
|---|---|---|
| Hardhat localhost | **31337** | Sviluppo locale — ETH gratis, istantaneo |
| Sepolia testnet | **11155111** | Test su rete pubblica — richiede ETH Sepolia dai faucet |

### Rete locale (Hardhat)

1. Avvia il nodo: `npm run node`
2. In MetaMask aggiungi la rete:
   - RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Simbolo: `ETH`
3. Importa uno degli account Hardhat con la chiave privata da `npm run accounts`
4. Ogni account parte con **10.000 ETH finti** — non serve nessun faucet

### Sepolia testnet

1. Deploya il contratto: `npm run deploy:sepolia` (richiede `.env` con `SEPOLIA_RPC_URL` e `SEPOLIA_PRIVATE_KEY`)
2. Il file `client-vite/.env` viene aggiornato automaticamente con `VITE_CONTRACT_ADDRESS_11155111`
3. In MetaMask seleziona **Sepolia** e usa un account con ETH Sepolia
4. ETH Sepolia gratuiti:
   - [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia) — login GitHub/Twitter
   - [cloud.google.com/application/web3/faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) — solo account Google, nessun requisito



L'**account #0** è sempre l'admin — è quello usato da Hardhat Ignition per firmare il deploy.

Per vedere gli account con ruoli e saldi:

```bash
npm run accounts
```

Output di esempio:
```
  #  | Indirizzo                                  | Saldo (ETH)  | Ruolo
-----+--------------------------------------------+--------------+----------
  0  | 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 |     10000.00 | ADMIN ★
  1  | 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 |     10000.00 | account 1
  2  | 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc |     10000.00 | account 2
  ...
```

Le chiavi private della rete locale Hardhat sono **sempre le stesse** (sono pubbliche per design):

| Account | Indirizzo | Uso suggerito |
|---|---|---|
| #0 | `0xf39Fd6...b92266` | **Admin** (deploy + gestione sessioni) |
| #1 | `0x70997...c79C8` | Candidato 1 |
| #2 | `0x3C44...293BC` | Candidato 2 |
| #3 | `0x90F7...B906` | Votante 1 |
| #4 | `0x15d3...6A65` | Votante 2 |

Per importarli in MetaMask: **avatar → Importa account → incolla la chiave privata**.  
Le chiavi private vengono stampate da `npm run node`. Le prime 5 sono:

```
Account #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Account #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Account #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Account #3: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Account #4: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

> 🟡 **Queste chiavi sono pubbliche e identiche per tutti gli sviluppatori Hardhat.  
> Non usarle mai su mainnet o testnet reali.**

---



- **Node.js** v22+
- **MetaMask** (o qualsiasi wallet EIP-1193) installato nel browser

---

## Avvio rapido — rete locale

### 1. Installa le dipendenze

```bash
# dipendenze Hardhat (root)
npm install

# dipendenze frontend
cd client-vite && npm install && cd ..
```

### 2. Compila il contratto

```bash
npm run compile
```

### 3. Avvia il nodo locale Hardhat — **terminale separato, tienilo aperto**

```bash
npm run node
```

Il nodo gira su `http://127.0.0.1:8545` con chainId **31337**.

> **MetaMask**: aggiungi la rete con RPC `http://127.0.0.1:8545`, Chain ID `31337`, simbolo `ETH`.

### 4. Deploya il contratto

In un secondo terminale, con il nodo attivo:

```bash
npm run deploy:local
```

Questo comando:
1. Deploya con Hardhat Ignition sulla rete `localhost` (chainId 31337)
2. Legge l'indirizzo del contratto dal file Ignition generato
3. Copia l'ABI in `client-vite/src/contracts/`
4. **Aggiorna automaticamente** `client-vite/.env` con `VITE_CONTRACT_ADDRESS=0x...`

Output tipico:
```
✅  ABI copiata in: client-vite/src/contracts/AdvancedVotingSystem.json
✅  Indirizzo contratto (chain-31337): 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅  client-vite/.env aggiornato con VITE_CONTRACT_ADDRESS=0x5FbDB2...
```

### 5. Avvia il frontend

```bash
cd client-vite && npm run dev
```

Apri `http://localhost:5173`.

---

## Flusso di utilizzo

Una volta aperta l'app con MetaMask connesso alla rete locale:

1. **Admin** (account 0): usa il pannello admin per **creare una sessione** di votazione
2. **Candidati** (account 1, 2, ...): cliccano su _"Candidati"_ nella fase di registrazione
3. **Admin**: dal pannello, **avvia la votazione** impostando il numero massimo di voti M
4. **Votanti**: scelgono un candidato e cliccano _"Vota"_
5. La votazione si chiude automaticamente o l'admin la termina manualmente
6. I risultati sono visibili nel tab _"Storico Votazioni"_

---

## Script di interazione da riga di comando

Tutti gli script usano le variabili d'ambiente per i parametri:

```bash
# Crea una nuova votazione (solo quando Inactive)
TITLE="Elezioni 2025" DESCRIPTION="Vota il tuo rappresentante" npm run create-voting

# Registra candidato (CANDIDATE_IDX = indice account Hardhat, 1-based)
CANDIDATE_IDX=1 NAME="Mario Rossi" PROPOSAL="La mia proposta" npm run register-candidate
CANDIDATE_IDX=2 NAME="Anna Verdi"  PROPOSAL="La sua proposta" npm run register-candidate

# Avvia la votazione con massimo 3 voti per vincere
MAX_VOTES=3 npm run start-voting

# Vota (CANDIDATE_IDX = 1-based tra i candidati, VOTER_IDX = indice account)
CANDIDATE_IDX=1 VOTER_IDX=3 npm run vote
CANDIDATE_IDX=1 VOTER_IDX=4 npm run vote
CANDIDATE_IDX=2 VOTER_IDX=5 npm run vote

# Termina manualmente la votazione
npm run end-voting

# Mostra statistiche e storico
npm run stats

# Mostra tutti gli account con ruoli e chiavi private
npm run accounts

# Preleva tutti i fondi (ometti AMOUNT per prelevare tutto)
AMOUNT=0.3 npm run withdraw

# Cambia l'amministratore
NEW_ADMIN_IDX=1 npm run change-admin
```

---

## Test

```bash
npm test
```

Output atteso: **23 passing** (Hardhat v3 + `node:test`).

I test coprono:
- Inizializzazione e stato del contratto
- Creazione sessione (accesso admin)
- Registrazione candidati (commissione, doppia registrazione)
- Gestione fasi (transizioni di stato)
- Votazione (commissione, doppio voto)
- Completamento automatico e manuale
- Determinazione vincitore
- Storico e risultati (`getVotingResults`, `getAllPastVotingResults`)
- Prelievo fondi
- Cambio amministratore

---

## Deploy su Sepolia

1. Crea un file `.env` nella root del progetto:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_API_KEY>
SEPOLIA_PRIVATE_KEY=0x<YOUR_PRIVATE_KEY>
```

2. Deploy:

```bash
npx hardhat ignition deploy ignition/modules/AdvancedVotingSystem.js --network sepolia
npm run copy-abi
```

3. Aggiorna `VITE_CONTRACT_ADDRESS` in `client-vite/.env` con l'indirizzo Sepolia.

4. Aggiorna `client-vite/src/wagmi.js` se vuoi rimuovere la rete `hardhat` locale dalla lista.

> 🟡 Non committare mai file `.env` con chiavi private nel repository.

---

## Tecnologie

| Componente | Tecnologia | Note |
|---|---|---|
| Smart contract | Solidity 0.8.28 | Nessuna dipendenza esterna |
| Toolchain | Hardhat v3 + viem | ESM, `defineConfig`, EDR simulator |
| Deploy | Hardhat Ignition | Sostituisce le migration Truffle |
| Test | `node:test` + viem | 23 test, nessun mocha/chai |
| Frontend | React 19 + Vite 6 | Nessun Create React App |
| Wallet | wagmi v2 + viem v2 | Sostituisce web3.js |
| Reti supportate | Hardhat local, Sepolia | Configurabile in `wagmi.js` |




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
