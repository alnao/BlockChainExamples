# NFT (ERC-721)
Esempio misto creato con l'aiuto di Claude.ia
- Implementa lo standard per token non fungibili
- Permette di creare asset digitali unici con proprietà verificabili
- Include funzionalità per coniare, trasferire e approvare token
- Ogni token ha un ID unico e può avere metadati personalizzati (tokenURI)


## Creazione progetto
- Creata cartella `SoliditySmartContract04NFT` e sottocartelle `client`, `contracts`, `migrations`, `test`.
- Creato file `truffle-config.js` copiato da un altro progetto (FundraiserFactory).
- Creato file `package.json` copiato da un altro progetto  (FundraiserFactory).
    - Lanciato comando `npm install` per i pacchetti necessari.
    - Per i test eseguito `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`  (dotenv serve se presente un .env per le reti pubbliche)
- Creati files presi da altri esempi e creati da Claude: 
    - `contracts/nft.sol`: contratto
	- `test/nft_test.js`: Il file SimpleNFT.test.js contiene test completi che verificano tutte le funzionalità del contratto NFT:
        - Test di base: verifica del nome e simbolo
        - Test di minting: creazione di nuovi token e gestione dei casi d'errore
        - Test di trasferimento: verifica che i trasferimenti funzionino correttamente e che solo i proprietari o gli utenti approvati possano trasferire
        - Test di approvazione: verifica che le approvazioni (individuali e per tutti i token) funzionino correttamente
        - Test di query: verifica che le funzioni di consultazione come balanceOf e tokenURI funzionino correttamente
        I test utilizzano la libreria @openzeppelin/test-helpers per semplificare la verifica degli eventi e la gestione degli errori.
	- `migrations/2_deploy_nft.js` Il file di migrazione gestisce la distribuzione del contratto sulla blockchain con un nome e un simbolo predefiniti. Questo file sarà usato da Truffle per deployare il contratto quando esegui `truffle migrate`.
- Unit-Test
    - `truffle compile`
    - `truffle deploy`: avviato ganache e verificato che il contratto sia rilasciato correttamente
    - `truffle migrate --network development --reset`
    - `truffle test`: funziona correttamente
- Script di utilità nella cartella client:
    - `mint-nft.js`: per coniare nuovi NFT
    - `transfer-nft.js`: per trasferire NFT esistenti
    - `list-nfts.js`: per elencare tutti gli NFT posseduti da un indirizzo
- Esecuzione script di utilità, se si eseguotno con ganache in localhost bisogna usare gli indirizzi/account indicati dentro ganache altrimenti le transazioni non vengono autorizzate
    - `truffle exec client/mint-nft.js [indirizzo destinatario]`
        ```
        Utilizzando l'account: 0x64473f5b8D5e54ac6a7301b0407B9034C7cC47c0
        Contratto NFT trovato all'indirizzo: 0xe3e3f8F55142C8eA905d38839400a3DBd839208E
        Coniando un nuovo NFT per 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA con URI: https://example.com/metadata/new-token
        NFT coniato con successo! Token ID: 0
        Transazione: 0x897e7117692415fb5051edb4ec4ded396b1efa1dcd79ac0449e583aa348b615f
        ```
    - `truffle exec client/transfer-nft.js <tokenId> <indirizzo destinatario>`
        ```
        Using network 'development'.

        Trasferimento del Token ID 2 da 0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA a 0xBBBBBBBBBBBBBBBBBBBB
        NFT trasferito con successo!
        Transazione: 0x6d5b23494f6a20f4bbce92f01feeeee2d126736ddb248d0de84d87cccfdb8c3d
        ```
    - `truffle exec client/list-nfts.js [indirizzo]`
        ```
        Using network 'development'.

        Elencando gli NFT per l'indirizzo: 0xBBBBBBBBBBBBBBBBBBBB
        Trovati 1 NFT per questo indirizzo

        Dettagli NFT:
        - Token ID: 0, URI: https://example.com/metadata/new-token
        ```



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
