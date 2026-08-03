
# HardhatSolidity07 — Document Validator su Arbitrum

Sistema di certificazione e verifica documenti costruito su **Arbitrum** (Layer 2 Ethereum).
Il contenuto dei documenti resta off-chain (IPFS), l'hash SHA256 viene registrato on-chain per garantirne l'integrità e l'autenticità.

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-000000?logo=Solidity" height=28/>
  <img src="https://img.shields.io/badge/Hardhat-2.x-302C53?logo=Hardhat" height=28/>
  <img src="https://img.shields.io/badge/Arbitrum-Sepolia-2D374B?logo=Arbitrum" height=28/>
  <img src="https://img.shields.io/badge/ethers.js-v6-purple" height=28/>
</p>

## Perché Arbitrum invece di Ethereum mainnet

- **Fee bassissime**: una transazione costa centesimi invece di dollari
- **Velocità**: conferma in pochi secondi
- **Compatibilità totale**: il contratto Solidity gira identico, cambia solo il chainId e l'RPC
- **Testnet gratuita**: Arbitrum Sepolia permette di testare senza costi reali

---

## Funzionalità del contratto

- `addIssuer(address)` — l'admin abilita un ente emettitore
- `removeIssuer(address)` — l'admin revoca un ente
- `addDocumentType(string)` — l'admin definisce le categorie di documento
- `issueDocument(recipient, hash, metadataURI, type)` — un issuer emette un certificato
- `revokeDocument(hash)` — l'issuer o l'admin revoca un documento
- `getDocument(hash)` — chiunque può verificare autenticità e stato di un documento
- `transferAdmin(address)` — trasferimento del ruolo admin

### Dati salvati on-chain
- Hash SHA256 del file (bytes32)
- URI dei metadati (es. IPFS JSON con nome corso, data, destinatario)
- Timestamp di emissione
- Indirizzo dell'ente emettitore
- Flag di revoca
- Tipo di documento

---

## Struttura del progetto

```
HardhatSolidity07DocumentValidatorArbitrum/
├── contracts/
│   └── DocumentCertifier.sol
├── scripts/
│   ├── deploy.js           # Deploy su qualsiasi rete
│   ├── interact.js         # Test flusso completo
│   ├── add-issuer.js       # Aggiunge un issuer (utile su testnet)
│   └── generate-keys.js    # Genera chiavi locali (solo sviluppo)
├── test/
│   └── DocumentCertifier.test.js  # 15 test (ethers v6)
├── .env                    # Chiavi private — NON committare
├── hardhat.config.js
└── package.json
```

---

## Avvio rapido — rete locale

```bash
npm install
npm run node              # terminale 1 — tienilo aperto
npm run deploy:local      # terminale 2 — deploya e copia deployed-contract.json in frontend/src/
npm run interact          # verifica il flusso completo da script
npm test                  # 15 test

# Avvia il frontend
cd frontend && npm install && npm start
```

Apri `http://localhost:3000` — MetaMask deve puntare a `http://127.0.0.1:8545`, chainId `31337`.

---

## Deploy su Arbitrum Sepolia (testnet pubblica)

### 1. Ottieni ETH Arbitrum Sepolia

Vai su uno di questi faucet e inserisci il tuo indirizzo MetaMask:

- [faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia) — 0.01 ETH, nessun requisito
- [faucets.chain.link/arbitrum-sepolia](https://faucets.chain.link/arbitrum-sepolia) — login GitHub/Twitter

> 0.01 ETH Arbitrum Sepolia è più che sufficiente per decine di deploy e centinaia di transazioni.
> Le fee su Arbitrum sono ~0.0001 ETH per transazione.

### 2. Configura il file `.env`

Inserisci la tua chiave privata:

```env
PRIVATE_KEY=0x_LA_TUA_CHIAVE_PRIVATA

# RPC già configurato di default (endpoint pubblico gratuito)
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

> **Come ottenere la chiave privata da MetaMask:**
> tre puntini accanto all'account → "Account details" → "Show private key"
>
> 🟡 Non committare mai il file `.env` con la chiave reale. È già in `.gitignore`.

### 3. Aggiungi Arbitrum Sepolia a MetaMask

| Campo | Valore |
|---|---|
| Network name | Arbitrum Sepolia |
| RPC URL | `https://sepolia-rollup.arbitrum.io/rpc` |
| Chain ID | `421614` |
| Symbol | ETH |
| Block explorer | `https://sepolia.arbiscan.io` |

### 4. Deploy

```bash
npm run deploy:arbitrum-sepolia
```

Output atteso:
```
=== Deploy DocumentCertifier ===
Network: arbitrumSepolia
Deployer: 0xTUO_INDIRIZZO
Balance:  0.01 ETH

✅ DocumentCertifier deployato a: 0xNUOVO_INDIRIZZO
🔍 Block explorer: https://sepolia.arbiscan.io/address/0xNUOVO_INDIRIZZO

ℹ️  Su rete pubblica gli issuer si aggiungono manualmente:
   ISSUER=0x<indirizzo> npx hardhat run scripts/add-issuer.js --network arbitrumSepolia
```

### 5. Aggiungi issuer

Su testnet puoi usare lo stesso account del deployer come issuer, oppure un secondo account:

```bash
ISSUER=0x_INDIRIZZO_ISSUER npm run add-issuer:arbitrum-sepolia
```

### 6. Avvia il frontend su Arbitrum Sepolia

```bash
cd frontend
npm install   # solo la prima volta
npm start     # apre http://localhost:3000
```

Il frontend legge automaticamente `frontend/src/deployed-contract.json` — aggiornato dal deploy — e si configura per Arbitrum Sepolia (chainId 421614).

MetaMask deve essere su **Arbitrum Sepolia**. Se non è presente, il frontend mostra un banner con il link "Cambia rete" che la aggiunge automaticamente.


### 6. Verifica il contratto su Arbiscan (opzionale)

Permette di interagire con il contratto direttamente dal block explorer senza frontend.

Registrati su [arbiscan.io](https://arbiscan.io) per ottenere una API key gratuita, poi:

```bash
# Aggiungi in .env:
# ARBISCAN_API_KEY=LA_TUA_API_KEY

npx hardhat verify 0xINDIRIZZO_CONTRATTO --network arbitrumSepolia
```

---

## Differenza tra "fork locale" e testnet reale

Il README originale menzionava `npx hardhat node --fork https://arb1.arbitrum.io/rpc` — questo crea un nodo locale che **simula** la mainnet di Arbitrum copiando il suo stato. È utile solo se il tuo contratto deve interagire con protocolli già esistenti su Arbitrum (Uniswap, ecc.). Per DocumentCertifier non serve.

**Usa sempre Arbitrum Sepolia** per i test pubblici — è la testnet ufficiale, gratuita e supportata.

---

## Test

```bash
npm test
```

15 test coprono: gestione issuer, emissione documenti, duplicati, verifica, revoca, sicurezza, trasferimento admin.

---

## Reti supportate

| Rete | ChainId | Comando | Note |
|---|---|---|---|
| Hardhat locale | 31337 | `npm run deploy:local` | Sviluppo, istantaneo |
| Arbitrum Sepolia | 421614 | `npm run deploy:arbitrum-sepolia` | Testnet pubblica, ETH gratis |
| Arbitrum One | 42161 | `npm run deploy:arbitrum` | Produzione reale |

---

## Note dello sviluppatore:
Sono riuscito a testare tutto:
- rilasciato su sepolia correttamente
- funziona il frontend per aggiungere Issuer e Tipi documento
- all'inizio mi ha dato errori in transazione perchè il Issuer deve avere ETH su TestNetSepolia e deve essere abiltiato dal admin 
- sono riuscito ad emettere un documento e poi validarlo da altro utente.
    - Stato: ✅ Documento valido
- Ho finito i crediti su Kiro e quindi mi sono fermato!


### Prossimi sviluppi

- **Lista documenti iterabile**: la `mapping(bytes32 => Document)` non è iterabile. Aggiungere un array di hash per permettere la paginazione on-chain.
- **Frontend React + wagmi**: port del frontend CRA esistente a Vite + wagmi (come fatto per il progetto 06)
- **Audit log on-chain**: registro consultabile di tutte le operazioni admin
- **Multi-chain**: deploy parallelo su Optimism, zkSync, Base



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
