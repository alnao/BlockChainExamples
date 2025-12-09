# Solidity SmartContract 09 – Staking & Yield Farming DApp

Questo progetto implementa un sistema di Staking dove gli utenti possono bloccare i loro token ERC20 per guadagnare interessi nel tempo.

## 🎯 Obiettivi
- Creare un Token ERC20 da mettere in stake (Staking Token).
- Creare un Token ERC20 di ricompensa (Reward Token).
- Implementare lo Smart Contract di Staking che:
    - Accetta depositi di Staking Token.
    - Calcola le ricompense basate sul tempo di permanenza e sull'APY (Annual Percentage Yield).
    - Permette il prelievo (unstake) e il claim delle ricompense.

## 📚 Concetti Chiave
- Gestione del tempo (`block.timestamp`).
- Matematica finanziaria on-chain.
- Sicurezza contro attacchi di Reentrancy.
- Pattern `Approve` e `TransferFrom`.
