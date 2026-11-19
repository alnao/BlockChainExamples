# Solidity SmartContract 15 – Tokenized Vault ERC-4626 & Yield Strategy

Implementazione dello standard ufficiale **ERC-4626** (Tokenized Vault Standard), il formato unificato per vault di rendimento DeFi adottato da protocolli come Yearn Finance, Aave, e Compound. Il vault accetta depositi di token NAO ERC-20, genera rendimento tramite una strategia modulare e distribuisce automaticamente i profitti a tutti i depositanti tramite il meccanismo delle **share token** (quote di partecipazione).

---

## 🎯 Obiettivi del Progetto

- Implementare lo standard **ERC-4626** (`deposit`, `mint`, `withdraw`, `redeem`, `previewDeposit`, `previewWithdraw`, `convertToShares`, `convertToAssets`).
- Creare un sistema di **share token**: ogni deposito emette quote proporzionali al valore totale del vault. Man mano che il rendimento si accumula, ogni quota vale più asset sottostanti.
- Implementare una **strategia di rendimento simulata** modulare: il vault può interagire con un contratto `YieldStrategy` che simula l'accumulo di interessi (es. 5% APY) su base temporale.
- Aggiungere funzionalità avanzate: fee di gestione (`managementFee`), fee di performance, limite massimo di deposito (`depositCap`), e modalità di pausa d'emergenza.
- Integrare **Chainlink Price Feeds** (`AggregatorV3Interface`) per ottenere il valore in USD degli asset nel vault e fornire una valutazione aggiornata in tempo reale.
- Fornire un'interfaccia **React + Vite** con dashboard degli asset, visualizzazione APY, storico rendimenti e pannello di deposito/prelievo.

---

## 📚 Concetti Chiave & Architettura

| Componente | Ruolo & Descrizione |
|---|---|
| `NaoVault.sol` | Contratto principale ERC-4626: gestione depositi, prelievi e calcolo quote |
| `YieldStrategy.sol` | Strategia modulare che simula l'accumulo di rendimento (interesse composto) |
| `MockPriceFeed.sol` | Simulatore locale del Price Feed Chainlink per i test |
| `NAO-TOKEN-ERC20.sol` | Token ERC-20 sottostante (asset del vault, riutilizzato dai proj. precedenti) |
| **ERC-4626 Share Token** | Il vault stesso è un token ERC-20 (le quote del vault sono fungibili e trasferibili) |
| **Asset vs Share** | `asset` = token depositato (NAO); `share` = quota del vault (vNAO – Vault NAO) |
| **Chainlink Price Feed** | `AggregatorV3Interface` per il prezzo NAO/USD aggiornato on-chain |
| **Management Fee** | Fee prelevata periodicamente sull'AUM (Assets Under Management) |

### Meccanismo delle Quote (Share Token)

```
Stato iniziale del vault (vuoto):
  totalAssets = 0 NAO
  totalShares = 0 vNAO
  Tasso: 1 vNAO = 1 NAO

Alice deposita 100 NAO:
  shares_alice = 100 * totalShares / totalAssets = 100 * 1 = 100 vNAO
  totalAssets = 100 NAO | totalShares = 100 vNAO

Rendimento accumulato (+10 NAO dalla strategia):
  totalAssets = 110 NAO | totalShares = 100 vNAO (invariati!)
  Tasso: 1 vNAO = 1.10 NAO

Bob deposita 55 NAO:
  shares_bob = 55 * 100 / 110 = 50 vNAO
  totalAssets = 165 NAO | totalShares = 150 vNAO

Alice preleva le sue 100 vNAO:
  assets_alice = 100 * 165 / 150 = 110 NAO  (guadagno: +10 NAO!)
```

### Flusso di Deposito e Prelievo

```
[DEPOSITO]
  Utente → approve(vault, amount) → ERC20(NAO)
  Utente → deposit(amount, receiver) → NaoVault
  NaoVault → transferFrom(utente, vault, amount) → ERC20(NAO)
  NaoVault → _mint(receiver, shares) → ERC20(vNAO)
  Evento: Deposit(caller, owner, assets, shares)

[PRELIEVO]
  Utente → withdraw(assets, receiver, owner) → NaoVault
  NaoVault → _burn(owner, shares) → ERC20(vNAO)
  NaoVault → transfer(receiver, assets) → ERC20(NAO)
  Evento: Withdraw(caller, receiver, owner, assets, shares)

[ACCUMULO RENDIMENTO]
  Owner → harvestYield() → NaoVault
  YieldStrategy → calculateYield() → rendimento maturato
  YieldStrategy → transfer(vault, yield) → ERC20(NAO)
  (totalAssets aumenta → ogni share vale più NAO)
```

---

## 🗂 Struttura del Progetto

```
HardhatSolidity15ERC4626Vault/
├── contracts/
│   ├── NaoVault.sol               # Vault ERC-4626 principale con fee e cap
│   ├── YieldStrategy.sol          # Strategia modulare di generazione rendimento
│   ├── MockPriceFeed.sol          # Simulatore Price Feed Chainlink per test locali
│   └── NAO-TOKEN-ERC20.sol        # Token ERC20 sottostante (asset del vault)
├── scripts/
│   ├── deploy.js                  # Deploy NAO token, strategia, price feed, vault
│   ├── fund.js                    # Distribuisce ETH e token NAO agli account di test
│   ├── interact.js                # Simulazione CLI: depositi, harvest, prelievi, APY
│   └── generate-keys.js           # Esporta chiavi private locali Hardhat
├── test/
│   └── NaoVault.test.js           # Suite completa: ERC-4626, yield, fee, cap, edge cases
├── client/                        # Frontend React + Vite (porta 5178)
│   ├── src/
│   │   ├── App.jsx                # Dashboard vault: saldo, APY, quota, deposito/prelievo
│   │   ├── App.css                # Tema dark glassmorphism premium
│   │   ├── main.jsx
│   │   └── contracts/             # ABI e indirizzi generati da deploy.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── deployed-contract.json         # Indirizzi dei contratti deployati
├── hardhat.config.js              # Configurazione Hardhat (EVM cancun, localhost)
└── package.json
```

---

## 🚀 Guida all'Utilizzo Passo-Passo

### 1. Installazione Dipendenze

```bash
# Dipendenze del progetto Hardhat
npm install

# Dipendenze dell'interfaccia client
npm run client:install
```

### 2. Esecuzione dei Test Unitari

```bash
npm test
```

La suite copre:
- Conformità completa allo standard ERC-4626 (tutte le funzioni preview e convert).
- Deposito e prelievo di asset con verifica del corretto calcolo delle quote.
- Accumulo rendimento e incremento del valore della quota nel tempo.
- Verifica fee di gestione e fee di performance calcolate correttamente.
- Rispetto del `depositCap` (revert se il deposito supera il massimo).
- Modalità di pausa d'emergenza (revert su depositi, prelievi permessi).
- Integrazione del Price Feed mock per la valorizzazione USD.
- Edge cases: prelievo totale, primo deposito (bootstrap quota 1:1), vault vuoto.

---

### 3. Simulazione Rapida via CLI

```bash
npm run interact
```

Lo script simula:
1. Deploy del token NAO, della strategia YieldStrategy e del vault NaoVault.
2. Alice deposita 1000 NAO → riceve 1000 vNAO (quota 1:1 alla partenza).
3. Bob deposita 500 NAO → riceve 500 vNAO.
4. Simulazione accumulo rendimento (harvest): +50 NAO al vault dalla strategia.
5. Calcolo e stampa del nuovo valore della quota: 1 vNAO > 1 NAO.
6. Alice preleva tutte le sue 1000 vNAO → riceve ~1033 NAO (rendimento proporzionale).
7. Stampa del bilancio finale del vault, APY calcolato e valore in USD via Price Feed.

---

### 4. Test con Nodo Locale e Interfaccia Web

#### Passo A: Avviare il Nodo Locale Hardhat
```bash
npm run node
```
Il nodo rimarrà in ascolto su `http://127.0.0.1:8545`.

#### Passo B: Deployare i Contratti
```bash
npm run deploy:local
```
Deploia `NAO-TOKEN-ERC20`, `YieldStrategy`, `MockPriceFeed` e `NaoVault` con configurazione:
- **depositCap**: 1.000.000 NAO
- **managementFee**: 0.5% annuo
- **performanceFee**: 10% sul rendimento
- **Strategia APY simulata**: 5% annuo, accumulato ogni harvest

#### Passo C: Finanziare gli Account di Test
```bash
npm run fund:local
```
Distribuisce ETH e token NAO ai primi 5 account Hardhat.

#### Passo D: Generare le Chiavi per MetaMask
```bash
npm run generate-keys
```

#### Passo E: Avviare l'Applicazione Web
```bash
npm run client:dev
```
Apri il browser su `http://localhost:5178`.

---

## 🖥️ Interfaccia Web – Funzionalità

Il dashboard del vault ERC-4626 include:

1. **Pannello Panoramica Vault**:
   - `Total Assets (TVL)`: valore totale degli asset nel vault in NAO e in USD (via Price Feed).
   - `APY Corrente`: rendimento annuo percentuale calcolato sull'ultimo harvest.
   - `Quota vNAO/NAO`: il tasso di conversione attuale, visibile in tempo reale.
   - `Tuo Saldo`: quante vNAO possiedi e a quanto NAO corrispondono ora.
2. **Tab Deposita**: campo di input per quantità NAO, preview shares ricevute, bottone Approva + Deposita.
3. **Tab Preleva**: input per shares o asset da prelevare, preview importo ricevuto, bottone Preleva.
4. **Tab Strategia & Harvest** (solo owner): dashboard della strategia attiva, rendimento maturato da raccogliere, bottone Harvest per accreditare il rendimento al vault.
5. **Grafico Storico APY**: grafico a linee dell'andamento del valore della quota nel tempo (dati da eventi on-chain).

---

## 🦊 Configurazione di MetaMask per il Test Locale

1. **Aggiungi la Rete Locale**:
   - **Nome Rete**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Simbolo Valuta**: `ETH`
2. **Importa gli Account di Test**:
   - Usa le chiavi private da `local-keys.json`.
   - Account #0 = Owner (può eseguire harvest e modificare parametri del vault)
   - Account #1, #2 = Depositanti (utenti normali del vault)
3. **Esplora il flusso DeFi**:
   - Con Account #1: approva e deposita token NAO nel vault → ricevi vNAO.
   - Con Account #0 (Owner): esegui Harvest per accumulare il rendimento simulato.
   - Osserva come il valore di 1 vNAO aumenta rispetto a 1 NAO.
   - Con Account #1: ritira le vNAO e ricevi più NAO di quanti ne hai depositati!

---

## 📜 Script npm Disponibili

| Script | Comando | Descrizione |
|---|---|---|
| `npm test` | `npx hardhat test` | Esegue la suite di test unitari |
| `npm run compile` | `npx hardhat compile` | Compila i contratti Solidity |
| `npm run node` | `npx hardhat node` | Avvia il nodo locale su porta 8545 |
| `npm run deploy` | `npx hardhat run scripts/deploy.js` | Deploy in-memory |
| `npm run deploy:local` | `npx hardhat run scripts/deploy.js --network localhost` | Deploy su nodo locale |
| `npm run fund:local` | `npx hardhat run scripts/fund.js --network localhost` | Top-up ETH e token NAO |
| `npm run interact` | `npx hardhat run scripts/interact.js` | Simulazione CLI in memoria |
| `npm run interact:local` | `npx hardhat run scripts/interact.js --network localhost` | Simulazione CLI su nodo locale |
| `npm run generate-keys` | `npx hardhat run --no-compile scripts/generate-keys.js` | Esporta chiavi in `local-keys.json` |
| `npm run client:install` | `npm --prefix client install` | Installa dipendenze frontend |
| `npm run client:dev` | `npm --prefix client run dev` | Avvia Vite dev server (porta 5178) |
| `npm run client:build` | `npm --prefix client run build` | Build di produzione del client |

---

## 🔒 Sicurezza e Best Practice Implementate

1. **Conformità ERC-4626**:
   Tutte le funzioni `preview*` e `convert*` rispettano la specifica EIP-4626, garantendo la composabilità con altri protocolli DeFi. Le funzioni di preview non causano mai revert (salvo casi di overflow).
2. **Protezione da Inflazione delle Quote (Share Inflation Attack)**:
   Il primo deposito è gestito con un meccanismo di bootstrap che previene l'attacco classico al primo depositante tramite un deposito virtuale iniziale (implementazione OpenZeppelin ERC4626 pattern).
3. **Reentrancy Guard**:
   Le funzioni `deposit`, `mint`, `withdraw`, `redeem` e `harvestYield` sono tutte protette da `ReentrancyGuard`.
4. **Controllo Accesso Strategia**:
   Solo il vault può richiamare le funzioni di prelievo rendimento sulla strategia. La strategia non può essere sostituita senza governance multi-firma.
5. **Deposit Cap**:
   Un limite massimo al TVL del vault (`depositCap`) previene la concentrazione eccessiva di rischio. Configurabile dall'owner tramite governance.
6. **Emergency Pause**:
   In caso di anomalia, l'owner può sospendere i depositi. I prelievi rimangono sempre abilitati per garantire l'uscita degli utenti.

---

## 🔗 Riferimenti e Standard

- [EIP-4626: Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626) – La specifica ufficiale dello standard
- [OpenZeppelin ERC4626 Implementation](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC4626) – Implementazione di riferimento
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds) – Documentazione dei Price Feed Chainlink
- [Yearn Finance vaults](https://docs.yearn.fi/getting-started/products/yvaults/overview) – Ispirazione per le strategie di rendimento
- [ERC-4626 Alliance](https://erc4626.info/) – Risorse e implementazioni della community

---

Progetto pianificato e documentato in ottobre 2026


## Changelog

| Data | Descrizione |
|------|-------------|
| 2026-10-29 | Prima versione del progetto |


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
