// keygenerator.ts
import * as crypto from 'crypto';
import * as fs from 'fs';

class KeyGenerator {
    public generateKeyPair() {
        // Genera una coppia di chiavi RSA
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return {
            publicKey,
            privateKey
        };
    }

    public saveKeysToFile(publicKey: string, privateKey: string, filename: string): void {
        // Salva le chiavi in file
        fs.writeFileSync(`${filename}_public.pem`, publicKey);
        fs.writeFileSync(`${filename}_private.pem`, privateKey);

        console.log(`Le chiavi sono state salvate nei file ${filename}_public.pem e ${filename}_private.pem`);
    }

    public loadPublicKey(filename: string): string {
        return fs.readFileSync(`${filename}_public.pem`, 'utf8');
    }

    public loadPrivateKey(filename: string): string {
        return fs.readFileSync(`${filename}_private.pem`, 'utf8');
    }

    public signTransaction(transaction: any, privateKey: string): string {
        const signer = crypto.createSign('SHA256');
        signer.update(transaction.fromAddress + transaction.toAddress + transaction.amount + transaction.timestamp);
        return signer.sign(privateKey, 'hex');
    }
}

export default KeyGenerator;