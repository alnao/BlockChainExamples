# Anchor01 — VotationsSolana 🦀

Sistema di votazione su **Solana** con **Rust + Anchor**.  
Stesso use case di `HardhatSolidity06VotationsV2`, ma su una blockchain completamente diversa:  
modello ad account, lamports, PDA, istruzioni esplicite.

---

## 🎯 Obiettivi didattici

- Capire il **modello ad account di Solana** vs il modello a contratto di Ethereum
- Usare i **PDA (Program Derived Address)** come storage deterministico
- Capire come funzionano le **istruzioni Anchor** e perché ogni account va dichiarato
- Usare le **CPI (Cross-Program Invocations)** per trasferire lamports
- Scrivere test Anchor in **TypeScript**
- Interagire con Solana da frontend con `@solana/web3.js` e Phantom Wallet

---

## 📚 Concetti Solana introdotti

| Concetto | Descrizione | Equivalente Ethereum |
|---|---|---|
| **Program** | Logica on-chain (read-only dopo il deploy) | Smart Contract |
| **Account** | Contenitore di dati (separato dal program) | Storage del contratto |
| **PDA** | Indirizzo deterministico da seeds | `mapping(key => value)` |
| **Instruction** | Operazione atomica inviata al program | Chiamata a funzione |
| **Signer** | Account che autorizza l'istruzione | `msg.sender` |
| **Lamport** | Unità di conto (1 SOL = 10^9 lamports) | Wei (1 ETH = 10^18 wei) |
| **Rent** | SOL minimo per mantenere un account attivo | — (non esiste in Ethereum) |
| **CPI** | Chiamata da un program a un altro | External call |
| **IDL** | Interfaccia del program (JSON) | ABI |

---

## 🗂 Struttura del Progetto

```
Anchor01VotationsSolana/
├── programs/voting/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs               # Program Rust con Anchor (tutto commentato)
├── tests/
│   └── voting.ts                # Test TypeScript con @coral-xyz/anchor
├── app/                         # Frontend React + Vite + @solana/web3.js
│   ├── src/
│   │   ├── App.jsx              # UI con Phantom Wallet (voto, admin, storico)
│   │   ├── App.css              # Tema viola/Solana
│   │   ├── main.jsx
│   │   ├── polyfills.js         # Buffer globale per il browser (primo import di main.jsx)
│   │   └── contracts/
│   │       ├── config.js        # PROGRAM_ID e RPC_URL
│   │       └── voting.json      # IDL (generato da anchor build)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Porta 5178
├── Anchor.toml                  # Configurazione Anchor (Program ID, script di test con npx)
├── Cargo.toml                   # Workspace Rust
├── Cargo.lock                   # Versioni bloccate compatibili con Rust 1.75 (vedi Fase 2)
├── install_all.sh               # Installa Rust, Solana CLI, Anchor e dipendenze npm
├── uninstall_all.sh             # Rimuove tutto lo stack
├── tsconfig.json
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Guida Passo-Passo

### Fase 0 — Installazione dell'intero stack Solana

> **Scorciatoia:** invece dei passaggi manuali qui sotto puoi usare lo script automatico:
> ```bash
> bash install_all.sh
> ```
> Per disinstallare tutto in un colpo: `bash uninstall_all.sh`

Questo è il prerequisito più articolato: Solana richiede strumenti separati da Node.js.

#### 0a. Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup update stable
rustc --version
```

#### 0b. Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# Ricarica la shell, poi:
export PATH="/home/alnao/.local/share/solana/install/active_release/bin:$PATH"
solana --version

# Configura per localnet
solana config set --url localhost

# Genera un keypair locale (se non esiste)
solana-keygen new --no-bip39-passphrase
solana address   # stampa il tuo indirizzo
```

#### 0c. Anchor CLI

```bash
# Installa avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1
anchor --version   # deve stampare anchor-cli 0.30.1
```

> **Nota:** l'installazione di Rust + Anchor può richiedere 10-20 minuti la prima volta perché compila tutto da sorgente.

### Fase 1 — Installazione dipendenze Node.js

```bash
cd Anchor01VotationsSolana
npm install
```

### Fase 2 — Compilazione del program Rust

```bash
anchor build
```

Questo:
1. Compila `programs/voting/src/lib.rs` con `cargo build-sbf`
2. Genera il bytecode in `target/deploy/voting.so`
3. Genera l'IDL in `target/idl/voting.json`
4. Genera i tipi TypeScript in `target/types/voting.ts`

> **Differenza con Solidity:** `anchor build` compila in SBF bytecode (Solana VM), non EVM bytecode.

> **Attenzione alle dipendenze:** `anchor build` non usa il Rust di sistema ma quello delle Solana platform-tools (Rust **1.75** con Solana CLI 1.18 / Anchor 0.30.1). Il `Cargo.lock` è quindi in formato `version = 3` e alcune librerie sono bloccate a versioni compatibili (`blake3 1.5.5`, `zeroize_derive 1.4.3`, `proc-macro2 1.0.94`). **Non eseguire `cargo update`**: le versioni più recenti richiedono `edition2024` e la build fallisce con *"feature `edition2024` is required"*. Se serve aggiornare una libreria usare `CARGO_RESOLVER_INCOMPATIBLE_RUST_VERSIONS=fallback cargo update -p <crate>` e riportare l'intestazione del lockfile a `version = 3`.

### Fase 3 — Test

```bash
anchor test
```

Questo comando:
1. Avvia `solana-test-validator` (nodo locale Solana, equivalente di `anvil`)
2. Deploya il program
3. Esegue i test TypeScript in `tests/voting.ts`
4. Ferma il validator

> **Differenza con Forge:** i test Anchor sono in TypeScript (non Solidity), ma chiamano istruzioni on-chain reali.

Per eseguire i test su un validator già in esecuzione:

```bash
# Terminale 1: avvia il validator
solana-test-validator --reset

# Terminale 2: esegui solo i test (senza riavviare il validator)
anchor test --skip-local-validator
```

> I test creano il `ProgramState`: per rilanciarli sullo stesso validator riavvialo prima con `--reset`, altrimenti il primo test fallisce con *"already in use"*.

Per eseguire un solo test (con il program già deployato sul validator):

```bash
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/voting.ts -g "Alice si registra"
```

### Fase 4 — Deploy su localnet

```bash
# Terminale 1
solana-test-validator --reset

# Terminale 2
anchor deploy --provider.cluster localnet
```

Il Program ID è l'indirizzo del keypair `target/deploy/voting-keypair.json` (generato al primo `anchor build`) e deve coincidere in tre punti:
- `Anchor.toml` → `[programs.localnet]`
- `programs/voting/src/lib.rs` → `declare_id!("...")`
- `app/src/contracts/config.js` → `PROGRAM_ID`

I primi due si allineano in automatico, il terzo va aggiornato a mano:

```bash
anchor keys sync                      # aggiorna Anchor.toml e declare_id!
solana-keygen pubkey target/deploy/voting-keypair.json   # ID da copiare in config.js
anchor build                          # ricompila con il nuovo ID
cp target/idl/voting.json app/src/contracts/voting.json  # IDL per il frontend
```

> Se gli ID non coincidono ogni istruzione fallisce con `DeclaredProgramIdMismatch`. Il keypair è in `target/` (non versionato): se lo perdi ne viene generato uno nuovo con un ID diverso e vanno ripetuti i passi sopra.

### Fase 5 — Interazione con la CLI di Solana

A differenza di Ethereum dove si usa `cast`, con Solana si può usare la CLI:

```bash
# Calcola l'indirizzo di un PDA dai suoi seeds (tipo:valore)
solana find-program-derived-address <PROGRAM_ID> string:program_state
solana find-program-derived-address <PROGRAM_ID> string:session u64le:1
solana find-program-derived-address <PROGRAM_ID> string:candidate u64le:1 pubkey:<PUBKEY_CANDIDATO>
solana find-program-derived-address <PROGRAM_ID> string:vote u64le:1 pubkey:<PUBKEY_VOTANTE>

# Visualizza un account PDA (byte grezzi)
solana account <PDA_ADDRESS>

# Visualizza un account PDA decodificato con l'IDL
anchor account voting.ProgramState <PDA_ADDRESS>
anchor account voting.VotingSession <PDA_ADDRESS>

# Trasferisci SOL a un account
solana transfer <ADDRESS> 2 --allow-unfunded-recipient

# Visualizza log del program in tempo reale
solana logs <PROGRAM_ID>

# Airdrop di SOL su localnet
solana airdrop 10 <ADDRESS>
```

### Fase 6 — Frontend

**Prerequisito:** aver fatto il deploy e copiato l'IDL (Fase 4).

```bash
npm run app:install
npm run app:dev
```

Apri [http://localhost:5178](http://localhost:5178).

**Prerequisiti wallet:** installa **Phantom** ([phantom.app](https://phantom.app)).
Su Debian/Linux Phantom non è un pacchetto `apt`: è un'estensione del browser (Chrome, Chromium, Brave, Edge o Firefox), da installare dallo store.

- Chrome / Chromium / Brave / Edge: [Chrome Web Store](https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa)
- Firefox: [addons.mozilla.org](https://addons.mozilla.org/firefox/addon/phantom-app/)

Phantom non permette di aggiungere RPC personalizzati come MetaMask: per usare il validator locale
vai in **Impostazioni → Developer Settings → Testnet Mode** e seleziona la rete Solana **Localnet** (`http://127.0.0.1:8899`).

Fai un airdrop al tuo wallet Phantom:
```bash
solana airdrop 10 <TUA_PHANTOM_ADDRESS> --url localhost
```

> Se Phantom non è su Localnet non mostra i SOL e il popup di firma riporta *"Failed to simulate the result of this request"*: Phantom simula la transazione sulla sua rete, mentre il frontend la invia sempre al validator locale (`RPC_URL`).

**Flusso completo dal frontend:** servono più account Phantom (crea gli account con "Add account" e fai un airdrop a ciascuno), perché ogni candidato si registra dal proprio wallet e ogni wallet vota una sola volta.

1. **Admin** (il wallet che inizializza il program): *Inizializza Program*, poi tab **Admin** → crea una sessione con titolo e fee
2. **Candidati** (almeno 2 account diversi): tab **Votazione** → *Candidati* pagando la fee di registrazione
3. **Admin**: tab **Admin** → *Avvia* indicando i voti necessari per vincere
4. **Votanti**: tab **Votazione** → *Vota* sul candidato scelto; vince automaticamente il primo che raggiunge la soglia
5. **Admin**: può *Terminare* la votazione (vince il candidato con più voti), *Annullarla* oppure *Prelevare* le fee incassate
6. Tab **Storico**: tutte le sessioni concluse con il vincitore

Il frontend segue automaticamente il cambio di account in Phantom. I candidati non sono in un `mapping` come in Solidity: il frontend li legge con `program.account.candidateAccount.all()` (getProgramAccounts) filtrando con `memcmp` sul `session_id`.

---

## 🔄 Confronto Ethereum/Solidity vs Solana/Anchor

| Operazione | Ethereum (Hardhat/Solidity) | Solana (Anchor) |
|---|---|---|
| Nodo locale | `npx hardhat node` | `solana-test-validator` |
| Compilazione | `npx hardhat compile` | `anchor build` |
| Test | `npx hardhat test` (JS) | `anchor test` (TS) |
| Deploy | `npx hardhat run scripts/deploy.js` | `anchor deploy` |
| Interazione CLI | `cast send` | `solana ...` + script TS |
| Wallet browser | MetaMask | Phantom |
| Libreria frontend | ethers.js / viem | @solana/web3.js + @coral-xyz/anchor |
| Unità di conto | Wei (10^-18 ETH) | Lamport (10^-9 SOL) |
| Storage contratto | interno al contratto | Account PDA separati |
| Anti-doppio voto | `mapping(addr => bool)` | Creare PDA VoteRecord — se esiste → errore |
| "Allowance" token | `approve` + `transferFrom` | CPI al Token Program |

---

## 🏗️ Come funzionano i PDA in questo program

```
seeds              →  PDA risultante
─────────────────────────────────────────────────────────────
["program_state"]  →  Unico per tutto il program (admin, counter)
["session", 1]     →  Sessione #1
["session", 2]     →  Sessione #2
["candidate", 1, alice.pubkey]  →  Candidato Alice nella sessione 1
["candidate", 1, bob.pubkey]    →  Candidato Bob nella sessione 1
["vote", 1, voter1.pubkey]      →  Prova che voter1 ha votato nella sessione 1
["vote", 1, voter2.pubkey]      →  Prova che voter2 ha votato nella sessione 1
```

Il VoteRecord è il meccanismo anti-doppio voto: Anchor restituisce un errore se si cerca di creare (`init`) un account che esiste già. Non serve un `mapping(addr => bool)` come in Solidity.

---

## 🗑️ Disinstallazione completa

Se vuoi rimuovere tutto lo stack installato per questo progetto, ecco i comandi nell'ordine corretto.

### Anchor CLI e avm

`avm` (Anchor Version Manager) si installa come binario Cargo in `~/.cargo/bin/`:

```bash
# Rimuovi la versione di Anchor installata
avm uninstall 0.30.1

# Rimuovi avm stesso
cargo uninstall avm

# Verifica che non ci siano più binari Anchor residui
which anchor   # deve rispondere "not found"
```

Se `avm` non è più disponibile (perché Cargo è già stato rimosso), elimina direttamente i binari:

```bash
rm -f ~/.cargo/bin/anchor
rm -f ~/.cargo/bin/avm
```

### Solana CLI

La Solana CLI viene installata in `~/.local/share/solana/`:

```bash
# Rimuovi l'intera directory di installazione di Solana
rm -rf ~/.local/share/solana

# Rimuovi il keypair locale (ATTENZIONE: se ha SOL reali, salva prima la seed phrase)
# rm ~/.config/solana/id.json

# Rimuovi la directory di configurazione Solana
rm -rf ~/.config/solana

# Rimuovi eventuali voci nel PATH aggiunte al profilo della shell.
# Apri ~/.bashrc (o ~/.zshrc) e rimuovi la riga simile a:
#   export PATH="/home/<utente>/.local/share/solana/install/active_release/bin:$PATH"
# poi ricarica la shell:
source ~/.bashrc   # oppure: source ~/.zshrc

# Verifica
which solana   # deve rispondere "not found"
```

### Rust e Cargo

Rust si disinstalla con `rustup self uninstall`, che rimuove `rustup`, `rustc`, `cargo` e tutti i componenti installati:

```bash
rustup self uninstall
```

Questo comando:
- Rimuove `~/.cargo/bin/` (tutti i binari: `cargo`, `rustc`, `rustup`, `rustfmt`, ecc.)
- Rimuove `~/.cargo/` (registry, cache, librerie compilate)
- Rimuove `~/.rustup/` (toolchain installate)
- Rimuove le voci del PATH da `~/.bashrc`, `~/.zshrc`, `~/.profile`

Dopo il riavvio della shell (o `source ~/.bashrc`):

```bash
which rustc    # deve rispondere "not found"
which cargo    # deve rispondere "not found"
which rustup   # deve rispondere "not found"
```

### Riepilogo disinstallazione completa

```bash
# 1. Disinstalla Anchor e avm (mentre Cargo è ancora disponibile)
avm uninstall 0.30.1
cargo uninstall avm

# 2. Rimuovi Solana CLI
rm -rf ~/.local/share/solana
rm -rf ~/.config/solana

# 3. Disinstalla Rust + Cargo + rustup (tutto in uno)
rustup self uninstall

# 4. Ricarica la shell per pulire il PATH
source ~/.bashrc   # oppure ~/.zshrc
```

> **Ordine importante:** disinstalla Anchor/avm **prima** di rimuovere Rust, perché usano `cargo uninstall`. Se rimuovi Rust prima, devi cancellare i binari manualmente con `rm`.

---

## ⚠️ Note importanti

- `solana-test-validator --reset` azzera tutto il localnet a ogni riavvio
- Il keypair in `~/.config/solana/id.json` è il wallet dell'admin. Non committarlo
- Su localnet il `solana airdrop` è gratuito e illimitato
- Il `declare_id!` in `lib.rs` deve corrispondere al Program ID reale dopo il deploy
- Se cambi il codice del program, devi rifare `anchor build` e `anchor deploy`
- L'IDL `target/idl/voting.json` va ricopiato in `app/src/contracts/` dopo ogni build
- `withdraw_funds` agisce solo sulla sessione corrente e lascia sull'account il minimo per il rent: preleva le fee prima di creare una nuova sessione
- `anchor test` usa `npx` (npm), non `yarn`: lo script è definito in `Anchor.toml`


## Changelog

| Data | Descrizione |
|------|-------------|
| 2026-11-11 | Prima versione: program Anchor, test TypeScript, frontend React |
| 2026-11-19 | Fix build: dipendenze compatibili Rust 1.75, feature idl-build |
| 2026-11-19 | Fix borrow checker nelle CPI di trasferimento fee |
| 2026-11-19 | Test con npm invece di yarn, rimossi warning cfg |
| 2026-11-19 | Program ID sincronizzato tra programma, Anchor.toml e frontend |
| 2026-11-19 | Frontend: polyfill Buffer per il browser |
| 2026-11-19 | Frontend: voto, comandi admin, storico, cambio account Phantom |
| 2026-11-19 | README: istruzioni Phantom e rete Localnet aggiornate |
| 2026-11-19 | Revisione completa: progetto funzionante e testato |


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
