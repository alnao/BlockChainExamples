import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ethers } from 'ethers';

const EVENT_NAMES = ['LiquidityAdded', 'LiquidityRemoved', 'Swap'];

// Legge gli eventi del DEX (in modo incrementale) e ricostruisce le riserve dopo ogni transazione:
// le riserve cambiano solo tramite addLiquidity, removeLiquidity e swap, quindi rigiocando
// gli eventi in ordine si ottiene esattamente lo stato del pool a ogni passo.
export function useDexHistory(web3) {
  const [events, setEvents] = useState([]);
  const cache = useRef({ lastBlock: -1, timestamps: new Map(), loading: false, pending: false });

  const fetchNew = useCallback(async () => {
    const { provider, dex } = web3;
    const c = cache.current;
    // eth_blockNumber diretto: getBlockNumber di ethers riusa per 250ms le risposte identiche,
    // quindi subito dopo tx.wait() potrebbe restituire il blocco precedente
    const latest = Number(await provider.send('eth_blockNumber', []));

    // Nodo locale riavviato: la chain è ripartita da zero
    const reset = latest < c.lastBlock;
    if (reset) {
      c.lastBlock = -1;
      c.timestamps.clear();
    }
    if (latest <= c.lastBlock) return;

    // Intervallo esplicito [from, latest]: i blocchi già minati non cambiano, quindi leggerli
    // (anche da cache) dà sempre lo stesso risultato e nessun evento viene saltato
    const from = c.lastBlock + 1;
    const logs = (
      await Promise.all(EVENT_NAMES.map((name) => dex.queryFilter(dex.filters[name](), from, latest)))
    ).flat();
    logs.sort((a, b) => a.blockNumber - b.blockNumber || a.index - b.index);

    for (const blockNumber of new Set(logs.map((l) => l.blockNumber))) {
      if (!c.timestamps.has(blockNumber)) {
        c.timestamps.set(blockNumber, (await provider.getBlock(blockNumber)).timestamp);
      }
    }

    const fresh = logs.map((l) => ({
      name: l.eventName,
      args: l.args,
      blockNumber: l.blockNumber,
      hash: l.transactionHash,
      timestamp: c.timestamps.get(l.blockNumber)
    }));
    c.lastBlock = latest;
    setEvents((prev) => (reset ? fresh : [...prev, ...fresh]));
  }, [web3]);

  // Evita letture sovrapposte (polling + reload dopo una transazione)
  const reload = useCallback(async () => {
    if (!web3) return;
    const c = cache.current;
    if (c.loading) {
      c.pending = true;
      return;
    }
    c.loading = true;
    try {
      do {
        c.pending = false;
        await fetchNew();
      } while (c.pending);
    } catch (err) {
      console.error('History load failed:', err);
    } finally {
      c.loading = false;
    }
  }, [web3, fetchNew]);

  useEffect(() => {
    if (!web3) return;
    reload();
    const interval = setInterval(reload, 5000);
    return () => clearInterval(interval);
  }, [web3, reload]);

  const rows = useMemo(() => {
    let reserveA = 0n;
    let reserveETH = 0n;
    return events.map((e, i) => {
      const { args } = e;
      let type, deltaA, deltaETH, feeA = 0n, feeETH = 0n;

      if (e.name === 'LiquidityAdded') {
        type = 'Aggiunta liquidità';
        deltaA = args.amountA;
        deltaETH = args.amountETH;
      } else if (e.name === 'LiquidityRemoved') {
        type = 'Rimozione liquidità';
        deltaA = -args.amountA;
        deltaETH = -args.amountETH;
      } else if (args.tokenIn === ethers.ZeroAddress) {
        type = 'Swap ETH → NAO';
        deltaETH = args.amountIn;
        deltaA = -args.amountOut;
        feeETH = (args.amountIn * 3n) / 1000n;
      } else {
        type = 'Swap NAO → ETH';
        deltaA = args.amountIn;
        deltaETH = -args.amountOut;
        feeA = (args.amountIn * 3n) / 1000n;
      }

      reserveA += deltaA;
      reserveETH += deltaETH;
      return {
        n: i + 1,
        blockNumber: e.blockNumber,
        timestamp: e.timestamp,
        hash: e.hash,
        user: args[0],
        type,
        isSwap: e.name === 'Swap',
        deltaA,
        deltaETH,
        feeA,
        feeETH,
        reserveA,
        reserveETH,
        // NAO per 1 ETH, in wei (18 decimali)
        price: reserveETH > 0n ? (reserveA * 10n ** 18n) / reserveETH : 0n
      };
    });
  }, [events]);

  return { rows, reload };
}
