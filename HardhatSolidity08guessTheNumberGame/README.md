# Solidity SmartContract08 – GuessTheNumberMulti Game

Un gioco blockchain **"indovina il numero" multi-partita** sviluppato con **Solidity (v0.8.20)** e **Hardhat**, in cui ogni utente può avviare la propria partita e chiunque può provare a indovinare su tutte le partite attive simultaneamente.

Il progetto include protezioni avanzate contro **Denial of Service (DoS)**, **Mempool Front-Running (MEV)** via pattern **Commit-Reveal**, gestione automatica dei **Dust Token**, **Timeout e Cancellazione** delle partite inattive, ed errori personalizzati (**Custom Errors**) per massimizzare l'efficienza del gas.

---

## 🎯 Caratteristiche Principali & Architettura

- **Multi-Partita Simultanea**: Ogni utente (*setter*) può avviare la propria partita definendo un numero segreto a 20 cifre ($\ge 10^{19}$).
- **Integrazione Token ERC20 (`NAOTOKENERC20`)**:
  - `setFee`: Fee pagata dal setter per avviare o aggiornare il proprio numero (va ad alimentare il montepremi `prizePool` della propria partita).
  - `guessFee`: Fee pagata dai giocatori ad ogni tentativo di indovinare.
- **Protezione Anti Front-Running (Commit-Reveal Pattern)**:
  - **Fase 1 (`commitGuess`)**: Il giocatore invia l'hash del tentativo `keccak256(abi.encodePacked(msg.sender, guessNum, salt))` e paga la `guessFee`.
  - **Fase 2 (`revealGuess`)**: In un blocco successivo, il giocatore rivela `guessNum` e `salt`. Questo impedisce ai bot MEV di intercettare il numero nella mempool e rubare la vincita.
  - **Tentativo Diretto (`guessAny`)**: Rimane disponibile per un'interazione rapida in ambienti di test privi di miner MEV malevoli.
- **Prevenzione DoS con `EnumerableSet`**:
  - Utilizza `EnumerableSet.AddressSet` di OpenZeppelin per tracciare **solo i setter attivi**.
  - Quando una partita viene vinta o cancellata, il setter viene rimosso dal set in $O(1)$, evitando cicli infiniti ed errori di superamento del Gas Limit.
- **Timeout e Cancellazione (`cancelGame`)**:
  - Se una partita rimane inattiva/non indovinata per **30 giorni**, il setter può annullarla e recuperare l'intero `prizePool` accumulato.
- **Gestione Resti (Dust Handling)**:
  - In caso di tentativo errato, la metà della `guessFee` viene suddivisa equamente tra le partite attive. Eventuali resti della divisione intera (`half % activeCount`) non vanno persi ma vengono accreditati in modo sicuro al bilancio `adminBalance`.
- **Rate Limiting**:
  - Limite di **massimo 4 tentativi ogni 7 ore** per indirizzo utente per prevenire lo spam.

---

## 🛠️ Struttura del Progetto

```
HardhatSolidity08guessTheNumberGame/
├── contracts/
│   ├── GuessTheNumber.sol         # Smart contract principale (GuessTheNumberMulti)
│   └── NAO-TOKEN-ERC20.sol        # Smart contract del Token ERC20 (NAOTOKENERC20)
├── scripts/
│   ├── addresses.js               # Utility per salvare/caricare gli indirizzi dei contratti
│   ├── deploy.js                  # Script di deployment per Hardhat/Sepolia/EC2
│   └── interact.js                # CLI interattiva completa (Commit-Reveal, Status, Admin)
├── test/
│   └── GuessTheNumber.test.js     # Suite completa di test unitari Chai/Ethers
├── create_ec2_node.sh             # Script per il provisioning automatico di un nodo EC2
├── destroy_ec2_node.sh            # Script per la distruzione del nodo EC2
├── hardhat.config.js              # Configurazione del framework Hardhat
├── package.json                   # Dipendenze Node.js
└── README.md                      # Questa documentazione
```

---

## 🚀 Setup e Installazione Locale

### 1. Prerequisiti
- **Node.js**: v18+ o v20+ (LTS consigliata)
- **npm** o **yarn**

### 2. Installazione Dipendenze
Dalla cartella del progetto (`HardhatSolidity08guessTheNumberGame`), eseguire:
```bash
npm install --legacy-peer-deps
```

### 3. Configurazione File `.env` (Opzionale per reti esterne/EC2)
Creare un file `.env` nella radice della cartella:
```env
PRIVATE_KEY=0xIL_TUO_PRIVATE_KEY_PRIMARIO
SECOND_PRIVATE_KEY=0xIL_TUO_PRIVATE_KEY_SECONDARIO
INFURA_PROJECT_ID=IL_TUO_INFURA_PROJECT_ID
EC2_URL=http://<IP_PUBLICO_EC2>:8545
```

### 4. Compilazione dei Contratti
```bash
npx hardhat compile
```

---

## 🧪 Esecuzione dei Test in Locale

La suite di test verifica la corretta esecuzione di tutte le funzionalità e delle condizioni di errore custom:

```bash
npm test
# oppure
npx hardhat test
```

### Copertura dei Test (`GuessTheNumber.test.js`):
1. **Avvio e Aggiornamento Partite**: Verifica `startGame`, `updateNumber` e il tracciamento dei setter attivi.
2. **Guess Diretto (`guessAny`)**: Verifica l'erogazione automatica del montepremi e la contestuale rimozione del setter dal set attivo.
3. **Distribuzione Fee ed Errori**: Verifica che i tentativi errati dividano la fee tra i prize pool attivi e l'admin senza perdite di token (dust handling).
4. **Pattern Commit-Reveal**: Verifica che il giocatore possa fare il `commit`, che il reveal nello stesso blocco fallisca (`CommitmentTooEarly`), e che il reveal in un blocco successivo eroghi la vincita.
5. **Timeout e Cancel Game**: Verifica che `cancelGame` rimborsi il setter dopo 30 giorni e fallisca prima del tempo (`GameNotExpired`).
6. **Rate Limit & Custom Errors**: Verifica il blocco dopo 4 tentativi in 7 ore e i controlli sui permessi admin/parametri.

---

## 📊 Deployment e CLI Interattiva

### 1. Avviare la Blockchain Locale Hardhat
Aprire un terminale e avviare il nodo locale:
```bash
npx hardhat node
```

### 2. Eseguire il Deploy dei Contratti
In un secondo terminale, eseguire lo script di deploy:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Il deploy rilascerà sia il token `NAOTOKENERC20` che il gioco `GuessTheNumberMulti`, salvando gli indirizzi in `deployed-addresses.json`.

### 3. Avviare l'Interfaccia CLI Interattiva (`interact.js`)
```bash
npx hardhat run scripts/interact.js --network localhost
```

### Opzioni della CLI:
- `1. 🎮 Avvia partita (startGame)`: Inserisci un numero di 20 cifre e paga la `setFee`.
- `2. 🔄 Aggiorna numero (updateNumber)`: Modifica il numero segreto incrementando il montepremi.
- `3. 🎯 Prova a indovinare diretto (guessAny)`: Invia un tentativo immediato in una singola transazione.
- `4. 🔒 Commit tentativo (commitGuess)`: Invia l'hash segreto `(guess + salt)` per proteggerti da MEV.
- `5. 🔓 Reveal tentativo (revealGuess)`: Rivela il numero e il salt nel blocco successivo per ritirare il premio.
- `6. 🚫 Cancella partita (cancelGame)`: Recupera i fondi se la tua partita è inattiva da oltre 30 giorni.
- `7. 🏦 Admin preleva (adminWithdraw)`: Consente all'admin di ritirare le fee accumulate.
- `8. 📊 Stato contratto e partite attive`: Visualizza il bilancio admin, le fee correnti e le info sulla tua partita.
- `9. 🪙 Info token e approve`: Gestisci la balance e la *allowance* necessaria per giocare.
- `10. 🎁 Trasferisci token`: Invia token ad altri account di test.
- `11. 🔄 Cambia account`: Passa tra gli account precaricati nel nodo Hardhat.

---

## 🌐 Deployment su Nodo EC2 / Sepolia Testnet

Per eseguire il deploy su una rete Ethereum privata con Geth avviata su istanza AWS EC2 (oppure su testnet Sepolia):

1. Configurare `EC2_URL` e `PRIVATE_KEY` nel file `.env`.
2. Eseguire il deploy puntando alla rete `ec2geth` o `sepolia`:
   ```bash
   npx hardhat run scripts/deploy.js --network ec2geth
   ```
3. Avviare lo script di interazione specificando la rete:
   ```bash
   npx hardhat run scripts/interact.js --network ec2geth
   ```

---

## 🔒 Sicurezza & Best Practices

- **ReentrancyGuard**: Estende l'implementazione OpenZeppelin per prevenire attacchi di rientrata sulle funzioni con trasferimento token (`cancelGame`, `adminWithdraw`, `revealGuess`, `guessAny`).
- **Storage Scalabile O(1)**: `EnumerableSet` previene il blocco delle transazioni per limite di gas.
- **Custom Errors**: Utilizzo esclusivo di Custom Errors Solidity 0.8 per la riduzione dei costi di gas rispetto alle stringhe di `require`.
- **Commit-Reveal Hash Scheme**:
  $$\text{commitment} = \text{keccak256}(\text{abi.encodePacked}(\text{msg.sender}, \text{guessNum}, \text{salt}))$$

---

# &lt; AlNao /&gt;
Tutti i codici sorgente e le informazioni presenti in questo repository sono frutto di un attento e paziente lavoro di sviluppo da parte di AlNao, che si è impegnato a verificarne la correttezza nella misura massima possibile. Qualora parte del codice o dei contenuti sia stato tratto da fonti esterne, la relativa provenienza viene sempre citata, nel rispetto della trasparenza e della proprietà intellettuale. 

Alcuni contenuti e porzioni di codice presenti in questo repository sono stati realizzati anche grazie al supporto di strumenti di intelligenza artificiale, il cui contributo ha permesso di arricchire e velocizzare la produzione del materiale. Ogni informazione e frammento di codice è stato comunque attentamente verificato e validato, con l’obiettivo di garantire la massima qualità e affidabilità dei contenuti offerti. 

Per ulteriori dettagli, approfondimenti o richieste di chiarimento, si invita a consultare il sito [AlNao.it](https://www.alnao.it/).

## License
Made with ❤️ by <a href="https://www.alnao.it">AlNao</a> &bull; Public projects <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPL%20v3-blue?style=plastic" alt="GPL v3" /></a> *Free Software!*

Il software è distribuito secondo i termini della GNU General Public License v3.0. L'uso, la modifica e la ridistribuzione sono consentiti, a condizione che ogni copia o lavoro derivato sia rilasciato con la stessa licenza. Il contenuto è fornito "così com'è", senza alcuna garanzia, esplicita o implicita.
