# 🗺️ ROADMAP — BlockChainExamples

Questa roadmap pianifica i prossimi sviluppi del repository, espandendo lo stack tecnologico oltre Hardhat/Solidity con tre nuovi framework: **Foundry**, **Rust + Anchor (Solana)** e **Vyper**. Per ogni tecnologia sono previsti tre progetti, ispirati agli esempi già esistenti nel repository.

---

## 📌 Progetti in sviluppo (già presenti nel repository)

| Cartella | Descrizione | Stato |
|---|---|---|
| `HardhatSolidity14MultiSigWallet` | Wallet Multi-Firma M-of-N con Timelock | 🏗️ In sviluppo |
| `HardhatSolidity15ERC4626Vault` | Vault tokenizzato ERC-4626 con Chainlink Price Feed | 🏗️ Pianificato |

---

## 🔨 Sezione Foundry / Forge

**Cos'è Foundry:** framework moderno per lo sviluppo di smart contract Ethereum scritto in Rust. A differenza di Hardhat (dove test e script sono in JavaScript/TypeScript), con Foundry i **test sono scritti direttamente in Solidity**. Questo li rende molto più veloci (nessun bridge JS→EVM), permette il **fuzzing nativo** (generazione automatica di input casuali per trovare bug) e i **gas snapshot** per monitorare i costi nel tempo.

**Componenti principali:**
- `forge` — compilazione, test, deploy
- `cast` — interazione con la blockchain da terminale (equivalente di `hardhat run`)
- `anvil` — nodo locale (equivalente di `hardhat node`)
- `chisel` — REPL Solidity interattivo

**Differenza chiave rispetto a Hardhat:**

```solidity
// Test in Solidity con Foundry (non JS)
contract VotingTest is Test {
    Voting voting;

    function setUp() public {
        voting = new Voting();
    }

    function test_CreateCampaign() public {
        voting.createCampaign("Elezioni 2025");
        assertEq(voting.campaignCount(), 1);
    }

    // Fuzzing: forge genera automaticamente migliaia di valori per _guess
    function testFuzz_GuessNumber(uint256 _guess) public {
        vm.assume(_guess != SECRET);
        assertFalse(game.guess(_guess));
    }
}
```

**Prerequisiti installazione:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
```

---

### 🔨 Forge01VotationsFoundry

**Ispirato a:** `HardhatSolidity06VotationsV2`

**Descrizione:** riscrittura del sistema di votazione avanzato usando Foundry come toolchain al posto di Hardhat. Stesso contratto Solidity (`AdvancedVotingSystem.sol`), ma test completamente riscritti in Solidity con:
- test unitari con `forge test`
- **fuzzing** sugli input dei votanti (ID candidato, pesi del voto)
- **invariant testing**: verifica che i voti totali non superino mai il numero di elettori
- `cast` per interazione da terminale invece degli script JS
- `anvil` come nodo locale

**Cosa si impara:**
- Differenze pratiche Hardhat vs Foundry nella stessa codebase
- Cheatcodes `vm.prank()`, `vm.warp()`, `vm.roll()` per simulare utenti e tempo
- Fuzzing e invariant testing come livello superiore di qualità dei test
- Gas snapshot per confrontare l'efficienza di diverse implementazioni

**Struttura prevista:**
```
Forge01VotationsFoundry/
├── src/
│   └── AdvancedVotingSystem.sol
├── test/
│   ├── VotingSystem.t.sol       # test unitari
│   ├── VotingFuzz.t.sol         # fuzzing su input
│   └── VotingInvariant.t.sol    # invariant testing
├── script/
│   ├── Deploy.s.sol             # script di deploy in Solidity
│   └── Interact.s.sol
├── foundry.toml
└── README.md
```

**Stato:** 📋 Pianificato

---

### 🔨 Forge02GuessTheNumberFoundry

**Ispirato a:** `HardhatSolidity08guessTheNumberGame`

**Descrizione:** riscrittura del gioco "indovina il numero" multi-partita con Foundry. Questo use case è particolarmente adatto per il **fuzzing**: si può testare automaticamente che nessun valore casuale diverso dal numero segreto vinca la partita, e che solo il numero corretto la faccia vincere.

**Cosa si impara:**
- Fuzzing su funzioni con output booleano (`testFuzz_WrongGuessShouldFail`)
- Simulazione di più utenti con `vm.prank(address)`
- Test di eventi on-chain con `vm.expectEmit()`
- `cast send` e `cast call` per interagire con `anvil` da terminale
- Confronto gas cost rispetto all'implementazione Hardhat

**Struttura prevista:**
```
Forge02GuessTheNumberFoundry/
├── src/
│   └── GuessTheNumber.sol
├── test/
│   ├── GuessTheNumber.t.sol     # test unitari (crea partita, indovina, vince)
│   └── GuessTheFuzz.t.sol       # fuzzing: guess sbagliati non vincono mai
├── script/
│   ├── Deploy.s.sol
│   └── PlayGame.s.sol           # simula una partita completa con cast
├── foundry.toml
└── README.md
```

**Stato:** 📋 Pianificato

---

### 🔨 Forge03NFTMarketplaceFoundry

**Ispirato a:** `HardhatSolidity12MarketplaceNFT`

**Descrizione:** riscrittura del Marketplace NFT ERC721 con royalties ERC2981 usando Foundry. Il Marketplace è il caso d'uso più ricco per testare con Foundry: molti attori (creator, seller, buyer, marketplace owner), molte invarianti (i fondi distribuiti devono sempre sommare al prezzo totale), e flussi di acquisto che si prestano al fuzzing sui prezzi.

**Cosa si impara:**
- **Invariant testing** avanzato: `price == royalty + fee + sellerNet` deve valere sempre
- Fuzzing sui prezzi di listing (qualsiasi prezzo > 0 deve distribuire correttamente)
- `vm.startPrank()` / `vm.stopPrank()` per simulare sequenze multi-utente
- `deal()` per assegnare token ERC20 agli account di test senza deploy del token
- Gas optimization: confrontare l'ABI del contratto con i risultati del gas snapshot
- Deployment con `forge script` su rete locale e Sepolia

**Struttura prevista:**
```
Forge03NFTMarketplaceFoundry/
├── src/
│   ├── Marketplace.sol
│   ├── NFTCollection.sol
│   └── NAO-TOKEN-ERC20.sol
├── test/
│   ├── Marketplace.t.sol        # test unitari (listing, buy, cancel, fees)
│   ├── MarketplaceFuzz.t.sol    # fuzzing su prezzi e royalties
│   └── MarketplaceInvariant.t.sol  # invarianti distribuzione fondi
├── script/
│   ├── Deploy.s.sol
│   └── Interact.s.sol
├── foundry.toml
└── README.md
```

**Stato:** 📋 Pianificato

---

## 🦀 Sezione Rust + Anchor (Solana)

**Cos'è Anchor:** framework per lo sviluppo di **Solana Programs** (gli smart contract di Solana) in **Rust**. Solana è una blockchain completamente diversa da Ethereum: non usa l'EVM, ha un modello ad **account** invece di contratti, transazioni da migliaia al secondo e costi bassissimi (frazioni di centesimo).

**Differenze fondamentali rispetto a Ethereum/Solidity:**

| Ethereum | Solana |
|---|---|
| Smart Contract | Program |
| Contract storage interno | Account separati che contengono i dati |
| ERC20 token | SPL Token |
| msg.sender | `ctx.accounts.signer` |
| Solidity | Rust + Anchor |
| Hardhat/Foundry | Anchor CLI |
| ethers/viem | @solana/web3.js |
| MetaMask | Phantom / Solflare |

**Struttura tipica di un program Anchor:**
```rust
#[program]
pub mod voting {
    use super::*;

    pub fn create_campaign(ctx: Context<CreateCampaign>, name: String) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.vote_count = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateCampaign<'info> {
    #[account(init, payer = authority, space = 8 + Campaign::INIT_SPACE)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Campaign {
    pub name: String,
    pub vote_count: u64,
    pub authority: Pubkey,
}
```

**Prerequisiti installazione:**
```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
solana --version

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest
anchor --version
```

---

### 🦀 Anchor01VotationsSolana

**Ispirato a:** `HardhatSolidity06VotationsV2`

**Descrizione:** sistema di votazione on-chain su Solana con Rust + Anchor. Un account globale `ProgramState` tiene admin e contatori; ogni sessione di votazione è un **Account** PDA separato creato dall'admin. I candidati sono PDA derivati da sessione + wallet e pagano una fee di registrazione. I votanti chiamano l'istruzione `vote`, che crea un PDA `VoteRecord` (anti-doppio voto) e incrementa il contatore del candidato: il primo che raggiunge la soglia vince automaticamente.

**Concetti chiave introdotti:**
- **PDA (Program Derived Address):** indirizzi deterministici derivati da seed, usati per gli account di stato (campagne, candidati, registrazioni voto)
- **Account discriminator:** Anchor aggiunge 8 byte automaticamente per tipizzare gli account
- **CPIs (Cross-Program Invocations):** chiamate tra program diversi
- **System Program:** il program nativo Solana per creare account e trasferire SOL
- Test con `@coral-xyz/anchor` in TypeScript (sì, i test Anchor si scrivono in TS, non Rust)

**Struttura realizzata:**
```
Anchor01VotationsSolana/
├── programs/
│   └── voting/
│       └── src/
│           └── lib.rs           # istruzioni: initialize_program, create_voting_session, register_candidate,
│                                #   close_registration_and_start_voting, vote, end_voting, cancel_voting,
│                                #   withdraw_funds, change_admin
├── tests/
│   └── voting.ts                # test TypeScript con Anchor framework
├── app/                         # frontend React+Vite con @solana/web3.js e Phantom
├── Anchor.toml
├── Cargo.toml
└── README.md
```

**Stato:** ✅ Completato — revisionato e testato il 2026-11-19 (Solana CLI 1.18.26, Anchor 0.30.1)

---

### 🦀 Anchor02GuessTheNumberSolana

**Ispirato a:** `HardhatSolidity08guessTheNumberGame`

**Descrizione:** gioco "indovina il numero" multi-partita su Solana. Ogni partita è un **Account** PDA derivato dall'indirizzo del giocatore e da un seed sequenziale. Il numero segreto è salvato nell'account (hashed o in chiaro per semplicità didattica). Chiunque può tentare di indovinare inviando una transazione con il numero.

**Concetti chiave introdotti:**
- **Randomness su Solana:** Solana non ha un VRF nativo come Chainlink, si usa `SlotHashes` come fonte di pseudo-casualità oppure un oracolo (Switchboard VRF). Viene esplorata la differenza rispetto al VRF Chainlink usato nel progetto Ethereum 13.
- **Lamports:** unità di conto SOL (1 SOL = 1 miliardo di lamports). Il premio viene trasferito in lamports.
- **Close account:** quando una partita finisce, l'account viene chiuso e i lamports restituiti al creatore (`close = authority`)
- Differenza tra commit-reveal scheme su Ethereum e approcci Solana

**Struttura prevista:**
```
Anchor02GuessTheNumberSolana/
├── programs/
│   └── guess_game/
│       └── src/
│           └── lib.rs           # istruzioni: start_game, guess, claim_prize
├── tests/
│   └── guess_game.ts
├── Anchor.toml
├── Cargo.toml
└── README.md
```

**Stato:** 📋 Pianificato

---

### 🦀 Anchor03NFTSolana

**Ispirato a:** `HardhatSolidity12MarketplaceNFT`

**Descrizione:** creazione e marketplace di NFT su Solana usando lo standard **Metaplex**. Su Solana gli NFT non sono contratti ERC721 ma **SPL Token con supply=1** e metadati on-chain gestiti dal Metaplex Token Metadata Program. Il marketplace è un Program Anchor che gestisce listing, acquisto e royalties secondo lo standard **Programmable NFT (pNFT)** di Metaplex.

**Concetti chiave introdotti:**
- **SPL Token:** standard token Solana (equivalente ERC20/ERC721)
- **Metaplex Token Metadata Program:** il "OpenZeppelin degli NFT Solana", gestisce nome, symbol, URI, royalties (seller_fee_basis_points), creators
- **Associated Token Account (ATA):** ogni wallet ha un ATA per ogni tipo di token, gestito automaticamente da Anchor
- **Royalties su Solana:** codificate nel metadata (`seller_fee_basis_points`), ma non enforced on-chain di default — il marketplace deve rispettarle volontariamente
- Confronto con ERC2981 (enforced on-chain) del progetto 12

**Struttura prevista:**
```
Anchor03NFTSolana/
├── programs/
│   └── nft_marketplace/
│       └── src/
│           └── lib.rs           # istruzioni: mint_nft, list, delist, buy
├── tests/
│   └── nft_marketplace.ts
├── app/                         # frontend con @solana/wallet-adapter-react
├── Anchor.toml
├── Cargo.toml
└── README.md
```

**Stato:** 📋 Pianificato

---

## 🐍 Sezione Vyper

**Cos'è Vyper:** linguaggio di programmazione alternativo a Solidity per smart contract EVM. Compila allo stesso bytecode EVM di Solidity ma con una filosofia radicalmente diversa: **semplicità e sicurezza per design**.

**Differenze chiave rispetto a Solidity:**

| Solidity | Vyper |
|---|---|
| Ereditarietà multipla | ❌ Non supportata |
| Modifier | ❌ Non supportati (si usano funzioni interne) |
| Overloading funzioni | ❌ Non supportato |
| Overflow arithmetic | Protetto da OZ SafeMath | ✅ Nativo (checked by default) |
| Reentrancy | Richiede ReentrancyGuard | ✅ `@nonreentrant` nativo |
| Leggibilità | Media | ✅ Alta (simile a Python) |
| Usato da | Ethereum ecosystem | Curve Finance, Yearn |

**Struttura tipica di un contratto Vyper:**
```python
# SPDX-License-Identifier: MIT
# @version ^0.3.10

owner: public(address)
balances: public(HashMap[address, uint256])

@deploy
def __init__():
    self.owner = msg.sender

@external
@nonreentrant
def deposit():
    self.balances[msg.sender] += msg.value

@external
def withdraw(amount: uint256):
    assert self.balances[msg.sender] >= amount, "Insufficient balance"
    self.balances[msg.sender] -= amount
    send(msg.sender, amount)
```

**Toolchain:** Vyper si usa con Hardhat (plugin `@nomiclabs/hardhat-vyper`) o con Foundry (supporto nativo da Foundry v0.3+). Per questi esempi si usa **Hardhat + plugin Vyper**, così il confronto con i progetti Hardhat/Solidity esistenti è immediato.

**Prerequisiti installazione:**
```bash
# Installazione Vyper (tramite pip)
pip install vyper
vyper --version

# Oppure tramite Docker
docker pull vyperlang/vyper

# Plugin Hardhat per Vyper
npm install --save-dev @nomiclabs/hardhat-vyper
```

---

### 🐍 Vyper01VotationsVyper

**Ispirato a:** `HardhatSolidity06VotationsV2`

**Descrizione:** riscrittura del sistema di votazione in Vyper. È il confronto più diretto con un progetto già esistente: stesso use case, stessa EVM, stesso Hardhat — ma linguaggio completamente diverso. Permette di apprezzare le differenze sintattiche e architetturali tra i due linguaggi.

**Differenze che emergono rispetto alla versione Solidity:**
- Nessuna ereditarietà: `Ownable` di OpenZeppelin non si usa — il controllo accesso è gestito con `assert msg.sender == self.owner`
- Nessun `modifier`: il check owner viene ripetuto nelle funzioni che ne hanno bisogno (o estratto in una funzione `_check_owner()` interna)
- `@nonreentrant("lock")` invece di `ReentrancyGuard`
- `HashMap` invece di `mapping`, `DynArray` invece di array dinamici
- Tipi più espliciti: `uint256`, `address`, `bool`, `String[100]` (lunghezza massima obbligatoria)

**Struttura prevista:**
```
Vyper01VotationsVyper/
├── contracts/
│   └── VotingSystem.vy
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── VotingSystem.test.js
├── hardhat.config.js            # con require('@nomiclabs/hardhat-vyper')
├── package.json
└── README.md
```

**Stato:** 📋 Pianificato

---

### 🐍 Vyper02GuessTheNumberVyper

**Ispirato a:** `HardhatSolidity08guessTheNumberGame`

**Descrizione:** riscrittura del gioco "indovina il numero" multi-partita in Vyper. Il gioco si presta bene a Vyper perché è un contratto compatto con stato semplice (una `HashMap` di partite) e operazioni su fondi ETH — proprio il tipo di contratto per cui Vyper è stato progettato (sicurezza finanziaria, chiarezza del flusso di ETH).

**Differenze che emergono rispetto alla versione Solidity:**
- `@payable` invece di `payable` nella dichiarazione della funzione
- `send()` invece di `call{value: ...}` per inviare ETH
- `keccak256(concat(...))` invece di `keccak256(abi.encodePacked(...))`
- Overflow su numeri impossibile per design (no need for SafeMath)
- Il contratto risulta più corto e leggibile della versione Solidity

**Struttura prevista:**
```
Vyper02GuessTheNumberVyper/
├── contracts/
│   └── GuessTheNumber.vy
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── GuessTheNumber.test.js
├── hardhat.config.js
├── package.json
└── README.md
```

**Stato:** 📋 Pianificato

---

### 🐍 Vyper03NFTMarketplaceVyper

**Ispirato a:** `HardhatSolidity12MarketplaceNFT`

**Descrizione:** riscrittura del contratto Marketplace NFT in Vyper. Questo è il caso d'uso più complesso della sezione Vyper perché coinvolge interfacce esterne (ERC721, ERC20, ERC2981) che in Vyper si dichiarano esplicitamente come `interface`. Permette di esplorare le limitazioni di Vyper (nessuna ereditarietà multipla) e come aggirarle.

**Differenze che emergono rispetto alla versione Solidity:**
- Le interfacce ERC721/ERC20/ERC2981 si dichiarano inline nel file `.vy` con `interface IERC721: ...`
- Nessun `Ownable` di OpenZeppelin: `assert msg.sender == self.owner, "Not owner"`
- Nessun `Pausable`: `assert not self.paused, "Contract is paused"`
- `@nonreentrant("buy")` invece di `ReentrancyGuard`
- `extcall` per chiamate a contratti esterni (sintassi Vyper moderna)
- Il contratto `NFTCollection` rimane in Solidity (ERC721URIStorage richiede ereditarietà multipla non disponibile in Vyper) — solo il `Marketplace` viene riscritto in Vyper

**Struttura prevista:**
```
Vyper03NFTMarketplaceVyper/
├── contracts/
│   ├── Marketplace.vy           # contratto principale in Vyper
│   ├── NFTCollection.sol        # mantenuto in Solidity (ERC721 + ERC2981)
│   └── NAO-TOKEN-ERC20.sol      # mantenuto in Solidity (ERC20)
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── Marketplace.test.js
├── hardhat.config.js            # compilazione mista Solidity + Vyper
├── package.json
└── README.md
```

**Stato:** 📋 Pianificato

---

## 📊 Riepilogo Roadmap

| # | Nome | Tecnologia | Ispirato a | Stato |
|---|---|---|---|---|
| 14 | MultiSigWallet | Hardhat + Solidity | — | 🏗️ In sviluppo |
| 15 | ERC4626Vault | Hardhat + Solidity + Chainlink | — | 🏗️ Pianificato |
| Forge01 | VotationsFoundry | **Foundry / Forge** | 06 VotationsV2 | 📋 Pianificato |
| Forge02 | GuessTheNumberFoundry | **Foundry / Forge** | 08 GuessTheNumber | 📋 Pianificato |
| Forge03 | NFTMarketplaceFoundry | **Foundry / Forge** | 12 MarketplaceNFT | 📋 Pianificato |
| Anchor01 | VotationsSolana | **Rust + Anchor (Solana)** | 06 VotationsV2 | ✅ Completato (2026-11-19) |
| Anchor02 | GuessTheNumberSolana | **Rust + Anchor (Solana)** | 08 GuessTheNumber | 📋 Pianificato |
| Anchor03 | NFTSolana | **Rust + Anchor (Solana)** | 12 MarketplaceNFT | 📋 Pianificato |
| Vyper01 | VotationsVyper | **Vyper** | 06 VotationsV2 | 📋 Pianificato |
| Vyper02 | GuessTheNumberVyper | **Vyper** | 08 GuessTheNumber | 📋 Pianificato |
| Vyper03 | NFTMarketplaceVyper | **Vyper** | 12 MarketplaceNFT | 📋 Pianificato |

---

## 🎓 Percorso di apprendimento consigliato

```
Già completati (06-15)
  │
  ├─► Foundry (Forge01, Forge02, Forge03)       ← inizia qui: stessa Solidity, stesso EVM
  │     Prerequisito: conoscenza Solidity + Hardhat
  │     Nuovo: test in Solidity, fuzzing, cheatcodes
  │
  ├─► Vyper (Vyper01, Vyper02, Vyper03)         ← secondo step: stesso EVM, linguaggio diverso
  │     Prerequisito: conoscenza Solidity + Hardhat
  │     Nuovo: sintassi Python-like, limitazioni by design, sicurezza nativa
  │
  └─► Rust + Anchor (Anchor01, Anchor02, Anchor03) ← step finale: ecosistema completamente diverso
        Prerequisito: nozioni base di Rust
        Nuovo: account model, PDA, SPL token, Solana runtime
```

---

*Legenda stati: ✅ Completato · 🏗️ In sviluppo · 📋 Pianificato*
