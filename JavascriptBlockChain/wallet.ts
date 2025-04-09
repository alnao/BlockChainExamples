
// wallet.ts
import * as crypto from 'crypto';
import { Transaction } from './blockchain';
import KeyGenerator from './keygenerator';

class Wallet {
    public publicKey: string;
    public privateKey: string;
    private keyGenerator: KeyGenerator;

    constructor() {
        this.keyGenerator = new KeyGenerator();
        // Genera chiavi di default
        const keys = this.keyGenerator.generateKeyPair();
        this.publicKey = keys.publicKey;
        this.privateKey = keys.privateKey;
    }

    // Genera nuove chiavi
    generateNewKeys(): void {
        const keys = this.keyGenerator.generateKeyPair();
        this.publicKey = keys.publicKey;
        this.privateKey = keys.privateKey;
    }

    // Salva le chiavi in file
    saveKeys(filename: string): void {
        this.keyGenerator.saveKeysToFile(this.publicKey, this.privateKey, filename);
    }

    // Carica le chiavi da file
    loadKeys(filename: string): void {
        this.publicKey = this.keyGenerator.loadPublicKey(filename);
        this.privateKey = this.keyGenerator.loadPrivateKey(filename);
    }

    // Crea una transazione firmata
    createTransaction(toAddress: string, amount: number): Transaction {
        const transaction: Transaction = {
            fromAddress: this.publicKey,
            toAddress,
            amount,
            timestamp: Date.now()
        };

        console.log("Creazione transazione: ", {
            from: this.publicKey.substring(0, 20) + "...",
            to: toAddress.substring(0, 20) + "...",
            amount
        });

        // Firma la transazione
        try {
            transaction.signature = this.signTransaction(transaction);
            console.log("Transazione firmata con successo:", transaction.signature.substring(0, 20) + "...");
        } catch (e) {
            console.error("Errore durante la firma:", e);
            // Per debug, assegnamo una firma fittizia
            transaction.signature = "debug-signature-" + Date.now();
            console.log("Assegnata firma di debug:", transaction.signature);
        }
        
        return transaction;
    }

    // Firma una transazione
    private signTransaction(transaction: Transaction): string {
        try {
            const signer = crypto.createSign('SHA256');
            signer.update(
                transaction.fromAddress + 
                transaction.toAddress + 
                transaction.amount + 
                transaction.timestamp
            );
            
            return signer.sign(this.privateKey, 'hex');
        } catch (e : any) {
            console.error("Errore durante la firma:", e);
            throw new Error('Impossibile firmare la transazione: ' + e.message);
        }
    }

    // Ottieni l'indirizzo del wallet (versione semplificata - usiamo la chiave pubblica stessa)
    getAddress(): string {
        // In una implementazione reale si userebbe un hash della chiave pubblica
        // Per semplicità usiamo un hash abbreviato della chiave pubblica
        return crypto.createHash('sha256').update(this.publicKey).digest('hex').substring(0, 40);
    }
}

export default Wallet;


/*
// wallet.ts
import * as crypto from 'crypto';
import { Transaction } from './blockchain';
import KeyGenerator from './keygenerator';

class Wallet {
    public publicKey: string;
    public privateKey: string;
    private keyGenerator: KeyGenerator;

    constructor() {
        this.keyGenerator = new KeyGenerator();
        // Genera chiavi di default
        const keys = this.keyGenerator.generateKeyPair();
        this.publicKey = keys.publicKey;
        this.privateKey = keys.privateKey;
    }

    // Genera nuove chiavi
    generateNewKeys(): void {
        const keys = this.keyGenerator.generateKeyPair();
        this.publicKey = keys.publicKey;
        this.privateKey = keys.privateKey;
    }

    // Salva le chiavi in file
    saveKeys(filename: string): void {
        this.keyGenerator.saveKeysToFile(this.publicKey, this.privateKey, filename);
    }

    // Carica le chiavi da file
    loadKeys(filename: string): void {
        this.publicKey = this.keyGenerator.loadPublicKey(filename);
        this.privateKey = this.keyGenerator.loadPrivateKey(filename);
    }

    // Crea una transazione firmata
    createTransaction(toAddress: string, amount: number): Transaction {
        const transaction: Transaction = {
            fromAddress: this.publicKey,
            toAddress,
            amount,
            timestamp: Date.now()
        };

        // Firma la transazione
        transaction.signature = this.signTransaction(transaction);
        
        return transaction;
    }

    // Firma una transazione
    private signTransaction(transaction: Transaction): string {
        const signer = crypto.createSign('SHA256');
        signer.update(
            transaction.fromAddress + 
            transaction.toAddress + 
            transaction.amount + 
            transaction.timestamp
        );
        
        return signer.sign(this.privateKey, 'hex');
    }

    // Ottieni l'indirizzo del wallet (versione semplificata - usiamo la chiave pubblica stessa)
    getAddress(): string {
        // In una implementazione reale si userebbe un hash della chiave pubblica
        // Per semplicità usiamo un hash abbreviato della chiave pubblica
        return crypto.createHash('sha256').update(this.publicKey).digest('hex').substring(0, 40);
    }
}

export default Wallet;
*/