# Solidity SmartContract 12 – NFT Marketplace con Royalties

Marketplace decentralizzato per NFT ERC721 con pagamento in token ERC20 (NAO), royalties automatiche ERC2981, commissione del marketplace configurabile e interfaccia React+Vite.

## 🎯 Obiettivi

- Creare una collezione NFT (`NFTCollection`: ERC721URIStorage + ERC2981).
- Implementare lo standard **ERC2981** per le royalties sui trasferimenti secondari.
- Creare un contratto `Marketplace` con:
  - Listing a prezzo fisso in token ERC20 (NAO).
  - Aggiornamento prezzo e cancellazione del listing.
  - Acquisto atomico con distribuzione automatica a creator (royalty), marketplace (fee) e seller (netto).
  - Commissione del marketplace configurabile (`feeBps`, default **2.5%**).
  - `Ownable` + `Pausable`: l'owner può aggiornare la fee, prelevare i proventi e sospendere il marketplace.
- Frontend React+Vite con wallet MetaMask, 4 tab operative.

---

## 📚 Concetti Chiave

| Concetto | Descrizione |
|---|---|
| **ERC721 / ERC721URIStorage** | NFT con URI metadati per ogni token |
| **ERC2981** | Standard on-chain per royalties in basis points (500 = 5%) |
| **Marketplace pattern** | listing → update → cancel → atomic buy |
| **Fee distribution** | `price = royalty + marketplace_fee + seller_net` |
| **Ownable + Pausable** | Controllo accesso e circuito d'emergenza |
| **Public mint** | Mint aperto a pagamento ETH, configurabile dall'owner |
| **ReentrancyGuard** | Protezione da attacchi di rientro su tutte le funzioni critiche |

### Distribuzione pagamento (esempio: 100 NAO, royalty 5%, fee 2.5%)

```
Buyer paga:       100.00 NAO
→ Creator (royalty 5%):     5.00 NAO
→ Marketplace (fee 2.5%):   2.50 NAO
→ Seller (netto 92.5%):    92.50 NAO
```

---

## 🗂 Struttura del Progetto

```
HardhatSolidity12MarketplaceNFT/
├── contracts/
│   ├── Marketplace.sol          # Marketplace con fee, Pausable, Ownable
│   ├── NFTCollection.sol        # ERC721 + ERC2981 + mint pubblico
│   ├── NAO-TOKEN-ERC20.sol      # Token ERC20 di pagamento
│   └── SimpleNFTNoRoyalty.sol   # Helper di test (ERC721 senza ERC2981)
├── scripts/
│   ├── deploy.js                # Deploy + salva deployed-contract.json + esporta ABI al client
│   ├── interact.js              # Simulazione completa (loadOrDeploy pattern)
│   ├── fund.js                  # Distribuisce NAO e minta NFT agli account locali
│   └── generate-keys.js        # Esporta le chiavi Hardhat in local-keys.json
├── test/
│   └── Marketplace.test.js     # 28+ test (NFTCollection, listing, buy, no-royalty)
├── client/                     # Frontend React+Vite
│   ├── src/
│   │   ├── App.jsx              # UI principale (4 tab)
│   │   ├── App.css              # Tema dark
│   │   ├── main.jsx
│   │   └── contracts/           # ABI e config generati da deploy.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Porta 5175
├── deployed-contract.json       # Generato da deploy.js
├── hardhat.config.js
└── package.json
```

---

## 🚀 Guida all'Utilizzo

### 1. Installazione

```bash
# Dipendenze Hardhat
npm install

# Dipendenze frontend
npm run client:install
```

### 2. Test

```bash
npm test
```

La suite copre 4 gruppi di test:
- **NFTCollection**: mint owner, publicMint (prezzo, refund, insufficiente), maxSupply, withdrawFunds, interfacce.
- **Marketplace Listing & Admin**: CRUD listing, revert non-seller/non-owner, setFee, pause/unpause.
- **Marketplace Buy**: distribuzione royalty+fee+netto, getPaymentBreakdown, rimozione listing, revert edge cases.
- **NFT senza ERC2981**: verifica che il marketplace gestisca NFT senza royalties (royalty=0, tutto a seller).

### 3. Compilazione

```bash
npm run compile
```

### 4. Simulazione interattiva (senza nodo locale)

Esegue un deploy in memoria, simula l'intero flusso e mostra la distribuzione del pagamento:

```bash
npm run interact
```

### 5. Deploy su nodo locale

Avvia il nodo Hardhat in un terminale separato:

```bash
npm run node
```

In un secondo terminale, deploya i contratti:

```bash
npm run deploy:local
```

Questo comando:
1. Deploya `NAOTOKENERC20`, `NFTCollection` (publicMintPrice=0.01 ETH), `Marketplace` (fee=2.5%).
2. Minta un NFT #0 al deployer.
3. Salva gli indirizzi in `deployed-contract.json`.
4. Esporta ABI e `config.js` in `client/src/contracts/`.

### 6. Distribuisci token e NFT agli account locali

```bash
# Distribuisce 1000 NAO + 2 NFT agli account #1-#4
npm run fund:local

# Personalizza importo e numero di NFT
AMOUNT=500 NFTS=3 npm run fund:local

# Singolo destinatario
TO=0xABCD... npm run fund:local
```

### 7. Interact su nodo locale (usa contratti già deployati)

```bash
npm run interact:local
```

Legge `deployed-contract.json` e riusa i contratti senza ridistribuire.

### 8. Frontend

```bash
npm run client:dev
```

Apri [http://localhost:5175](http://localhost:5175) e connetti MetaMask su Hardhat Local (chainId 31337).

```bash
# Build di produzione
npm run client:build
```

---

## 📱 Frontend — 4 Tab

| Tab | Funzionalità |
|---|---|
| **Marketplace** | Visualizza tutti i listing attivi con breakdown royalty/fee/netto. Pulsante Acquista con approvazione ERC20 automatica. |
| **I Miei NFT** | Lista gli NFT posseduti, form per listare un NFT (approve automatico), pulsante per cancellare un listing. |
| **Mint Pubblico** | Minta un nuovo NFT pagando in ETH. Mostra il prezzo corrente. |
| **Admin** | Mint riservato owner, aggiornamento fee marketplace, prelievo fee accumulate, pausa/ripresa marketplace. |

---

## 📄 Contratti

### `NFTCollection.sol`

| Funzione | Accesso | Descrizione |
|---|---|---|
| `mint(to, uri)` | `onlyOwner` | Minta un NFT gratuitamente |
| `publicMint(uri)` | Chiunque | Minta pagando `publicMintPrice` in ETH |
| `setPublicMintPrice(price)` | `onlyOwner` | Aggiorna il prezzo (0 = disabilita) |
| `setDefaultRoyalty(receiver, bps)` | `onlyOwner` | Aggiorna la royalty di default |
| `setTokenRoyalty(tokenId, receiver, bps)` | `onlyOwner` | Royalty per singolo token |
| `withdrawFunds(to)` | `onlyOwner` | Preleva ETH dai mint pubblici |
| `totalSupply()` | View | Numero totale di NFT mintati |

### `Marketplace.sol`

| Funzione | Accesso | Descrizione |
|---|---|---|
| `listItem(nft, id, price)` | Seller | Lista un NFT a prezzo fisso in NAO |
| `updateListingPrice(nft, id, price)` | Seller | Aggiorna il prezzo |
| `cancelListing(nft, id)` | Seller | Cancella il listing (anche in pausa) |
| `buyItem(nft, id)` | Buyer | Acquista con distribuzione automatica |
| `getListing(nft, id)` | View | Dettagli di un listing |
| `getPaymentBreakdown(nft, id)` | View | Simula la distribuzione royalty/fee/netto |
| `setFee(bps)` | `onlyOwner` | Aggiorna la fee (max 10% = 1000 bps) |
| `withdrawFees(to)` | `onlyOwner` | Preleva le fee accumulate in NAO |
| `pause() / unpause()` | `onlyOwner` | Sospende/riprende il marketplace |

---

## 🧪 Guida al Test Completo da Frontend

Questa sezione descrive come testare manualmente tutti i flussi del marketplace usando il frontend React e **4 account MetaMask distinti** importati dal nodo Hardhat locale.

### Prerequisiti

1. MetaMask installato nel browser.
2. Nodo Hardhat avviato e contratti deployati (vedi sezione 5).
3. Frontend in esecuzione su [http://localhost:5175](http://localhost:5175).

---

### Fase 0 — Preparazione MetaMask

#### Aggiungere la rete Hardhat Local

In MetaMask → Aggiungi rete manualmente:

| Campo | Valore |
|---|---|
| Nome rete | Hardhat Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Simbolo valuta | ETH |

> Il frontend può farlo automaticamente cliccando **Cambia rete** se la rete non è selezionata.

#### Importare gli account di test

Esporta le chiavi private degli account Hardhat:

```bash
npm run generate-keys
```

Apri `local-keys.json` e importa in MetaMask almeno 4 account (Account #0, #1, #2, #3) usando le rispettive chiavi private (`privateKey`).

| Account | Ruolo nel test |
|---|---|
| Account #0 | **Owner/Creator** — ha deployato i contratti, riceve le royalties |
| Account #1 | **Seller** — vende NFT nel marketplace |
| Account #2 | **Buyer** — acquista NFT con token NAO |
| Account #3 | **Utente pubblico** — testa il mint pubblico a pagamento ETH |

#### Distribuire NAO token e NFT agli account

Con il nodo e il deploy già eseguiti, distribuisci token e NFT agli account di test:

```bash
npm run fund:local
```

Questo assegna **1000 NAO** e **2 NFT** a ciascuno degli account #1–#4.

---

### Fase 1 — Connessione Wallet (Account #0 – Owner)

1. Apri [http://localhost:5175](http://localhost:5175).
2. Clicca **Connetti MetaMask** e seleziona **Account #0**.
3. Verifica nell'header: balance ETH e NAO visibili, indirizzo abbreviato.
4. Se la rete non è corretta, clicca **Cambia rete** → MetaMask aggiungerà Hardhat Local automaticamente.

**Risultato atteso:** header mostra `~10000.0000 ETH` e il balance NAO del deployer.

---

### Fase 2 — Mint Owner (Tab Admin, Account #0)

1. Vai sulla tab **Admin**.
2. Nel form **Mint NFT (Owner)**, inserisci un URI: `ipfs://QmTest/admin-nft.json`
3. Clicca **Minta** e conferma la transazione in MetaMask.
4. Vai su **I Miei NFT**: l'NFT appena mintato deve apparire nella griglia con il suo URI.

**Risultato atteso:** NFT visibile in "I Miei NFT" con `listed: false`.

---

### Fase 3 — Listing nel Marketplace (Account #1 – Seller)

1. Cambia account MetaMask → **Account #1** (già finanziato da `fund:local` con NFT #0 e #1).
2. Ricarica la pagina se necessario; l'app si aggiorna automaticamente al cambio account.
3. Vai su **I Miei NFT**: dovresti vedere gli NFT assegnati da `fund.js`.
4. Nel form **Lista un NFT nel Marketplace**:
   - Token ID: `0`
   - Prezzo: `50` (NAO)
5. Clicca **Lista NFT**.
   - MetaMask mostrerà **due transazioni in sequenza**: prima l'approvazione dell'NFT al marketplace (`approve`), poi la chiamata `listItem`. Conferma entrambe.
6. Vai sulla tab **Marketplace**: l'NFT #0 deve comparire con prezzo `50.0000 NAO` e il breakdown:
   - Royalty (5%): 2.5 NAO
   - Fee (2.5%): 1.25 NAO
   - Seller netto (92.5%): 46.25 NAO

**Risultato atteso:** listing visibile nel marketplace con breakdown corretto.

---

### Fase 4 — Aggiornamento Prezzo (Account #1 – Seller)

1. Rimani su **I Miei NFT** con Account #1.
2. L'NFT #0 mostra il badge **Il tuo listing** e il pulsante **Cancella Listing**.
3. Per aggiornare il prezzo, usa direttamente la tab **I Miei NFT** → form Lista NFT → inserisci lo stesso Token ID con nuovo prezzo `80` NAO e clicca **Lista NFT**.

   > Oppure, se vuoi testare `updateListingPrice` direttamente, usa la console del browser:
   > ```javascript
   > // Già connesso con ethers via MetaMask
   > // Questo è solo un test avanzato da console
   > ```

4. Vai sulla tab **Marketplace**: il prezzo del listing deve aggiornarsi a `80.0000 NAO`.

---

### Fase 5 — Cancellazione Listing (Account #1 – Seller)

1. Su **I Miei NFT** con Account #1, clicca **Cancella Listing** sull'NFT #0.
2. Conferma la transazione in MetaMask.
3. Verifica in **Marketplace**: l'NFT #0 non è più visibile tra i listing attivi.
4. Ri-lista l'NFT #0 a **100 NAO** (servirà per il test di acquisto).

---

### Fase 6 — Acquisto NFT (Account #2 – Buyer)

1. Cambia account MetaMask → **Account #2** (ha 1000 NAO da `fund:local`).
2. Vai sulla tab **Marketplace**: NFT #0 visibile a 100 NAO con breakdown:
   - Royalty (5% → Account #0): **5 NAO**
   - Fee marketplace (2.5%): **2.5 NAO**
   - Seller netto (Account #1, 92.5%): **92.5 NAO**
3. Clicca **Acquista** sull'NFT #0.
   - MetaMask mostrerà **due transazioni**: prima l'approvazione dei 100 NAO al marketplace (`approve`), poi `buyItem`. Conferma entrambe.
4. Dopo la conferma:
   - La tab **Marketplace** non mostra più NFT #0.
   - La tab **I Miei NFT** di Account #2 mostra NFT #0.
   - Nell'header, il balance NAO di Account #2 è diminuito di 100 NAO.

**Verifica distribuzione — controlla i balance NAO:**

| Account | Ruolo | Variazione attesa |
|---|---|---|
| Account #0 (Creator) | Riceve royalty | +5 NAO |
| Account #1 (Seller) | Riceve netto | +92.5 NAO |
| Account #2 (Buyer) | Paga | -100 NAO |
| Marketplace contract | Accumula fee | +2.5 NAO |

---

### Fase 7 — Mint Pubblico (Account #3 – Utente pubblico)

1. Cambia account MetaMask → **Account #3**.
2. Vai sulla tab **Mint Pubblico**.
3. Il prezzo mostrato è `0.01 ETH` (impostato al deploy).
4. Inserisci un URI: `ipfs://QmPublic/my-nft.json`
5. Clicca **Minta (0.01 ETH)** e conferma in MetaMask.
6. Vai su **I Miei NFT**: il nuovo NFT appare nella griglia.

**Risultato atteso:** NFT mintato e assegnato ad Account #3. I 0.01 ETH sono nel contratto `NFTCollection`, prelevabili dall'owner.

---

### Fase 8 — Prelievo Fee e Amministrazione (Account #0 – Owner)

1. Cambia account MetaMask → **Account #0**.
2. Vai sulla tab **Admin**.

#### Preleva fee marketplace
- Nella sezione **Preleva Fee Accumulate**, lascia il campo indirizzo vuoto (usa il wallet corrente) e clicca **Preleva**.
- Il balance NAO di Account #0 aumenta di **2.5 NAO** (dalla vendita della Fase 6).
- `accumulatedFees` torna a zero.

#### Preleva ETH dal mint pubblico
- Questo si fa via script (non è esposto nel frontend):
  ```bash
  # Oppure via hardhat console
  npx hardhat console --network localhost
  # > const nft = await ethers.getContractAt("NFTCollection", "<NFT_ADDRESS>")
  # > await nft.withdrawFunds("<YOUR_ADDRESS>")
  ```

#### Aggiorna la fee marketplace
- Nella sezione **Fee Marketplace**, inserisci `500` (= 5%) e clicca **Aggiorna Fee**.
- L'intestazione "Fee marketplace: 5%" si aggiorna nel tab Marketplace al prossimo polling (5 secondi).

#### Testa la pausa
1. Clicca **⏸ Metti in Pausa**.
2. Cambia account MetaMask → **Account #1**.
3. Prova a listare un NFT: il frontend mostra un errore `EnforcedPause`.
4. Torna su Account #0 → Admin → clicca **▶ Riprendi**.
5. Account #1 può listare nuovamente.

---

### Fase 9 — Verifica Edge Cases

#### Seller tenta di comprare il proprio NFT
1. Account #1 lista NFT #1 a 10 NAO.
2. Rimani su Account #1 e vai su **Marketplace**.
3. Clicca **Acquista** sul proprio NFT: il frontend mostra l'errore `Seller cannot buy own NFT`.

#### NFT trasferito fuori dal marketplace senza cancellare il listing
Questo si testa da script o console, non dal frontend (richiede due wallet in contemporanea):
```bash
npx hardhat console --network localhost
# > const nft = await ethers.getContractAt("NFTCollection", "<NFT_ADDRESS>")
# > const signer1 = (await ethers.getSigners())[1]
# > await nft.connect(signer1).transferFrom(signer1.address, signer3.address, 1)
# Ora il listing è "zombi": buyItem reverterà con "Seller no longer owns NFT"
```

---

### Riepilogo Flusso Completo

```
Account #0 (Owner)   → Admin: Mint NFT #0
Account #1 (Seller)  → I Miei NFT: Lista NFT #0 a 100 NAO
Account #2 (Buyer)   → Marketplace: Acquista NFT #0
                        ├─ +5 NAO   → Account #0 (royalty 5%)
                        ├─ +2.5 NAO → Marketplace (fee 2.5%)
                        └─ +92.5 NAO → Account #1 (netto)
Account #3 (Pubblico)→ Mint Pubblico: Minta pagando 0.01 ETH
Account #0 (Owner)   → Admin: Preleva fee (2.5 NAO)
Account #0 (Owner)   → Admin: Aggiorna fee, Pausa/Riprendi
```

---

## ⚠️ Note di Sicurezza

- Le chiavi in `local-keys.json` sono derivate dal mnemonic pubblico di Hardhat: **usare solo su rete locale**.
- `deployed-contract.json` e `local-keys.json` sono esclusi dal versionamento via `.gitignore`.
- Il contratto non supporta ETH nativo come pagamento: usa esclusivamente token NAO (ERC20).
- `SimpleNFTNoRoyalty.sol` è un helper solo per i test, non va deployato in produzione.
