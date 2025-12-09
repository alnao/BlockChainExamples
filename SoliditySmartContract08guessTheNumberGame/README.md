# Solidity SmartContract08 – GuessTheNumberMulti Game

Un gioco blockchain "indovina il numero" multi-partita dove ogni utente può avviare la propria partita e chiunque può provare a indovinare su tutte le partite attive simultaneamente.

Questo esempio utilizza **hardhat** al posto di **truffle**: Hardhat è un ambiente di sviluppo moderno per smart contract Ethereum che offre un'esperienza di sviluppo completa e flessibile. È diventato lo standard de facto per lo sviluppo di DApps negli ultimi anni. Truffle è uno dei primi e più maturi framework per sviluppo Ethereum, molto popolare fino a qualche anno fa.


Nota: vedere il README generale per il rilascio di questo Smart Contract nella rete Testnet Sepolia e/o esecuzione con Geth su AWS-EC2.


## 🎯 Caratteristiche Principali
- L'amministratore deploya il contratto impostando due fee: `setFee` e `guessFee`
- Il contratto viene deployato con un token ERC20Mock per i pagamenti
- Ogni utente ("setter") può avviare la propria partita scegliendo un **numero di esattamente 20 cifre**
- Il setter paga la `setFee` che costituisce il montepremi iniziale della sua partita. Il setter può aggiornare il proprio numero pagando nuovamente la `setFee`. Il numero viene salvato come hash keccak256 (non visibile in chiaro). Ogni aggiornamento aumenta il montepremi della partita
- Chiunque può provare a indovinare su **tutte le partite attive** tramite `guessAny`
	- **Se indovina**: vince il montepremi + la propria guessFee della partita indovinata (che termina)
	- **Se sbaglia**: la guessFee viene divisa: 50% distribuito tra tutti i montepremi attivi (in parti uguali) e 50% va al bilancio dell'amministratore
- L'amministratore può prelevare il proprio bilancio accumulato e l'amministratore può aggiornare le fee del gioco


## 🛠️ Struttura del Progetto
```
SoliditySmartContract08guessTheNumberGame/
├── contracts/
│   ├── GuessTheNumber.sol         # Contratto principale del gioco
│   └── NAO-TOKEN-ERC20.sol        # Token per i pagamenti
├── scripts/
│   ├── deploy.js                  # Script di deployment
│   ├── interact.js                # CLI interattiva completa
│   └── addresses.js               # Gestione indirizzi deployed
├── test/
│   └── GuessTheNumber.test.js     # Test completi
├── create_ec2_node.sh			   # Creazione di una EC2 per eseguire il contratto con geth
├── destroy_ec2_node.sh			   # Distruzione della EC2
├── hardhat.config.js              # Configurazione Hardhat
├── package.json                   # Dipendenze del progetto
└── README.md                      # Questa documentazione
```

## 🚀 Setup e Installazione

- Prerequisiti
	- Node.js v16+ (LTS consigliato)
  	- npm o yarn
- Installazione Dipendenze
	```bash
	npm install --legacy-peer-deps
	```
- Creazione del file `.env` con le configurazioni
	```bash
	PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
	SECOND_PRIVATE_KEY=0xYOUR_SECOND_PRIVATE_KEY_HERE
	INFURA_PROJECT_ID=YOUR_INFURA_PROJECT_ID_HERE
	EC2_URL=http://1.2.3.4:8545
	```
- Compilazione Contratti
	```bash
	npx hardhat compile
	```
- Esecuzione Test
	```bash
	npm test
	```

## 📊 Deploy e Utilizzo

1. Avvia la Rete Locale
	```bash
	npx hardhat node
	```
	Questo comando avvia una blockchain locale su `http://127.0.0.1:8545` con 20 account di test precaricati.
2. Deploy dei Contratti
	```bash
	npx hardhat run scripts/deploy.js --network localhost
	```

	Output di esempio:
	```
	Deploying contracts with the account: 0xAAAAAAAAAAAA
	MockToken deployed to: 0xBBBBBBBBB
	GuessTheNumberMulti deployed to: 0xCCCCCCCCCCC

	Deployment completed!
	Token address: 0xDDDDDDDDD
	Game address: 0xEEEEEEEEE
	```
3. Interazione con i Contratti
	```bash
	npx hardhat run scripts/interact.js --network localhost
	```
4. Lo script `interact.js` fornisce un'interfaccia completa per:
	- **🎮 Avviare partita**: Crea una nuova partita con numero segreto
	- **🔄 Aggiornare numero**: Modifica il numero della tua partita attiva
	- **🎯 Indovinare**: Prova a indovinare su tutte le partite attive
	- **🏦 Admin preleva**: Prelievo fondi amministratore
	- **📊 Stato contratto**: Visualizza informazioni complete
	- **🪙 Gestione token**: Balance, allowance, approvazioni
	- **🎁 Trasferimenti**: Sposta token tra account
	- **🔄 Cambiare account**: Passa tra i diversi account disponibili
5. Note:
	- In Ethereum (standard ERC20), uno smart contract (come il gioco) non può prelevare token dal tuo portafoglio senza il tuo esplicito permesso. La funzione 6 dello script di interazione serve a chiamare approve sul contratto del Token, autorizzando il contratto del Gioco a spendere i tuoi NAO (per pagare le fee di avvio partita o di guess). È una misura di sicurezza fondamentale: senza approve, la transazione transferFrom nel gioco fallirebbe.

## 🧪 Test

Il progetto include test completi che verificano:
- Creazione e gestione di partite multiple
- Meccanismo di indovinare con premi e distribuzioni
- Gestione delle fee e del bilancio admin
- Rate limiting per i tentativi
- Sicurezza e controlli di accesso

Esegui i test con:
```bash
npm test
```

Output di esempio:
```
  GuessTheNumberMulti (NAO token)
    ✔ più utenti possono avviare partite e aggiornarle
    ✔ guessAny indovina la partita giusta e paga il premio in NAO
    ✔ guessAny sbagliato divide la fee NAO tra tutti i prizePool attivi e admin
    ✔ admin può prelevare il saldo NAO
  4 passing (768ms)
```

## ⚙️ Configurazione base di partenza

- Fee Predefinite
	- **setFee**: 10 token TEST (per avviare/aggiornare partita)
	- **guessFee**: 1 token TEST (per tentativo di indovinare)
- Rate Limiting
	- Massimo 4 tentativi `guessAny` ogni 7 ore per indirizzo
	- Finestra temporale si resetta automaticamente
- Validazione Numeri
	- I numeri devono essere di esattamente **20 cifre**
	- Devono essere >= 10^19 (non possono iniziare con 0)
	- Esempi validi: `12345678901234567890`, `99999999999999999999`
	- Esempi non validi: `01234567890123456789`, `123456789`

## 🔒 Sicurezza

- **ReentrancyGuard**: Protezione contro attacchi di rientranza
- **Hash Storage**: I numeri sono salvati come hash keccak256
- **Access Control**: Funzioni admin protette
- **Rate Limiting**: Prevenzione spam di tentativi
- **Input Validation**: Controlli rigorosi sui parametri


### ⚠️ Avvertenze Importanti
- **Solo a scopo didattico**: Non utilizzare per giochi con premi reali
- **Privacy limitata**: Gli hash possono essere vulnerabili a attacchi brute-force
- **Fairness non garantita**: L'amministratore ha privilegi speciali
- **Testnet only**: Testare solo su reti di sviluppo


## 🔗 Collegamenti Utili

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)




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
