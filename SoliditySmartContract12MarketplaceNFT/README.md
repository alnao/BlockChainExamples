# Solidity SmartContract 12 – NFT Marketplace con Royalties

Questo progetto implementa un Marketplace per NFT dove gli utenti possono comprare, vendere e mettere all'asta i propri collezionabili digitali, supportando lo standard per le royalties.

## 🎯 Obiettivi
- Creare una collezione NFT (ERC721).
- Implementare lo standard ERC2981 per le royalties on-chain.
- Creare il contratto Marketplace che permette:
    - Listing a prezzo fisso.
    - Aste con scadenza temporale.
    - Gestione sicura dei fondi (Escrow).
    - Distribuzione automatica delle royalties al creatore dopo ogni vendita.

## 📚 Concetti Chiave
- Standard ERC721 e ERC2981.
- Pattern Marketplace (Listing, Buying, Canceling).
- Gestione delle aste e delle offerte.
- Pull payments vs Push payments.
