# Javascript simple BlockChain

Semplice progettino BlockChain in typescript che usa l'algoritmo "proof of work" per validare i blocchi.
- Implementazione del meccanismo Proof of Work
- Generazione di wallet con crittografia RSA
- Transazioni firmate
- API RESTful per interagire con la blockchain
- Mining e ricompense


Utilizza la libreria standard npm `crypto`.

Progetto creato con **claude** usando il prompt:
```
voglio creare una blockchain in javascript/typescript/node usando l'algoritmo "proof of work", creami anche una interfaccia per far transitare moneta e crearla
```
poi successivamente usati altri prompt per migliorare alcuni aspetti (come la gestione degli errori).


- Installazione con i comandi `npm install`
- Compilazione con il comando `npm run build`
- Avvio server locale con il comando `npm start`


# API Endpoints
Vedi file `postman_collection.json` importabile su PostMan:

- Ottieni l'intera blockchain
  ```
  GET /blockchain
  ```
- Crea un nuovo wallet
  ```
  POST /wallet
  ```
  Risposta:
  ```json
  {
    "walletId": "1682345678900",
    "address": "abcdef1234567890...",
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
  }
  ```
- Controlla il saldo di un indirizzo
  ```
  GET /balance/:address
  ```
  Risposta:
  ```json
  {
    "address": "abcdef1234567890...",
    "balance": 100
  }
  ```
- Crea una nuova transazione
  ```
  POST /transaction
  ```
  Body:
  ```json
  {
    "fromAddress": "-----BEGIN PUBLIC KEY-----\n...",
    "toAddress": "-----BEGIN PUBLIC KEY-----\n...",
    "amount": 50,
    "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
  }
  ```
- Mina le transazioni in attesa
  ```
  POST /mine
  ```
  Body:
  ```json
  {
    "minerAddress": "abcdef1234567890..."
  }
  ```
- Verifica la validità della blockchain
  ```
  GET /validate
  ```
  Risposta:
  ```json
  {
    "valid": true,
    "message": "La blockchain è valida"
  }
  ```


## Note sulla sicurezza

Questo progetto è solo a scopo dimostrativo. In un ambiente di produzione:

- Non inviare mai le chiavi private attraverso la rete
- Implementa autenticazione e autorizzazione
- Usa HTTPS
- Aggiungi validazione degli input più rigorosa
- Implementa una gestione più robusta degli errori


# AlNao.it
Nessun contenuto in questo repository è stato creato con IA o automaticamente, tutto il codice è stato scritto con molta pazienza da Alberto Nao. Se il codice è stato preso da altri siti/progetti è sempre indicata la fonte. Per maggior informazioni visitare il sito [alnao.it](https://www.alnao.it/).

## License
Public projects 
<a href="https://it.wikipedia.org/wiki/GNU_General_Public_License"  valign="middle"><img src="https://img.shields.io/badge/License-GNU-blue" style="height:22px;"  valign="middle"></a> 
*Free Software!*