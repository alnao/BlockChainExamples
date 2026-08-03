// utils/gasHelper.js
// Calcola fee override con buffer per evitare l'errore
// "max fee per gas less than block base fee" su Arbitrum.
//
// MetaMask sovrascrive getFeeData() del provider ethers, quindi l'unico
// modo affidabile per impostare le fee è passarle esplicitamente in ogni
// chiamata al contratto come overrides: { maxFeePerGas, maxPriorityFeePerGas }.

import { ethers } from 'ethers';

/**
 * Restituisce gli override da passare alle chiamate al contratto.
 * Legge la baseFee corrente dal provider e aggiunge un buffer del 50%.
 *
 * Uso:
 *   const overrides = await getTxOverrides(provider);
 *   const tx = await contract.addDocumentType(type, overrides);
 */
export async function getTxOverrides(provider) {
  try {
    const block = await provider.getBlock('latest');
    if (!block) return {};

    // baseFee del blocco corrente in wei (BigInt)
    const baseFee = block.baseFeePerGas ?? 0n;

    // Buffer +100% sulla baseFee per assorbire variazioni rapide su Arbitrum
    // (la baseFee su Arbitrum è bassissima, quindi il costo aggiuntivo è trascurabile)
    const maxFeePerGas = (baseFee * 200n) / 100n;

    // Tip minimo — su Arbitrum basta 1 gwei o anche 0
    const maxPriorityFeePerGas = ethers.parseUnits('0.01', 'gwei');

    return { maxFeePerGas, maxPriorityFeePerGas };
  } catch (err) {
    console.warn('getTxOverrides: impossibile leggere la baseFee, uso valori di default', err);
    // Fallback sicuro: 0.1 gwei
    return {
      maxFeePerGas: ethers.parseUnits('0.1', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('0.01', 'gwei'),
    };
  }
}
