# Python Blockchain

Implementazione didattica di una blockchain in Python con Proof of Work, REST API (Flask) e supporto multi-nodo.

## 📁 Struttura

| File | Descrizione |
|------|-------------|
| `blockchain.py` | Blockchain multi-nodo completa con PoW, transazioni, mining e sincronizzazione tra nodi |
| `blockchainUnSoloNodo.py` | Versione semplificata mono-nodo |
| `test_blockchain.py` | Test unitari per la classe Blockchain |
| `requirements.txt` | Dipendenze Python |

## 🚀 Guida rapida

```bash
# Installare le dipendenze
pip install -r requirements.txt

# Avviare il nodo (porta 5000)
python3 blockchain.py 5000

# Avviare un secondo nodo (porta 5001) per testare il multi-nodo
python3 blockchain.py 5001
```

## 📡 API REST

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/blockchain` | GET | Restituisce l'intera blockchain |
| `/mine` | GET | Esegue il mining di un nuovo blocco |
| `/transactions/new` | POST | Aggiunge una nuova transazione |
| `/nodes/add_nodes` | POST | Registra nodi peer |
| `/nodes/sync` | GET | Sincronizza la catena con i nodi registrati |

### Esempi

```bash
# Visualizzare la blockchain
curl http://localhost:5000/blockchain

# Minare un nuovo blocco
curl http://localhost:5000/mine

# Inviare una transazione
curl -X POST -H "Content-Type: application/json" \
  -d '{"sender": "Alice", "recipient": "Bob", "amount": 5}' \
  "http://localhost:5000/transactions/new"

# Registrare un nodo peer
curl -X POST -H "Content-Type: application/json" \
  -d '{"nodes": ["http://localhost:5001"]}' \
  "http://localhost:5000/nodes/add_nodes"

# Sincronizzare con la catena più lunga
curl http://localhost:5000/nodes/sync
```

## 🧪 Test

```bash
# Eseguire i test unitari
python3 -m unittest test_blockchain -v

# oppure con pytest
python3 -m pytest test_blockchain.py -v
```

## 📚 Concetti implementati
- **Proof of Work (PoW)**: algoritmo di consenso con target di difficoltà `"0000"`.
- **Hashing SHA-256**: ogni blocco è identificato dal suo hash.
- **Catena immutabile**: ogni blocco contiene l'hash del blocco precedente.
- **Validazione della catena**: verifica dell'integrità tramite hash e nonce.
- **Consenso multi-nodo**: sincronizzazione con la catena più lunga tra i nodi registrati.


## Changelog

| Data | Descrizione |
|------|-------------|
| 2022-10-09 | Prima versione blockchain Python con Flask |
| 2024-06-14 | Cartella rinominata da SolidityExample1Flask, README aggiunto |
| 2025-09-08 | Aggiornamento licenza nel README |
| 2026-09-11 | Aggiunti test unitari e requirements, README riscritto |


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
