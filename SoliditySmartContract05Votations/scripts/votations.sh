#!/bin/bash
# esempio-script.sh - Esempio di utilizzo degli script per il sistema di votazione

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sistema di Votazione - Esempio di flusso completo ===${NC}\n"

# 1. Registrazione elettori
echo -e "${YELLOW}Registrazione di 3 elettori...${NC}"
npx truffle exec scripts/registra-elettori.js
echo -e "${GREEN}Elettori registrati con successo!${NC}\n"

# 2. Aggiunta proposte
echo -e "${YELLOW}Aggiunta di 3 proposte...${NC}"
npx truffle exec scripts/aggiungi-proposte.js "Costruire un nuovo ponte" "Riqualificare il parco comunale" "Aumentare fondi per scuole"
echo -e "${GREEN}Proposte aggiunte con successo!${NC}\n"

# 3. Visualizza stato iniziale
echo -e "${YELLOW}Stato iniziale delle votazioni...${NC}"
npx truffle exec scripts/stato-votazioni.js
echo -e "\n"

# 4. Primo elettore delega al secondo
echo -e "${YELLOW}L'elettore 1 delega il suo voto all'elettore 2...${NC}"
npx truffle exec scripts/delega-voto.js 0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e 1
echo -e "${GREEN}Delega completata con successo!${NC}\n"

# 5. Elettore 2 vota per la proposta 0
echo -e "${YELLOW}L'elettore 2 vota per la proposta 0...${NC}"
npx truffle exec scripts/vota.js 0 2
echo -e "${GREEN}Voto registrato con successo!${NC}\n"

# 6. Elettore 3 vota per la proposta 1
echo -e "${YELLOW}L'elettore 3 vota per la proposta 1...${NC}"
npx truffle exec scripts/vota.js 1 3
echo -e "${GREEN}Voto registrato con successo!${NC}\n"

# 7. Visualizza stato dopo votazione
echo -e "${YELLOW}Stato dopo la votazione...${NC}"
npx truffle exec scripts/stato-votazioni.js
echo -e "\n"

# 8. Chiudi votazioni
echo -e "${YELLOW}Conclusione anticipata delle votazioni...${NC}"
npx truffle exec scripts/concludi-votazioni.js
echo -e "${GREEN}Votazioni concluse con successo!${NC}\n"

# 9. Esegui proposta vincente
echo -e "${YELLOW}Esecuzione della proposta vincente (proposta 0)...${NC}"
npx truffle exec scripts/esegui-proposta.js 0
echo -e "${GREEN}Proposta eseguita con successo!${NC}\n"

# 10. Visualizza stato finale
echo -e "${YELLOW}Stato finale delle votazioni...${NC}"
npx truffle exec scripts/stato-votazioni.js
echo -e "\n"

echo -e "${BLUE}=== Esempio completato con successo! ===${NC}"