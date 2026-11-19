// Polyfill per il browser: @solana/web3.js, @coral-xyz/anchor e il calcolo dei PDA
// usano `Buffer`, che esiste in Node.js ma non nel browser (Vite non lo aggiunge).
// Questo file va importato PER PRIMO in main.jsx, prima di qualsiasi altro modulo.
import { Buffer } from 'buffer';

if (!globalThis.Buffer) globalThis.Buffer = Buffer;
