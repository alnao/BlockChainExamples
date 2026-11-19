#!/usr/bin/env bash
# =============================================================================
# install_all.sh
# Installa l'intero stack necessario per Anchor01VotationsSolana:
#   1. Rust + Cargo (via rustup)
#   2. Solana CLI / Agave (via installer ufficiale)
#   3. Anchor CLI (via avm — Anchor Version Manager)
#   4. Dipendenze Node.js del progetto
#
# Testato su: Debian/Ubuntu con bash
# Uso: bash install_all.sh
# =============================================================================

set -e   # interrompi se un comando fallisce
set -u   # errore su variabili non definite

# ── colori ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── versioni target ───────────────────────────────────────────────────────────
SOLANA_VERSION="stable"       # oppure es. "v2.1.0" per una versione fissa
ANCHOR_VERSION="0.30.1"       # versione Anchor testata con questo progetto

# ── helper: controlla se un comando esiste ────────────────────────────────────
has() { command -v "$1" &>/dev/null; }

echo ""
echo "============================================================"
echo "  Anchor01VotationsSolana — Install Script"
echo "============================================================"
echo ""

# =============================================================================
# 1. Rust + Cargo via rustup
# =============================================================================
echo ""
info "=== FASE 1: Rust + Cargo ==="

if has rustc && has cargo; then
  RUST_VER=$(rustc --version)
  success "Rust già installato: $RUST_VER"
  info "Aggiorno alla versione stabile più recente..."
  rustup update stable
else
  info "Installo Rust via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
  # Carica l'ambiente Cargo nella sessione corrente
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env"
  success "Rust installato: $(rustc --version)"
fi

# Aggiungi Cargo al PATH se non già presente nel profilo
CARGO_ENV_LINE='. "$HOME/.cargo/env"'
if ! grep -qF "$CARGO_ENV_LINE" "$HOME/.bashrc" 2>/dev/null; then
  echo "$CARGO_ENV_LINE" >> "$HOME/.bashrc"
  info "Aggiunto Cargo env a ~/.bashrc"
fi
if ! grep -qF "$CARGO_ENV_LINE" "$HOME/.profile" 2>/dev/null; then
  echo "$CARGO_ENV_LINE" >> "$HOME/.profile"
  info "Aggiunto Cargo env a ~/.profile"
fi

# Assicura che Cargo sia nel PATH corrente
if ! has cargo; then
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env"
fi

success "Cargo: $(cargo --version)"

# =============================================================================
# 2. Solana CLI / Agave
# =============================================================================
echo ""
info "=== FASE 2: Solana CLI (Agave) ==="

SOLANA_BIN="$HOME/.local/share/solana/install/active_release/bin"
AGAVE_INSTALLER="$SOLANA_BIN/agave-install"

if [ -f "$AGAVE_INSTALLER" ]; then
  CURRENT_SOL=$("$SOLANA_BIN/solana" --version 2>/dev/null || echo "unknown")
  success "Solana già installata: $CURRENT_SOL"
  info "Aggiorno all'ultima versione $SOLANA_VERSION..."
  "$AGAVE_INSTALLER" init "$SOLANA_VERSION"
else
  info "Installo Solana CLI via installer ufficiale..."
  sh -c "$(curl -sSfL https://release.anza.xyz/${SOLANA_VERSION}/install)"
fi

# Aggiungi Solana al PATH se non già presente
SOLANA_PATH_LINE="export PATH=\"$SOLANA_BIN:\$PATH\""
if ! grep -qF "$SOLANA_BIN" "$HOME/.bashrc" 2>/dev/null; then
  echo "$SOLANA_PATH_LINE" >> "$HOME/.bashrc"
  info "Aggiunto Solana al PATH in ~/.bashrc"
fi
if ! grep -qF "$SOLANA_BIN" "$HOME/.profile" 2>/dev/null; then
  echo "$SOLANA_PATH_LINE" >> "$HOME/.profile"
  info "Aggiunto Solana al PATH in ~/.profile"
fi

# Carica Solana nel PATH della sessione corrente
export PATH="$SOLANA_BIN:$PATH"

success "Solana: $(solana --version)"

# Configura localnet come rete di default
solana config set --url localhost &>/dev/null
info "Rete configurata: localhost (http://127.0.0.1:8899)"

# Genera keypair se non esiste
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  solana-keygen new --no-bip39-passphrase --silent
  success "Keypair generato: $HOME/.config/solana/id.json"
  warn "Attenzione: questo keypair è il wallet admin. Non committarlo su git."
else
  success "Keypair esistente: $(solana address)"
fi

# =============================================================================
# 3. Anchor CLI via avm (Anchor Version Manager)
# =============================================================================
echo ""
info "=== FASE 3: Anchor CLI (via avm) ==="

if has anchor && anchor --version 2>/dev/null | grep -q "$ANCHOR_VERSION"; then
  success "Anchor $ANCHOR_VERSION già installato"
else
  if has avm; then
    info "avm trovato. Installo Anchor $ANCHOR_VERSION..."
  else
    info "Installo avm (Anchor Version Manager)..."
    # avm si compila da sorgente con cargo — richiede 10-20 minuti la prima volta
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    success "avm installato"
  fi

  info "Installo Anchor $ANCHOR_VERSION (compilazione da sorgente, può richiedere 15-20 min)..."
  avm install "$ANCHOR_VERSION"
  avm use "$ANCHOR_VERSION"
  success "Anchor: $(anchor --version)"
fi

# =============================================================================
# 4. Dipendenze Node.js del progetto
# =============================================================================
echo ""
info "=== FASE 4: Dipendenze Node.js ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/package.json" ]; then
  info "Installo dipendenze root (TypeScript, Chai, Mocha, @coral-xyz/anchor)..."
  npm install --prefix "$SCRIPT_DIR"
  success "Dipendenze root installate"
else
  warn "package.json non trovato in $SCRIPT_DIR — salto npm install root"
fi

if [ -f "$SCRIPT_DIR/app/package.json" ]; then
  info "Installo dipendenze frontend (app/)..."
  npm install --prefix "$SCRIPT_DIR/app"
  success "Dipendenze app/ installate"
fi

# =============================================================================
# Riepilogo
# =============================================================================
echo ""
echo "============================================================"
echo "  Installazione completata!"
echo "============================================================"
echo ""
success "rustc  : $(rustc --version)"
success "cargo  : $(cargo --version)"
success "solana : $(solana --version)"
success "anchor : $(anchor --version 2>/dev/null || echo 'riavvia la shell')"
echo ""
warn "IMPORTANTE: riavvia la shell (o esegui 'source ~/.bashrc') per"
warn "            assicurarti che tutti i PATH siano aggiornati."
echo ""
echo "Prossimi passi:"
echo "  1. anchor build                   # compila il program Rust"
echo "  2. solana-test-validator --reset  # avvia il nodo locale (terminale 1)"
echo "  3. anchor test --skip-local-validator  # esegui i test (terminale 2)"
echo "  4. anchor deploy                  # deploya il program"
echo "  5. npm run app:dev                # avvia il frontend"
echo ""
