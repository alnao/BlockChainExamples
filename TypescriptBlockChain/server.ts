// server.ts
import express from 'express';
import bodyParser from 'body-parser';
import { Blockchain, Transaction } from './blockchain';
import Wallet from './wallet';

// Inizializza l'app Express
const app = express();
app.use(bodyParser.json());

// Inizializza la blockchain
const myCoin = new Blockchain();

// Crea il wallet per il sistema
const systemWallet = new Wallet();

// Salva il wallet per riferimento futuro
systemWallet.saveKeys('system');

console.log(`Indirizzo del sistema: ${systemWallet.getAddress()}`);

// Endpoint per ottenere l'intera blockchain
app.get('/blockchain', (req, res) => {
    res.json(myCoin);
});

// Endpoint per creare una nuova transazione
app.post('/transaction', (req, res) => {
    const { fromAddress, toAddress, amount, privateKey } = req.body;

    try {
        // Verifica che tutti i parametri necessari siano presenti
        if (!fromAddress || !toAddress || !amount || !privateKey) {
            return res.status(400).json({ error: 'Parametri mancanti', 
                missing: {
                    fromAddress: !fromAddress,
                    toAddress: !toAddress,
                    amount: !amount,
                    privateKey: !privateKey
                }
            });
        }

        console.log(`Tentativo di transazione: da ${fromAddress.substring(0, 20)}... a ${toAddress.substring(0, 20)}... per ${amount}`);
        
        // Crea un wallet temporaneo per l'utente
        const userWallet = new Wallet();
        userWallet.privateKey = privateKey;
        userWallet.publicKey = fromAddress;

        // Crea la transazione
        const transaction = userWallet.createTransaction(toAddress, amount);
        console.log(`Transazione creata con firma: ${transaction.signature ? transaction.signature.substring(0, 20) + '...' : 'nessuna firma'}`);

        // Prima di aggiungere la transazione, verifica il saldo
        const senderBalance = myCoin.getBalanceOfAddress(fromAddress);
        console.log(`Saldo del mittente prima della transazione: ${senderBalance}`);

        // Aggiungi la transazione alla blockchain
        const result = myCoin.addTransaction(transaction);

        res.json({ 
            message: 'Transazione aggiunta con successo',
            transaction,
            success: result
        });
    } catch (error) {
        console.error("Errore durante la transazione:", error);
        res.status(400).json({ 
            error: error instanceof Error ? error.message : 'Errore sconosciuto',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

// Endpoint per minare i blocchi pendenti
app.post('/mine', (req, res) => {
    const { minerAddress } = req.body;

    if (!minerAddress) {
        return res.status(400).json({ error: 'Indirizzo del miner mancante' });
    }

    // Anche se non ci sono transazioni, permettiamo comunque di minare
    // per ricevere la ricompensa (specialmente per il primo blocco)
    
    // Mina il blocco
    myCoin.minePendingTransactions(minerAddress);

    res.json({
        message: 'Mining completato con successo!',
        block: myCoin.getLatestBlock()
    });
});

// Endpoint per controllare il saldo di un indirizzo
app.get('/balance/:address', (req, res) => {
    const { address } = req.params;
    
    // Mostriamo il calcolo dettagliato del saldo
    let totalReceived = 0;
    let totalSent = 0;
    
    // Esamina tutti i blocchi della catena
    for (const block of myCoin.chain) {
        for (const transaction of block.transactions) {
            // Se sei il mittente, sottrai dal saldo
            if (transaction.fromAddress === address) {
                totalSent += transaction.amount;
            }

            // Se sei il destinatario, aggiungi al saldo
            if (transaction.toAddress === address) {
                totalReceived += transaction.amount;
            }
        }
    }
    
    const balance = totalReceived - totalSent;
    
    res.json({
        address,
        balance,
        details: {
            totalReceived,
            totalSent,
            transactions: myCoin.chain.reduce((count, block) => {
                return count + block.transactions.filter(
                    tx => tx.fromAddress === address || tx.toAddress === address
                ).length;
            }, 0)
        },
        chainLength: myCoin.chain.length
    });
});

// Endpoint per creare un nuovo wallet
app.post('/wallet', (req, res) => {
    const wallet = new Wallet();
    const walletId = Date.now().toString();
    wallet.saveKeys(walletId);

    res.json({
        walletId,
        address: wallet.getAddress(),
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey // In un ambiente reale, non invieresti mai la chiave privata!
    });
});

// Endpoint per verificare la validità della blockchain
app.get('/validate', (req, res) => {
    const isValid = myCoin.isChainValid();
    
    res.json({
        valid: isValid,
        message: isValid ? 'La blockchain è valida' : 'La blockchain non è valida'
    });
});

// Endpoint per faucet - distribuisce monete per test (senza validazione)
app.post('/faucet', (req, res) => {
    const { toAddress, amount = 100 } = req.body;
    
    if (!toAddress) {
        return res.status(400).json({ error: 'Indirizzo del destinatario mancante' });
    }
    
    // Crea una transazione dal sistema (come il mining reward)
    const faucetTransaction: Transaction = {
        fromAddress: null, // Dal sistema
        toAddress,
        amount: Number(amount),
        timestamp: Date.now()
    };
    
    // Aggiungi la transazione alla lista in attesa
    myCoin.pendingTransactions.push(faucetTransaction);
    
    // Mina immediatamente il blocco per confermare la transazione
    myCoin.minePendingTransactions(toAddress); // Il destinatario ottiene anche la mining reward
    
    res.json({
        message: `Inviati ${amount} coins all'indirizzo ${toAddress} tramite faucet`,
        transaction: faucetTransaction,
        balance: myCoin.getBalanceOfAddress(toAddress)
    });
});

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});

// Endpoint per debug - mostra l'intera blockchain con transazioni
app.get('/debug', (req, res) => {
    // Ottieni un riepilogo della blockchain
    const chainSummary = myCoin.chain.map(block => {
        return {
            index: block.index,
            timestamp: block.timestamp,
            hash: block.hash.substring(0, 10) + '...',
            previousHash: block.previousHash.substring(0, 10) + '...',
            transactions: block.transactions.map(tx => {
                return {
                    from: tx.fromAddress ? tx.fromAddress.substring(0, 15) + '...' : 'SYSTEM',
                    to: tx.toAddress.substring(0, 15) + '...',
                    amount: tx.amount,
                    hasSig: !!tx.signature
                }
            })
        };
    });

    // Ottieni le transazioni in attesa
    const pendingTransactions = myCoin.pendingTransactions.map(tx => {
        return {
            from: tx.fromAddress ? tx.fromAddress.substring(0, 15) + '...' : 'SYSTEM',
            to: tx.toAddress.substring(0, 15) + '...',
            amount: tx.amount,
            hasSig: !!tx.signature
        }
    });

    res.json({
        chainLength: myCoin.chain.length,
        difficulty: myCoin.difficulty,
        miningReward: myCoin.miningReward,
        isValid: myCoin.isChainValid(),
        pendingTransactionsCount: myCoin.pendingTransactions.length,
        chainSummary,
        pendingTransactions
    });
});


/*
// server.ts
import express from 'express';
import bodyParser from 'body-parser';
import { Blockchain, Transaction } from './blockchain';
import Wallet from './wallet';

// Inizializza l'app Express
const app = express();
app.use(bodyParser.json());

// Inizializza la blockchain
const myCoin = new Blockchain();

// Crea il wallet per il sistema
const systemWallet = new Wallet();

// Salva il wallet per riferimento futuro
systemWallet.saveKeys('system');

console.log(`Indirizzo del sistema: ${systemWallet.getAddress()}`);

// Endpoint per ottenere l'intera blockchain
app.get('/blockchain', (req, res) => {
    res.json(myCoin);
});

// Endpoint per creare una nuova transazione
app.post('/transaction', (req, res) => {
    const { fromAddress, toAddress, amount, privateKey } = req.body;

    try {
        // Verifica che tutti i parametri necessari siano presenti
        if (!fromAddress || !toAddress || !amount || !privateKey) {
            return res.status(400).json({ error: 'Parametri mancanti' });
        }

        // Crea un wallet temporaneo per l'utente
        const userWallet = new Wallet();
        userWallet.privateKey = privateKey;
        userWallet.publicKey = fromAddress;

        // Crea la transazione
        const transaction = userWallet.createTransaction(toAddress, amount);

        // Aggiungi la transazione alla blockchain
        myCoin.addTransaction(transaction);

        res.json({ 
            message: 'Transazione aggiunta con successo',
            transaction
        });
    } catch (error) {
        res.status(400).json({ 
            error: error instanceof Error ? error.message : 'Errore sconosciuto' 
        });
    }
});

// Endpoint per minare i blocchi pendenti
app.post('/mine', (req, res) => {
    const { minerAddress } = req.body;

    if (!minerAddress) {
        return res.status(400).json({ error: 'Indirizzo del miner mancante' });
    }

    // Verifica se ci sono transazioni in attesa
    if (myCoin.pendingTransactions.length === 0) {
        return res.status(400).json({ error: 'Non ci sono transazioni in attesa da minare' });
    }

    // Mina il blocco
    myCoin.minePendingTransactions(minerAddress);

    res.json({
        message: 'Mining completato con successo!',
        block: myCoin.getLatestBlock()
    });
});

// Endpoint per controllare il saldo di un indirizzo
app.get('/balance/:address', (req, res) => {
    const { address } = req.params;
    const balance = myCoin.getBalanceOfAddress(address);

    res.json({
        address,
        balance
    });
});

// Endpoint per creare un nuovo wallet
app.post('/wallet', (req, res) => {
    const wallet = new Wallet();
    const walletId = Date.now().toString();
    wallet.saveKeys(walletId);

    res.json({
        walletId,
        address: wallet.getAddress(),
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey // In un ambiente reale, non invieresti mai la chiave privata!
    });
});

// Endpoint per verificare la validità della blockchain
app.get('/validate', (req, res) => {
    const isValid = myCoin.isChainValid();
    
    res.json({
        valid: isValid,
        message: isValid ? 'La blockchain è valida' : 'La blockchain non è valida'
    });
});

// Avvia il server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});
*/