# Solidity SmartContract 13 – Lotteria Verificabile con Chainlink VRF

Questo progetto implementa una lotteria decentralizzata equa, sicura e trasparente che utilizza l'oracolo crittografico **Chainlink VRF (Verifiable Random Function) V2** per generare numeri casuali crittograficamente verificabili on-chain, eliminando qualsiasi possibilità di manomissione o anticipazione dell'esito da parte di minatori, validatori o del proprietario del contratto.

---

## 🎯 Obiettivi del Progetto

- Creare uno smart contract `Lottery` in cui gli utenti acquistano biglietti pagando una quota (`entryFee`) in token ERC-20 (**NAO**).
- Integrare **Chainlink VRF V2** (`VRFConsumerBaseV2` e `VRFCoordinatorV2Interface`) per l'estrazione imparziale e verificabile del vincitore.
- Implementare una macchina a stati rigida (`LotteryState`: `OPEN`, `CALCULATING_WINNER`, `CLOSED`) che blocca nuovi ingressi durante l'estrazione per evitare attacchi di front-running.
- Trasferire in modo atomico il 100% del montepremi accumulato all'indirizzo del vincitore estratto.
- Resettare automaticamente lo stato per i round successivi (`lotteryId` incrementale, reset della lista partecipanti).
- Fornire strumenti completi di test locale con mock di Chainlink VRF (`VRFCoordinatorV2Mock`), script di simulazione CLI e un'applicazione frontend **React + Vite**.

---

## 📚 Concetti Chiave & Architettura

| Componente | Ruolo & Descrizione |
|---|---|
| `Lottery.sol` | Smart contract principale: gestione biglietti, montepremi, macchina a stati e callback VRF |
| `NAO-TOKEN-ERC20.sol` | Token ERC-20 conforme OpenZeppelin usato per l'acquisto dei biglietti della lotteria |
| `VRFCoordinatorV2Mock.sol` | Simulatore locale ufficiale Chainlink per test e sviluppo senza spendere LINK su testnet |
| **Request-Response Pattern** | Flusso asincrono in 2 fasi: richiesta (`requestRandomWords`) e callback del nodo (`fulfillRandomWords`) |
| **Provable Fairness** | Garanzia matematica che il numero casuale non sia manipolabile da alcuno |
| **Macchina a stati (`LotteryState`)** | `OPEN` (biglietteria attiva) $\rightarrow$ `CALCULATING_WINNER` (in attesa dell'oracolo) $\rightarrow$ `OPEN` (round successivo) |

### Flusso del Ciclo di Vita della Lotteria

```
[1. OPEN]
   │
   ├─► Giocatori approvano NAO e chiamano enter()
   │   (I token NAO confluiscono nel montepremi del contratto)
   │
[2. pickWinner() chiamato dall'Owner]
   │
   ├─► Verifica: stato OPEN e almeno 1 giocatore iscritto
   ├─► Transizione di stato a CALCULATING_WINNER (nuovi ingressi bloccati)
   └─► Chiamata a COORDINATOR.requestRandomWords(...) ──► [Chainlink VRF Oracle]
                                                                  │
                                                      (Elaborazione casualità)
                                                                  │
[3. Callback fulfillRandomWords()] ◄──────────────────────────────┘
   │
   ├─► Calcolo indice vincitore: randomWords[0] % players.length
   ├─► Trasferimento del 100% del saldo NAO al vincitore
   ├─► Registrazione recentWinner e recentPrize
   ├─► Reset array partecipanti (delete players)
   ├─► Incremento round (lotteryId++)
   └─► Ritorno allo stato OPEN per il round successivo!
```

---

## 🗂 Struttura del Progetto

```
HardhatSolidity13LotteryChainlink/
├── contracts/
│   ├── Lottery.sol              # Contratto Lotteria con Chainlink VRF V2
│   ├── MockVRF.sol              # Import del simulatore VRFCoordinatorV2Mock
│   └── NAO-TOKEN-ERC20.sol      # Token ERC20 di pagamento (NAO)
├── scripts/
│   ├── deploy.js                # Deploy mock VRF, subscription, token, lottery ed esportazione ABI al client
│   ├── fund.js                  # Distribuisce ETH e NAO Token agli account locali
│   ├── interact.js              # Simulazione CLI completa con loadOrDeploy pattern
│   └── generate-keys.js         # Esporta chiavi e indirizzi locali Hardhat in local-keys.json
├── test/
│   └── Lottery.test.js          # Suite completa di 18 test unitari ed edge cases
├── client/                      # Frontend Web React + Vite (porta 5176)
│   ├── src/
│   │   ├── App.jsx              # Interfaccia grafica completa della Lotteria
│   │   ├── App.css              # Tema moderno dark & glassmorphism
│   │   ├── main.jsx
│   │   └── contracts/           # ABI e config generati automaticamente da deploy.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── deployed-contract.json       # Tracciamento indirizzi dei contratti rilasciati
├── hardhat.config.js            # Configurazione Hardhat (EVM cancun, network localhost)
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

Tutti i test girano sul nodo in-memory di Hardhat con `VRFCoordinatorV2Mock`:

```bash
npm test
```

La suite copre:
- Inizializzazione, parametri del costruttore e permessi owner.
- Acquisto biglietti con approvazione token ERC-20 e controllo saldi.
- Prevenzione DoS ed edge cases (impossibile entrare durante `CALCULATING_WINNER`).
- Modifica del prezzo biglietto consentita solo ad owner e a round vuoto.
- Richiesta casualità a Chainlink VRF e callback di adempimento `fulfillRandomWords`.
- Verifica del trasferimento del premio al vincitore e reset per round successivi.
- Esecuzione consecutiva di round multipli.

---

### 3. Simulazione Rapida via CLI (Senza Interfaccia)

Puoi eseguire una simulazione completa del flusso in memoria in un unico comando:

```bash
npm run interact
```

Lo script:
1. Deploia il Mock VRF Coordinator e registra la subscription.
2. Deploia il token NAO e la Lotteria.
3. Distribuisce token ai giocatori di prova.
4. Fa acquistare i biglietti ai giocatori.
5. Chiama `pickWinner()`.
6. Simula la risposta crittografica dell'oracolo Chainlink (`fulfillRandomWords`).
7. Stampa il vincitore estratto, il premio vinto e verifica il reset per il round successivo.

---

### 4. Test con Nodo Locale Persistente e Interfaccia Web

Per testare l'applicazione completa con **MetaMask** e l'interfaccia grafica:

#### Passo A: Avviare il Nodo Locale Hardhat
Apri un primo terminale ed esegui:
```bash
npm run node
```
Il nodo rimarrà in ascolto su `http://127.0.0.1:8545` con 20 account pre-finanziati.

#### Passo B: Deployare i Contratti sul Nodo Locale
In un secondo terminale:
```bash
npm run deploy:local
```
Questo comando:
- Deploia i contratti sul nodo `localhost`.
- Salva la configurazione in `deployed-contract.json`.
- Esporta automaticamente indirizzi e ABI in `client/src/contracts/`.

#### Passo C: Finanziare gli Account di Test
Per distribuire ETH per il gas e token NAO agli account locali da testare:
```bash
npm run fund:local
```
*(Opzionale: puoi finanziare un indirizzo specifico con `TO=0x... AMOUNT=200 npm run fund:local`)*.

#### Passo D: Generare le Chiavi per MetaMask
Per ottenere le chiavi private degli account di test Hardhat da importare in MetaMask:
```bash
npm run generate-keys
```
Le chiavi verranno mostrate a terminale e salvate nel file sicuro `local-keys.json`.

#### Passo E: Avviare l'Applicazione Web Client
```bash
npm run client:dev
```
L'interfaccia si aprirà nel browser all'indirizzo:
```
http://localhost:5176
```

---

## 🦊 Configurazione di MetaMask per il Test Locale

1. **Aggiungi la Rete Locale**:
   - **Nome Rete**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Simbolo Valuta**: `ETH`
2. **Importa gli Account di Test**:
   - In MetaMask clicca su *Account* $\rightarrow$ *Aggiungi account o wallet hardware* $\rightarrow$ *Importa account*.
   - Incolla la chiave privata dell'**Account #0** (Owner) o dell'**Account #1** presenti in `local-keys.json`.
3. **Interagisci con la DApp**:
   - Connetti MetaMask al client su `http://localhost:5176`.
   - Clicca su **🚰 Faucet NAO** per ricaricare istantaneamente il tuo saldo se necessario.
   - Clicca su **Acquista Biglietto** per partecipare all'estrazione.
   - Con l'account Owner, clicca su **🎯 Avvia Estrazione (pickWinner)**.
   - Durante lo stato `CALCULATING_WINNER`, clicca su **⚡ Simula Risposta VRF (fulfillRandomWords)** per completare l'estrazione locale e vedere il vincitore proclamato a schermo in tempo reale!

---

## 📜 Script npm Disponibili

| Script | Comando | Descrizione |
|---|---|---|
| `npm test` | `npx hardhat test` | Esegue l'intera suite di 18 test unitari |
| `npm run compile` | `npx hardhat compile` | Compila i contratti Solidity con ottimizzatore Cancun |
| `npm run node` | `npx hardhat node` | Avvia il nodo locale Ethereum Hardhat su porta 8545 |
| `npm run deploy` | `npx hardhat run scripts/deploy.js` | Deploy in-memory (per test veloci) |
| `npm run deploy:local` | `npx hardhat run scripts/deploy.js --network localhost` | Deploy su nodo locale persistente ed esportazione ABI al client |
| `npm run fund:local` | `npx hardhat run scripts/fund.js --network localhost` | Top-up ETH e invio token NAO agli account di test |
| `npm run interact` | `npx hardhat run scripts/interact.js` | Simulazione CLI autonoma in memoria |
| `npm run interact:local` | `npx hardhat run scripts/interact.js --network localhost` | Simulazione CLI contro i contratti deployati sul nodo locale |
| `npm run generate-keys` | `npx hardhat run --no-compile scripts/generate-keys.js` | Esporta le chiavi degli account Hardhat in `local-keys.json` |
| `npm run client:install` | `npm --prefix client install` | Installa le dipendenze del frontend React |
| `npm run client:dev` | `npm --prefix client run dev` | Avvia il server di sviluppo Vite del frontend (porta 5176) |
| `npm run client:build` | `npm --prefix client run build` | Compila il bundle di produzione dell'applicazione client |

---

## 🔒 Sicurezza e Best Practice Implementate

1. **Nessun Random On-Chain Prevedibile**:
   Non vengono usati parametri manipolabili dai validatori come `block.timestamp`, `blockhash` o `block.prevrandao`. La casualità è demandata esclusivamente alla prova crittografica verificata da Chainlink VRF.
2. **Prevenzione Front-Running**:
   La funzione `pickWinner()` blocca istantaneamente lo stato su `CALCULATING_WINNER`, impedendo a chiunque di acquistare biglietti una volta avviata la richiesta all'oracolo.
3. **Controllo Accesso Rigido sulla Callback**:
   La callback `rawFulfillRandomWords` implementata nel contratto base `VRFConsumerBaseV2` verifica tassativamente che il chiamante sia il coordinatore VRF autorizzato (`vrfCoordinator`), rigettando qualsiasi tentativo di chiamata non autenticata con errore personalizzato `OnlyCoordinatorCanFulfill`.
4. **Protezione Fondi**:
   La modifica della quota del biglietto `setEntryFee()` è permessa unicamente se non ci sono partecipanti registrati nel round corrente, evitando cambi di regole a gioco iniziato.

---

Revisionato e testato in ottobre 2026



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
