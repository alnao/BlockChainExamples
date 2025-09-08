const { ethers } = require('ethers');
const fs = require('fs');

function generateKeyPair() {
    const wallet = ethers.Wallet.createRandom();
    
    return {
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
        address: wallet.address,
        mnemonic: wallet.mnemonic?.phrase || null
    };
}

function generateMultipleKeys(count = 5) {
    const keys = [];
    
    for (let i = 0; i < count; i++) {
        const keyPair = generateKeyPair();
        keys.push({
            id: i + 1,
            ...keyPair
        });
    }
    
    return keys;
}

function saveKeysToFile(keys, filename = 'local-keys.json') {
    const data = {
        generated: new Date().toISOString(),
        keys: keys
    };
    
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Chiavi salvate in ${filename}`);
}

function main() {
    console.log('Generazione chiavi per sviluppo locale...\n');
    
    const keyPairs = generateMultipleKeys(5);
    
    keyPairs.forEach(key => {
        console.log(`--- Chiave ${key.id} ---`);
        console.log(`Address: ${key.address}`);
        console.log(`Private Key: ${key.privateKey}`);
        console.log(`Mnemonic: ${key.mnemonic}`);
        console.log('');
    });
    
    saveKeysToFile(keyPairs);
    
    console.log('ATTENZIONE: Queste chiavi sono solo per sviluppo locale!');
    console.log('Non usarle mai in produzione o mainnet!');
}

main();