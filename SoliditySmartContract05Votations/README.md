
# SimpleVoting - Smart Contract per Votazioni

Questo progetto implementa un sistema di votazione decentralizzato su blockchain Ethereum utilizzando Solidity. 

Il contratto permette di creare e gestire votazioni, registrare elettori, aggiungere proposte e conteggiare i voti in modo trasparente e sicuro.
- Registrazione degli elettori da parte di un presidente
- Aggiunta di proposte di voto
- Sistema di votazione con tracciamento trasparente
- Possibilità di delegare il proprio voto
- Gestione delle tempistiche di votazione
- Esecuzione automatica della proposta vincente
- Monitoraggio completo dello stato delle votazioni
> ⚠️ **Attenzione**: Il deploy sulla mainnet comporta costi reali in ETH. Assicurati di aver testato approfonditamente il contratto prima di procedere.


## Funzionalità tecniche

### Ruoli
- **Presidente**: Unico account che può registrare elettori e aggiungere proposte
- **Elettori**: Account registrati che possono votare o delegare il loro voto

### Tempistiche
- La votazione ha una durata predefinita in ore
- Il presidente può concludere le votazioni anticipatamente

### Sistema di voto
- Ogni elettore ha un peso iniziale di 1
- Gli elettori possono delegare il loro peso ad altri elettori
- Una proposta è vincente se ha il maggior numero di voti

## Sicurezza

Il contratto include vari controlli di sicurezza:
- Controlli sulla proprietà delle funzioni
- Verifiche dei requisiti prima dell'esecuzione
- Controlli temporali
- Protezione contro il double-voting


## Prerequisiti

- Node.js (v14+)
- Truffle Framework
- Ganache o un'altra blockchain Ethereum locale per lo sviluppo
- Metamask o un altro wallet Ethereum per interagire con la blockchain


## Creazione progetto
Creati i files: 
- `README.md`
- `package.json` : copiato dall'esempio 05
- `truffle-config.js` : copiato dall'esempio 05
- `contracts/votations.sol` : preso sol da claude
- `migrations/2_deploy_simple_voting.js` : preso da Claude.ia
- `scripts/*` : copiati files

## Comandi di compilazione e script di test
Eseguiti in sequenza i comandi:
- `npm install `
- `npm install @openzeppelin/test-helpers @truffle/hdwallet-provider dotenv`
- run **Ganache-* with `truffle-config.js`
- `npm test `
- `npm run migrate `
- on **Ganache** check if smart contract is deployed
- `npm run elettori`
- `npm run registra-elettori 0x6Exxxx`
- `npm run registra-elettori 0x5fxxxx`
- `npm run registra-elettori 0x10xxxx`
- `npm run elettori`
- `npm run stato`
- `npm run aggiungi-proposte "proposta 1" "proposta 2"`
- `npm run vota 0 0x6Exxxx`
- `npm run vota 0 0x5fxxxx`
- `npm run vota 1 0x5fxxxx`
- `npm run stato`

### Cambiare il Presidente nel Contratto SimpleVoting
Come aggiungere e utilizzare la funzionalità di cambio presidente nel contratto SimpleVoting.
- **Autorizzazione**: Solo il presidente attuale può nominare un nuovo presidente
- **Irreversibilità**: Una volta effettuato il cambio, l'account originale non avrà più accesso alle funzionalità riservate al presidente
- **Sicurezza**: Assicurati di utilizzare un indirizzo valido di cui hai il controllo
- **Gas**: L'operazione richiede gas, quindi assicurati di avere ETH sul tuo account
- `npm run cambia-presidente 0xF715954AEa4bC859230F7806524311Da3cbcBE61`

## Front-end
Sono presenti due app frontend **admin-app** dedicata al presidente e **vote-app** dedicata agli aventi diritto al voto.
Comandi per la creazione
```
npm uninstall -g create-react-app
npm install -g create-react-app@latest
npx create-react-app admin-app
cd admin-app
npm install web3
cd ..
npx create-react-app voter-app
cd voter-app
npm install web3
cd ..
mkdir admin-app/src/contracts
mkdir voter-app/src/contracts
cp ./client/src/contracts/SimpleVoting.json ./admin-app/src/contracts/SimpleVoting.json
cp ./client/src/contracts/SimpleVoting.json ./voter-app/src/contracts/SimpleVoting.json
cd admin-app
npm start
cd vote-app
npm start
```

## Licenza

Questo progetto è distribuito sotto la licenza MIT. Vedi il file `LICENSE` per ulteriori informazioni.