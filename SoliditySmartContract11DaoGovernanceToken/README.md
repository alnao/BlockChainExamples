# Solidity SmartContract 11 – DAO & Governance Token

Questo progetto implementa una Organizzazione Autonoma Decentralizzata (DAO) completa, dove i possessori di token possono votare proposte per gestire una tesoreria comune.

## 🎯 Obiettivi
- Creare un Governance Token (ERC20Votes) che supporta la delega e gli snapshot dei voti.
- Implementare un contratto Governor per gestire il ciclo di vita delle proposte (Proposta -> Voto -> Esecuzione).
- Implementare un Timelock Controller per introdurre un ritardo di sicurezza prima dell'esecuzione.
- Eseguire un'azione on-chain (es. trasferimento fondi) solo dopo il successo di una votazione.

## 📚 Concetti Chiave
- Standard ERC20Votes e ERC20Permit.
- Governance On-Chain (OpenZeppelin Governor).
- Timelock e sicurezza delle esecuzioni.
- Delegazione del potere di voto.
