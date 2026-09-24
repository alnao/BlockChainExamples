# Solidity SmartContract 10 – Decentralized Exchange (DEX) AMM

Questo progetto implementa un Exchange Decentralizzato (DEX) basato sul modello Automated Market Maker (AMM) con formula Constant Product ($x \cdot y = k$), ispirato al funzionamento di Uniswap V2.

## 🎯 Obiettivi
- Creare una coppia di trading formata da **NAO Token (ERC20)** ed **ETH nativo**.
- Implementare la logica del Liquidity Pool con protezione da attacchi di Reentrancy (`ReentrancyGuard`).
- Consentire l'impostazione di **tolleranza allo slippage** e **scadenze temporali (deadline)**.
- Permettere agli utenti di:
  - Aggiungere liquidità e ricevere token LP in proporzione.
  - Rimuovere liquidità restituendo i token LP.
  - Eseguire Swap diretti tra NAO ed ETH applicando la fee dello 0.3%.

## 📚 Concetti Chiave
- **Automated Market Maker (AMM)**: algoritmo basato sulla riserva di asset invece di un order book tradizionale.
- **Constant Product Formula**: $x \cdot y = k$, dove il prodotto delle riserve non può diminuire dopo uno swap (le fee lo fanno crescere).
- **Liquidity Provider (LP) Tokens**: rappresentano la quota proporzionale del pool spettante all'utente.
- **Slippage & Deadline**: meccanismo per prevenire perdite dovute alla volatilità o al frontrunning.

## 🧮 Formule
Con $R_A$ e $R_{ETH}$ riserve del pool e $S$ totale degli LP token emessi:

| Operazione | Formula |
|---|---|
| Primo deposito (LP) | $\sqrt{a \cdot e} - 1000$ (i 1000 `MINIMUM_LIQUIDITY` vanno a `0x…dEaD`) |
| Depositi successivi (LP) | $\min\left(\frac{a \cdot S}{R_A}, \frac{e \cdot S}{R_{ETH}}\right)$ |
| Prezzo per aggiungere liquidità (`quote`) | $b = \frac{a \cdot R_B}{R_A}$ |
| Rimozione | $a = \frac{lp \cdot R_A}{S}$, $e = \frac{lp \cdot R_{ETH}}{S}$ |
| Swap con fee 0.3% (`getAmountOut`) | $out = \frac{in \cdot 997 \cdot R_{out}}{R_{in} \cdot 1000 + in \cdot 997}$ |

Esempio: pool da 1000 NAO / 10 ETH, swap di 100 NAO → $\frac{100 \cdot 997 \cdot 10}{1000 \cdot 1000 + 100 \cdot 997} \approx 0.9066$ ETH (senza fee sarebbero 0.909).

## 🔧 Funzioni del contratto `SimpleDEX`

| Funzione | Descrizione |
|---|---|
| `addLiquidity(amountADesired, amountAMin, amountETHMin, deadline)` payable | Deposita NAO + ETH nella proporzione corrente: preleva solo i NAO necessari e rimborsa l'ETH in eccesso. Restituisce `(amountA, amountETH, liquidity)` |
| `removeLiquidity(liquidity, amountAMin, amountETHMin, deadline)` | Brucia LP token e restituisce la quota di NAO ed ETH |
| `swapAforETH(amountIn, amountOutMin, deadline)` | Vende NAO per ETH (richiede `approve` preventivo) |
| `swapETHforA(amountOutMin, deadline)` payable | Vende ETH per NAO |
| `getReserves()` | Riserve correnti `(reserveA, reserveETH)` |
| `getAmountOut(amountIn, reserveIn, reserveOut)` | Preventivo di uno swap, utile per calcolare `amountOutMin` |
| `quote(amountA, reserveA, reserveB)` | Quantità equivalente al prezzo corrente, utile per `addLiquidity` |

Eventi: `LiquidityAdded`, `LiquidityRemoved`, `Swap(user, tokenIn, amountIn, amountOut)` con `tokenIn = address(0)` per ETH.

La `deadline` è obbligatoria (timestamp in secondi): per calcolare i minimi lato client si leggono `getReserves()` e `getAmountOut()` e si applica la tolleranza, come fa `scripts/interact.js` (1%).

## 🛡️ Scelte di sicurezza
- **Riserve contabilizzate** (`reserveA`, `reserveETH`) invece di `balanceOf`/`address(this).balance`: token donati o ETH forzati (es. `selfdestruct`) non alterano il prezzo.
- **`MINIMUM_LIQUIDITY`** bloccata al primo deposito: impedisce l'attacco di "inflation" del primo depositante.
- **`ReentrancyGuard`**, `SafeERC20` e `Address.sendValue` per i trasferimenti; il contratto non ha `receive()`, quindi rifiuta ETH inviati direttamente.

---

## 🚀 Guida all'utilizzo

### 1. Installazione e Test
Installa le dipendenze del progetto:
```bash
npm install
```

Esegui la suite di test completa (liquidità, swap con importi esatti, slippage, deadline, attacchi):
```bash
npm test
```

Opzionale: per esportare in un file gli stessi 20 account (indirizzo e chiave privata) che `npx hardhat node` mette a disposizione, ad esempio per importarli in MetaMask:
```bash
npm run generate-keys
```
Lo script `scripts/generate-keys.js` deriva le chiavi dal mnemonic configurato in `hardhat.config.js` (di default quello standard di Hardhat, quindi gli indirizzi coincidono con quelli stampati dal nodo locale) e le salva in `local-keys.json`, file escluso dal versionamento tramite `.gitignore`. **Queste chiavi sono pubbliche e note a tutti: usale solo sul nodo locale, mai su mainnet.**

### 2. Esecuzione dello Script di Demo Interattivo
Per osservare la creazione della pool, la fornitura di liquidità, gli swap nei due versi e la rimozione di liquidità sulla rete Hardhat in memoria:
```bash
npm run interact
```

### 3. Deploy su Nodo Locale
Avvia il nodo locale Hardhat in un terminale:
```bash
npm run node
```

In un secondo terminale esegui il deploy (crea il pool con 100 NAO + 1 ETH e salva gli indirizzi in `deployed-contract.json`):
```bash
npm run deploy:local
```
Lo script esporta anche indirizzi, chain ID e ABI nella cartella `client/src/contracts/` per il frontend React.

La demo sul nodo locale riusa i contratti di `deployed-contract.json`:
```bash
npm run interact:local
```

### 4. Distribuire token NAO agli altri account (`fund.js`)
Dopo il deploy **tutti i NAO sono dell'account #0** (il deployer); gli altri account Hardhat hanno solo ETH e un wallet MetaMask esterno non ha nulla. Senza parametri lo script invia **1000 NAO** a ciascuno degli account Hardhat #1..#4:
```bash
npm run fund:local
```

Con le variabili d'ambiente `TO` e `AMOUNT` invia un importo a piacere a un indirizzo specifico, ad esempio il tuo wallet MetaMask; se il destinatario ha meno di 1 ETH riceve anche **10 ETH** per il gas:
```bash
TO=0xTuoIndirizzoMetamask AMOUNT=500 npx hardhat run scripts/fund.js --network localhost
```

## 🖥️ Client React
Nella cartella `/client` c'è un frontend (Vite + React + ethers) per provare il DEX da browser:
- **Dashboard**: saldo NAO/ETH del wallet, LP posseduti con quota del pool, riserve e prezzo corrente.
- **Swap** in entrambe le direzioni (pulsante ⇅) con stima dell'output, minimo garantito e impatto sul prezzo; il minimo reale viene ricalcolato on-chain con `getAmountOut` al momento dell'invio.
- **Liquidità**: aggiunta con ETH calcolato automaticamente dalla proporzione del pool (se il pool è vuoto si inseriscono entrambe le quantità) e rimozione con anteprima di quanto si riceve.
- **Tolleranza slippage** configurabile (default 1%) applicata a swap e liquidità; `approve` dei NAO e `deadline` (tempo della chain + 10 minuti) sono gestiti in automatico.
- **Report del pool**: storico di tutte le transazioni del DEX (di qualsiasi account) con statistiche (numero di transazioni, volume, fee maturate per gli LP), grafici dell'andamento di prezzo e riserve e tabella con filtro "Solo le mie" ed esportazione CSV.

#### Come funziona il report
Il client non usa un backend né un indexer: legge con `queryFilter` gli eventi `LiquidityAdded`, `LiquidityRemoved` e `Swap` del contratto e li **rigioca in ordine** partendo da riserve zero. Poiché le riserve cambiano solo tramite queste tre operazioni, la ricostruzione coincide esattamente con `getReserves()` on-chain dopo ogni transazione:

| Evento | Riserva NAO | Riserva ETH |
|---|---|---|
| `LiquidityAdded` | + amountA | + amountETH |
| `LiquidityRemoved` | − amountA | − amountETH |
| `Swap` con `tokenIn` = NAO | + amountIn | − amountOut |
| `Swap` con `tokenIn` = `address(0)` (ETH) | − amountOut | + amountIn |

Il prezzo dopo ogni transazione è `riservaNAO / riservaETH`, la fee dello swap è lo 0.3% di `amountIn`. Gli eventi vengono letti in modo incrementale (solo i blocchi nuovi) ogni 5 secondi e subito dopo ogni transazione; se il nodo locale viene riavviato lo storico riparte da zero. I tre grafici hanno il crosshair sincronizzato (anche con la tabella) e sono navigabili da tastiera con le frecce.

#### Avvio del Client
Con il nodo in esecuzione e il deploy fatto (punto 3):
```bash
cd client
npm install
npm run dev
```
Apri l'indirizzo mostrato (solitamente `http://localhost:5173`) nel browser.

#### Configurazione MetaMask
- Configura la rete **Hardhat Localhost** (`http://127.0.0.1:8545`, Chain ID `31337`): se il wallet è su un'altra rete il client lo segnala.
- Importa uno degli account Hardhat (chiave privata dal terminale di `npm run node` oppure da `local-keys.json`). L'account #0 possiede i NAO e le LP iniziali; per gli altri usa `fund.js` (punto 4).
- Gli indirizzi in `client/src/contracts/config.js` vengono riscritti a ogni deploy: se riavvii il nodo rifai il deploy e ricarica la pagina.
- Se dopo un riavvio del nodo MetaMask resta bloccato su una transazione, vai in *Impostazioni → Avanzate → Cancella dati della scheda attività* per azzerare il nonce memorizzato.





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
