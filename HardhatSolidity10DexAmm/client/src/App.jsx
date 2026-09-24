import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';
import History from './History.jsx';
import { useDexHistory } from './useDexHistory.js';

// ABI e indirizzi generati da scripts/deploy.js
import dexAbi from './contracts/dex_abi.json';
import tokenAbi from './contracts/token_abi.json';
import { TOKEN_ADDRESS, DEX_ADDRESS, CHAIN_ID } from './contracts/config';

const MINIMUM_LIQUIDITY = 1000n;
const EMPTY_DATA = { nao: 0n, eth: 0n, lp: 0n, totalSupply: 0n, reserveA: 0n, reserveETH: 0n };

// Stessa formula di SimpleDEX.getAmountOut: serve per l'anteprima,
// al momento dello swap il preventivo viene riletto on-chain
function getAmountOut(amountIn, reserveIn, reserveOut) {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  return (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
}

function sqrt(value) {
  if (value < 2n) return value;
  let x = value;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }
  return x;
}

function min(a, b) {
  return a < b ? a : b;
}

// Converte l'input dell'utente in wei; 0n se vuoto o non valido
function parseAmount(value) {
  try {
    const v = ethers.parseEther(value || '0');
    return v > 0n ? v : 0n;
  } catch {
    return 0n;
  }
}

function fmt(value, digits = 4) {
  return parseFloat(ethers.formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function withSlippage(amount, slippage) {
  const bps = BigInt(Math.round(Math.min(Math.max(parseFloat(slippage) || 0, 0), 50) * 100));
  return (amount * (10000n - bps)) / 10000n;
}

function errorMessage(err) {
  return err.reason || err.shortMessage || err.message;
}

function App() {
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null); // { provider, dex, token }
  const [data, setData] = useState(EMPTY_DATA);

  const [direction, setDirection] = useState('NAO_TO_ETH');
  const [swapInput, setSwapInput] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [addNaoInput, setAddNaoInput] = useState('');
  const [addEthInput, setAddEthInput] = useState('');
  const [removeInput, setRemoveInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const history = useDexHistory(web3);

  const initContracts = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    setWeb3({
      provider,
      dex: new ethers.Contract(DEX_ADDRESS, dexAbi, signer),
      token: new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer)
    });
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask non rilevato! Installalo per continuare.');
        return;
      }
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await initContracts();
      setAccount(accounts[0]);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Errore connessione wallet: ' + errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio account e rete in tempo reale
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccounts = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        initContracts();
      } else {
        setAccount('');
        setWeb3(null);
      }
    };
    const handleChain = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!account || !web3) return;
    const { provider, dex, token } = web3;

    try {
      const { chainId } = await provider.getNetwork();
      if (chainId.toString() !== CHAIN_ID) {
        setNetworkError(`Rete errata (chain ${chainId}): collega MetaMask alla rete Hardhat Localhost (chain ${CHAIN_ID}).`);
        return;
      }
      if ((await provider.getCode(DEX_ADDRESS)) === '0x') {
        setNetworkError(`Nessun contratto all'indirizzo ${DEX_ADDRESS}. Hai fatto il deploy dopo aver avviato il nodo?`);
        return;
      }

      const [nao, eth, lp, totalSupply, [reserveA, reserveETH]] = await Promise.all([
        token.balanceOf(account),
        provider.getBalance(account),
        dex.balanceOf(account),
        dex.totalSupply(),
        dex.getReserves()
      ]);
      setData({ nao, eth, lp, totalSupply, reserveA, reserveETH });
      setNetworkError('');
    } catch (err) {
      console.error('Update failed:', err);
      setNetworkError('Lettura dati fallita: ' + errorMessage(err));
    }
  }, [account, web3]);

  useEffect(() => {
    if (!account) return;
    refresh();
    const interval = setInterval(refresh, 5000); // Aggiorna ogni 5 secondi
    return () => clearInterval(interval);
  }, [account, refresh]);

  // Esegue una transazione gestendo loading, messaggi ed errori
  const runTx = async (label, fn) => {
    try {
      setLoading(true);
      setError('');
      await fn();
      setStatus(`${label} completato con successo!`);
      await Promise.all([refresh(), history.reload()]);
    } catch (err) {
      console.error(err);
      setStatus('');
      setError(`${label} fallito: ${errorMessage(err)}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // La deadline usa il tempo della chain, che sul nodo locale può differire dall'orologio del PC
  const deadline = async () => (await web3.provider.getBlock('latest')).timestamp + 600;

  const ensureAllowance = async (amount) => {
    const allowance = await web3.token.allowance(account, DEX_ADDRESS);
    if (allowance < amount) {
      setStatus('In attesa di approvazione NAO...');
      await (await web3.token.approve(DEX_ADDRESS, amount)).wait();
    }
  };

  // ---------- Valori derivati ----------
  const { reserveA, reserveETH, totalSupply } = data;
  const poolEmpty = reserveA === 0n && reserveETH === 0n;
  const naoToEth = direction === 'NAO_TO_ETH';

  const swapIn = parseAmount(swapInput);
  const [reserveIn, reserveOut] = naoToEth ? [reserveA, reserveETH] : [reserveETH, reserveA];
  const swapOut = getAmountOut(swapIn, reserveIn, reserveOut);
  const spotOut = reserveIn > 0n ? (swapIn * reserveOut) / reserveIn : 0n;
  const priceImpact = spotOut > 0n ? 100 - Number((swapOut * 10000n) / spotOut) / 100 : 0;
  const swapBalance = naoToEth ? data.nao : data.eth;
  // Con ETH si lascia un margine per pagare il gas
  const gasReserve = ethers.parseEther('0.01');
  const swapMax = naoToEth ? data.nao : data.eth > gasReserve ? data.eth - gasReserve : 0n;

  const addNao = parseAmount(addNaoInput);
  const addEth = poolEmpty ? parseAmount(addEthInput) : reserveA > 0n ? (addNao * reserveETH) / reserveA : 0n;
  let addLpPreview = 0n;
  if (addNao > 0n && addEth > 0n) {
    addLpPreview = totalSupply === 0n
      ? (sqrt(addNao * addEth) > MINIMUM_LIQUIDITY ? sqrt(addNao * addEth) - MINIMUM_LIQUIDITY : 0n)
      : min((addNao * totalSupply) / reserveA, (addEth * totalSupply) / reserveETH);
  }

  const removeLp = parseAmount(removeInput);
  const removeNao = totalSupply > 0n ? (removeLp * reserveA) / totalSupply : 0n;
  const removeEth = totalSupply > 0n ? (removeLp * reserveETH) / totalSupply : 0n;
  const share = totalSupply > 0n ? Number((data.lp * 10000n) / totalSupply) / 100 : 0;

  // ---------- Azioni ----------
  const handleSwap = () => runTx('Swap', async () => {
    const { dex } = web3;
    const [rA, rETH] = await dex.getReserves();
    if (naoToEth) {
      const expected = await dex.getAmountOut(swapIn, rA, rETH);
      await ensureAllowance(swapIn);
      setStatus('Esecuzione swap NAO → ETH...');
      await (await dex.swapAforETH(swapIn, withSlippage(expected, slippage), await deadline())).wait();
    } else {
      const expected = await dex.getAmountOut(swapIn, rETH, rA);
      setStatus('Esecuzione swap ETH → NAO...');
      await (await dex.swapETHforA(withSlippage(expected, slippage), await deadline(), { value: swapIn })).wait();
    }
    setSwapInput('');
  });

  const handleAddLiquidity = () => runTx('Aggiunta liquidità', async () => {
    await ensureAllowance(addNao);
    setStatus('Aggiunta liquidità...');
    await (await web3.dex.addLiquidity(
      addNao,
      withSlippage(addNao, slippage),
      withSlippage(addEth, slippage),
      await deadline(),
      { value: addEth }
    )).wait();
    setAddNaoInput('');
    setAddEthInput('');
  });

  const handleRemoveLiquidity = () => runTx('Rimozione liquidità', async () => {
    setStatus('Rimozione liquidità...');
    await (await web3.dex.removeLiquidity(
      removeLp,
      withSlippage(removeNao, slippage),
      withSlippage(removeEth, slippage),
      await deadline()
    )).wait();
    setRemoveInput('');
  });

  const toggleDirection = () => {
    setDirection(naoToEth ? 'ETH_TO_NAO' : 'NAO_TO_ETH');
    setSwapInput('');
  };

  return (
    <div className="App">
      <header>
        <h1><span className="logo">🔄</span> NAO DEX</h1>
        {account ? (
          <div className="address-badge">
            {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        ) : (
          <button className="connect-btn" onClick={connectWallet} disabled={loading}>
            Connetti Wallet
          </button>
        )}
      </header>

      <main>
        {networkError && <div className="error-msg">{networkError}</div>}
        {error && (
          <div className="error-msg">
            {error}
            <button className="close-btn" onClick={() => setError('')}>×</button>
          </div>
        )}
        {status && <div className="status-msg">{status}</div>}

        {!account ? (
          <div className="hero">
            <h2>Scambia NAO ed ETH e fornisci liquidità al pool.</h2>
            <p>Connetti il tuo account Hardhat o MetaMask per iniziare a usare l'AMM x · y = k.</p>
          </div>
        ) : (
          <>
            <div className="dashboard">
              <div className="card">
                <h3>Wallet</h3>
                <div className="value">{fmt(data.nao, 2)}<span className="symbol">NAO</span></div>
                <div className="value small">{fmt(data.eth)}<span className="symbol">ETH</span></div>
              </div>

              <div className="card">
                <h3>Le tue LP</h3>
                <div className="value">{fmt(data.lp)}<span className="symbol">SDL-LP</span></div>
                <div className="detail">{share.toLocaleString(undefined, { maximumFractionDigits: 2 })}% del pool</div>
              </div>

              <div className="card">
                <h3>Pool</h3>
                <div className="value small">{fmt(reserveA, 2)}<span className="symbol">NAO</span></div>
                <div className="value small">{fmt(reserveETH)}<span className="symbol">ETH</span></div>
                <div className="detail">
                  {poolEmpty ? 'Pool vuoto' : `1 ETH = ${fmt((reserveA * 10n ** 18n) / reserveETH)} NAO`}
                </div>
              </div>
            </div>

            <div className="slippage-row">
              <label htmlFor="slippage">Tolleranza slippage</label>
              <input
                id="slippage"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                disabled={loading}
              />
              <span>%</span>
            </div>

            <div className="dex-actions">
              <div className="action-box">
                <div className="action-header">
                  <h2>Swap</h2>
                  <p className="hint">Fee dello 0.3% trattenuta dal pool</p>
                </div>

                <label className="field-label">
                  Vendi {naoToEth ? 'NAO' : 'ETH'}
                  <span>Saldo: {fmt(swapBalance)}</span>
                </label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={swapInput}
                    onChange={(e) => setSwapInput(e.target.value)}
                    disabled={loading}
                  />
                  <button className="max-btn" onClick={() => setSwapInput(ethers.formatEther(swapMax))} disabled={loading}>
                    Max
                  </button>
                </div>

                <button className="switch-btn" onClick={toggleDirection} disabled={loading} title="Inverti direzione">⇅</button>

                <label className="field-label">Ricevi {naoToEth ? 'ETH' : 'NAO'} (stima)</label>
                <div className="output-box">{fmt(swapOut, 6)}</div>

                <div className="preview">
                  <div><span>Minimo garantito</span><span>{fmt(withSlippage(swapOut, slippage), 6)} {naoToEth ? 'ETH' : 'NAO'}</span></div>
                  <div>
                    <span>Impatto sul prezzo (fee inclusa)</span>
                    <span className={priceImpact > 5 ? 'warn' : ''}>{priceImpact.toFixed(2)}%</span>
                  </div>
                </div>

                <button className="action-btn" onClick={handleSwap} disabled={loading || swapOut === 0n || swapIn > swapBalance}>
                  {loading && <span className="loading-spinner"></span>}
                  {swapIn > swapBalance ? 'Saldo insufficiente' : 'Swap'}
                </button>
              </div>

              <div className="action-box">
                <div className="action-header">
                  <h2>Liquidità</h2>
                  <p className="hint">
                    {poolEmpty ? 'Pool vuoto: il tuo deposito fissa il prezzo iniziale' : "L'ETH viene calcolato dalla proporzione del pool"}
                  </p>
                </div>

                <label className="field-label">NAO<span>Saldo: {fmt(data.nao)}</span></label>
                <div className="input-container">
                  <input type="number" placeholder="0.0" value={addNaoInput} onChange={(e) => setAddNaoInput(e.target.value)} disabled={loading} />
                </div>
                <label className="field-label">ETH<span>Saldo: {fmt(data.eth)}</span></label>
                <div className="input-container">
                  {poolEmpty ? (
                    <input type="number" placeholder="0.0" value={addEthInput} onChange={(e) => setAddEthInput(e.target.value)} disabled={loading} />
                  ) : (
                    <div className="output-box">{fmt(addEth, 6)}</div>
                  )}
                </div>
                <div className="preview">
                  <div><span>LP ricevuti (stima)</span><span>{fmt(addLpPreview, 6)}</span></div>
                </div>
                <button
                  className="action-btn"
                  onClick={handleAddLiquidity}
                  disabled={loading || addLpPreview === 0n || addNao > data.nao || addEth > data.eth}
                >
                  Aggiungi liquidità
                </button>

                <hr />

                <label className="field-label">LP da rimuovere<span>Saldo: {fmt(data.lp)}</span></label>
                <div className="input-container">
                  <input type="number" placeholder="0.0" value={removeInput} onChange={(e) => setRemoveInput(e.target.value)} disabled={loading} />
                  <button className="max-btn" onClick={() => setRemoveInput(ethers.formatEther(data.lp))} disabled={loading}>
                    Max
                  </button>
                </div>
                <div className="preview">
                  <div><span>Riceverai (stima)</span><span>{fmt(removeNao)} NAO + {fmt(removeEth, 6)} ETH</span></div>
                </div>
                <button
                  className="action-btn secondary-btn"
                  onClick={handleRemoveLiquidity}
                  disabled={loading || removeLp === 0n || removeLp > data.lp}
                >
                  Rimuovi liquidità
                </button>
              </div>
            </div>

            <History rows={history.rows} account={account} />
          </>
        )}
      </main>

      <footer>
        <p>&copy; 2026 NAO Blockchain DEX Platform - AlNao</p>
      </footer>
    </div>
  );
}

export default App;
