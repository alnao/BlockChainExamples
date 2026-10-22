// Esporta in local-keys.json gli stessi account che "npx hardhat node" mette a disposizione.
// Le chiavi non sono casuali: vengono derivate dal mnemonic configurato in hardhat.config.js
// (di default quello standard di Hardhat), quindi coincidono con quelle stampate dal nodo locale.
//
// Uso: npx hardhat run scripts/generate-keys.js
const hre = require('hardhat');
const { ethers } = require('ethers');
const fs = require('fs');

function deriveHardhatAccounts() {
    const cfg = hre.config.networks.hardhat.accounts;

    if (Array.isArray(cfg)) {
        // accounts configurati come lista esplicita di chiavi private
        return cfg.map((acc, i) => {
            const wallet = new ethers.Wallet(acc.privateKey);
            return { id: i, privateKey: wallet.privateKey, publicKey: wallet.signingKey.publicKey, address: wallet.address, mnemonic: null };
        });
    }

    const { mnemonic, path, initialIndex, count, passphrase } = cfg;
    const keys = [];
    for (let i = initialIndex; i < initialIndex + count; i++) {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase, `${path}/${i}`);
        keys.push({
            id: i,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            address: wallet.address,
            path: wallet.path
        });
    }
    return { mnemonic, keys };
}

function saveKeysToFile(data, filename = 'local-keys.json') {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Chiavi salvate in ${filename}`);
}

function main() {
    console.log('Esportazione account del nodo Hardhat locale...\n');

    const derived = deriveHardhatAccounts();
    const keys = Array.isArray(derived) ? derived : derived.keys;

    keys.forEach(key => {
        console.log(`--- Account #${key.id} ---`);
        console.log(`Address: ${key.address}`);
        console.log(`Private Key: ${key.privateKey}`);
        console.log('');
    });

    saveKeysToFile({
        generated: new Date().toISOString(),
        mnemonic: Array.isArray(derived) ? null : derived.mnemonic,
        keys
    });

    console.log('ATTENZIONE: Queste chiavi sono pubbliche e note a tutti (mnemonic di default di Hardhat)!');
    console.log('Usale solo sul nodo locale, mai in produzione o mainnet!');
}

main();
