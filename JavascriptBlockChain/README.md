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
