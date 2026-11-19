#!/usr/bin/env bash
# =============================================================================
# uninstall_all.sh
# Rimuove l'intero stack installato da install_all.sh:
#   1. Anchor CLI e avm
#   2. Solana CLI / Agave
#   3. Rust + Cargo + rustup
#   4. Voci PATH da ~/.bashrc e ~/.profile
#   5. node_modules del progetto (opzionale)
#
# ATTENZIONE: questo script rimuove strumenti di sistema che potrebbero
# essere usati da altri progetti. Leggi ogni fase prima di procedere.
#
# Uso: bash uninstall_all.sh
# =============================================================================

set -u

# ── colori ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

has() { command -v "$1" &>/dev/null; }

# ── conferma interattiva ──────────────────────────────────────────────────────
confirm() {
  local msg="$1"
  echo -e "${YELLOW}[?]${NC} $msg"
  read -r -p "    Continuare? [s/N] " reply
  case "$reply" in
    [sS][iI]|[sS]) return 0 ;;
    *) echo "    Saltato."; return 1 ;;
  esac
}

echo ""
echo "============================================================"
echo "  Anchor01VotationsSolana — Uninstall Script"
echo "============================================================"
echo ""
warn "Questo script rimuoverà: Anchor/avm, Solana CLI, Rust/Cargo/rustup"
warn "e le voci PATH da ~/.bashrc e ~/.profile."
echo ""
read -r -p "Sei sicuro di voler procedere? [s/N] " GLOBAL_CONFIRM
case "$GLOBAL_CONFIRM" in
  [sS][iI]|[sS]) ;;
  *) echo "Operazione annullata."; exit 0 ;;
esac

# =============================================================================
# 1. Anchor CLI e avm
# =============================================================================
echo ""
info "=== FASE 1: Anchor CLI e avm ==="

# 1a. Disinstalla tutte le versioni di Anchor gestite da avm
if has avm; then
  info "Versioni Anchor installate:"
  avm list 2>/dev/null || true
  if confirm "Disinstallare tutte le versioni di Anchor tramite avm?"; then
    # Rimuove ogni versione installata (avm list mostra "* 0.30.1" per la attiva)
    for ver in $(avm list 2>/dev/null | awk '{print $NF}' | tr -d '*'); do
      info "  Rimuovo Anchor $ver..."
      avm uninstall "$ver" 2>/dev/null && success "  Anchor $ver rimosso" || warn "  Anchor $ver non rimovibile (potrebbe essere già rimosso)"
    done
  fi
else
  info "avm non trovato nel PATH — potrebbe essere già rimosso o non installato."
fi

# 1b. Rimuovi il binario avm da Cargo
if has cargo; then
  if confirm "Rimuovere avm con 'cargo uninstall avm'?"; then
    cargo uninstall avm 2>/dev/null && success "avm rimosso" || warn "avm non trovato tra i pacchetti Cargo"
  fi
else
  # Cargo non disponibile — rimuovi i binari manualmente
  for bin in anchor avm; do
    if [ -f "$HOME/.cargo/bin/$bin" ]; then
      rm -f "$HOME/.cargo/bin/$bin"
      success "Rimosso manualmente: ~/.cargo/bin/$bin"
    fi
  done
fi

# =============================================================================
# 2. Solana CLI / Agave
# =============================================================================
echo ""
info "=== FASE 2: Solana CLI / Agave ==="

SOLANA_INSTALL_DIR="$HOME/.local/share/solana"
SOLANA_CONFIG_DIR="$HOME/.config/solana"

if [ -d "$SOLANA_INSTALL_DIR" ]; then
  if confirm "Rimuovere Solana CLI da $SOLANA_INSTALL_DIR?"; then
    rm -rf "$SOLANA_INSTALL_DIR"
    success "Rimossa directory Solana: $SOLANA_INSTALL_DIR"
  fi
else
  info "Directory Solana non trovata ($SOLANA_INSTALL_DIR) — già rimossa o mai installata."
fi

if [ -d "$SOLANA_CONFIG_DIR" ]; then
  echo ""
  warn "ATTENZIONE: La directory $SOLANA_CONFIG_DIR contiene:"
  warn "  - id.json (keypair locale — se ha SOL reali, salva prima la seed phrase!)"
  warn "  - cli/config.yml (configurazione rete)"
  if confirm "Rimuovere la configurazione Solana ($SOLANA_CONFIG_DIR)?"; then
    rm -rf "$SOLANA_CONFIG_DIR"
    success "Rimossa configurazione Solana: $SOLANA_CONFIG_DIR"
  else
    info "Configurazione Solana mantenuta in $SOLANA_CONFIG_DIR"
  fi
fi

# =============================================================================
# 3. Rust + Cargo + rustup
# =============================================================================
echo ""
info "=== FASE 3: Rust + Cargo + rustup ==="

echo ""
warn "ATTENZIONE: questo rimuoverà rustc, cargo, rustup e TUTTE le toolchain"
warn "installate. Tutti gli altri progetti Rust sul sistema ne saranno colpiti."
echo ""

if has rustup; then
  if confirm "Disinstallare Rust + Cargo + rustup con 'rustup self uninstall'?"; then
    # rustup self uninstall chiede conferma interattiva — usiamo --no-modify-path
    # per evitare che tenti di modificare i profili (lo faremo noi sotto)
    rustup self uninstall -y 2>/dev/null && success "Rust + Cargo + rustup rimossi" || {
      warn "rustup self uninstall ha restituito un errore. Rimuovo manualmente..."
      rm -rf "$HOME/.cargo"
      rm -rf "$HOME/.rustup"
      success "Rimossi manualmente ~/.cargo e ~/.rustup"
    }
  fi
elif [ -d "$HOME/.cargo" ] || [ -d "$HOME/.rustup" ]; then
  warn "rustup non trovato nel PATH, ma le directory esistono."
  if confirm "Rimuovere manualmente ~/.cargo e ~/.rustup?"; then
    rm -rf "$HOME/.cargo"
    rm -rf "$HOME/.rustup"
    success "Rimossi ~/.cargo e ~/.rustup"
  fi
else
  info "Rust non trovato — già rimosso o mai installato."
fi

# =============================================================================
# 4. Pulizia delle voci PATH in ~/.bashrc e ~/.profile
# =============================================================================
echo ""
info "=== FASE 4: Pulizia PATH da ~/.bashrc e ~/.profile ==="

SOLANA_BIN="$HOME/.local/share/solana/install/active_release/bin"

clean_profile() {
  local FILE="$1"
  if [ ! -f "$FILE" ]; then return; fi

  local CHANGED=false

  # Rimuovi righe relative a Cargo env
  if grep -qF '.cargo/env' "$FILE" 2>/dev/null; then
    sed -i '/\.cargo\/env/d' "$FILE"
    CHANGED=true
    info "  Rimossa riga Cargo env da $FILE"
  fi

  # Rimuovi righe relative al PATH di Solana
  if grep -qF 'solana' "$FILE" 2>/dev/null; then
    sed -i '/solana/d' "$FILE"
    CHANGED=true
    info "  Rimossa riga Solana PATH da $FILE"
  fi

  # Rimuovi righe relative al PATH di avm/anchor
  if grep -qF 'avm' "$FILE" 2>/dev/null; then
    sed -i '/avm/d' "$FILE"
    CHANGED=true
    info "  Rimossa riga avm PATH da $FILE"
  fi

  if $CHANGED; then
    success "  Pulito: $FILE"
  else
    info "  Nessuna voce da rimuovere in $FILE"
  fi
}

if confirm "Rimuovere le voci PATH di Cargo/Solana/avm da ~/.bashrc e ~/.profile?"; then
  clean_profile "$HOME/.bashrc"
  clean_profile "$HOME/.profile"
  clean_profile "$HOME/.bash_profile"
  clean_profile "$HOME/.zshrc"
fi

# =============================================================================
# 5. Pulizia dipendenze Node.js del progetto (opzionale)
# =============================================================================
echo ""
info "=== FASE 5: Pulizia node_modules (opzionale) ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if confirm "Rimuovere node_modules/ del progetto ($SCRIPT_DIR)?"; then
  rm -rf "$SCRIPT_DIR/node_modules"
  rm -rf "$SCRIPT_DIR/app/node_modules"
  success "node_modules rimossi"
fi

# =============================================================================
# Riepilogo
# =============================================================================
echo ""
echo "============================================================"
echo "  Disinstallazione completata"
echo "============================================================"
echo ""
info "Verifica finale (tutto dovrebbe rispondere 'not found'):"
echo ""

for cmd in rustc cargo rustup solana anchor avm; do
  if has "$cmd"; then
    warn "  $cmd: ancora presente in $(command -v "$cmd")"
  else
    success "  $cmd: non trovato ✓"
  fi
done

echo ""
warn "Riavvia la shell per pulire le variabili d'ambiente residue:"
warn "  exec bash   oppure   source ~/.bashrc"
echo ""
