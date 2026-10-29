import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  TOKEN_ADDRESS,
  VRF_COORDINATOR_ADDRESS,
  LOTTERY_ADDRESS,
  CHAIN_ID,
  ENTRY_FEE,
} from './contracts/config.js';
import TOKEN_ABI from './contracts/token_abi.json';
import LOTTERY_ABI from './contracts/lottery_abi.json';
import VRF_ABI from './contracts/vrf_abi.json';
import './App.css';

// ─────────────────────────────────────────────────────────────
// Costanti
// ─────────────────────────────────────────────────────────────
const HARDHAT_CHAIN_ID = `0x${parseInt(CHAIN_ID).toString(16)}`;
const HARDHAT_NETWORK = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

const STATE_NAMES = ['OPEN', 'CALCULATING_WINNER', 'CLOSED'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function shortAddr(addr) {
  if (!addr || addr === ethers.ZeroAddress) return 'Nessuno';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmt(wei, dec = 4) {
  if (!wei) return '0';
  try {
    const val = parseFloat(ethers.formatEther(wei));
    return isNaN(val) ? '0' : val.toFixed(dec);
  } catch {
    return '0';
  }
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
export default function App() {
  // --- wallet state ---
  const [account, setAccount]       = useState(null);
  const [chainOk, setChainOk]       = useState(false);
  const [provider, setProvider]     = useState(null);
  const [signer, setSigner]         = useState(null);
  const [isOwner, setIsOwner]       = useState(false);

  // --- contracts ---
  const [lotteryContract, setLotteryContract] = useState(null);
  const [tokenContract, setTokenContract]     = useState(null);
  const [vrfContract, setVrfContract]         = useState(null);

  // --- balances ---
  const [naoBal, setNaoBal] = useState(0n);
  const [ethBal, setEthBal] = useState(0n);

  // --- lottery data ---
  const [roundId, setRoundId]             = useState(1);
  const [lotteryState, setLotteryState]   = useState(0); // 0: OPEN, 1: CALCULATING, 2: CLOSED
  const [entryFee, setEntryFee]           = useState(ENTRY_FEE || '1000000000000000000');
  const [potBalance, setPotBalance]       = useState(0n);
  const [players, setPlayers]             = useState([]);
  const [lastRequestId, setLastRequestId] = useState('0');
  const [recentWinner, setRecentWinner]   = useState(ethers.ZeroAddress);
  const [recentPrize, setRecentPrize]     = useState(0n);

  // --- history data ---
  const [historyRounds, setHistoryRounds]       = useState([]);
  const [selectedRoundId, setSelectedRoundId]   = useState(null);

  // Selected round for history view
  const selectedRound = useMemo(() => {
    if (!historyRounds.length) return null;
    if (selectedRoundId === null) return historyRounds[0];
    return historyRounds.find((r) => r.roundId === selectedRoundId) || historyRounds[0];
  }, [historyRounds, selectedRoundId]);

  // --- ui ---
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState(null);
  const [newFeeInput, setNewFeeInput] = useState('');
  const [eventsFeed, setEventsFeed]   = useState([]);

  // Stats computed for current user
  const userTicketsCount = useMemo(() => {
    if (!account || !players.length) return 0;
    return players.filter((p) => p.toLowerCase() === account.toLowerCase()).length;
  }, [account, players]);

  const userWinProbability = useMemo(() => {
    if (!players.length || userTicketsCount === 0) return 0;
    return ((userTicketsCount / players.length) * 100).toFixed(1);
  }, [players, userTicketsCount]);

  // ───────────────────────────────────────────────────────────
  // Wallet connect / events (esattamente come nel progetto 12)
  // ───────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus({ message: 'MetaMask non trovato. Installa MetaMask per continuare.', type: 'error' });
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await setupProvider();
    } catch (e) {
      setStatus({ message: e.message, type: 'error' });
    }
  }, []);

  const setupProvider = useCallback(async () => {
    if (!window.ethereum) return;

    const prov = new ethers.BrowserProvider(window.ethereum);
    const net  = await prov.getNetwork();
    const ok   = net.chainId.toString() === CHAIN_ID;
    setProvider(prov);
    setChainOk(ok);

    const accounts = await prov.listAccounts();
    if (accounts.length === 0) {
      setAccount(null);
      setSigner(null);
      setIsOwner(false);
      setNaoBal(0n);
      setEthBal(0n);
      return;
    }

    const sgn = await prov.getSigner();
    const currentAddress = await sgn.getAddress();
    setAccount(currentAddress);
    setSigner(sgn);

    if (ok) {
      setLotteryContract(new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, sgn));
      setTokenContract(new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, sgn));
      setVrfContract(new ethers.Contract(VRF_COORDINATOR_ADDRESS, VRF_ABI, sgn));
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [HARDHAT_NETWORK],
        });
      }
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      setupProvider();
      window.ethereum.on('accountsChanged', setupProvider);
      window.ethereum.on('chainChanged', setupProvider);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', setupProvider);
        window.ethereum.removeListener('chainChanged', setupProvider);
      }
    };
  }, [setupProvider]);

  // Fallback read-only provider per visualizzare il jackpot se MetaMask non è ancora connesso
  useEffect(() => {
    if (!lotteryContract) {
      try {
        const jsonRpc = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        setLotteryContract(new ethers.Contract(LOTTERY_ADDRESS, LOTTERY_ABI, jsonRpc));
        setTokenContract(new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, jsonRpc));
        setVrfContract(new ethers.Contract(VRF_COORDINATOR_ADDRESS, VRF_ABI, jsonRpc));
      } catch (e) {
        console.warn('Fallback RPC error:', e);
      }
    }
  }, [lotteryContract]);

  // ───────────────────────────────────────────────────────────
  // Data refresh (esattamente come nel progetto 12)
  // ───────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!lotteryContract || !tokenContract) return;
    try {
      const [
        stateVal,
        roundVal,
        feeVal,
        potVal,
        playersList,
        ownerAddr,
        lastReq,
        rWinner,
        rPrize,
      ] = await Promise.all([
        lotteryContract.lotteryState(),
        lotteryContract.lotteryId(),
        lotteryContract.entryFee(),
        lotteryContract.getLotteryBalance(),
        lotteryContract.getPlayers(),
        lotteryContract.owner(),
        lotteryContract.lastRequestId(),
        lotteryContract.recentWinner(),
        lotteryContract.recentPrize(),
      ]);

      setLotteryState(Number(stateVal));
      setRoundId(Number(roundVal));
      setEntryFee(feeVal);
      setPotBalance(potVal);
      setPlayers(playersList);
      setLastRequestId(lastReq.toString());
      setRecentWinner(rWinner);
      setRecentPrize(rPrize);

      if (account && provider) {
        const [userNao, userEth] = await Promise.all([
          tokenContract.balanceOf(account),
          provider.getBalance(account),
        ]);
        setNaoBal(userNao);
        setEthBal(userEth);
        setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
      } else {
        setIsOwner(false);
      }

      // Carica storico completo degli eventi on-chain
      await loadHistory();
    } catch (err) {
      console.warn('Error refreshing data:', err);
    }
  }, [account, lotteryContract, tokenContract, provider]);

  // Caricamento storico partite con timestamp e biglietti
  const loadHistory = useCallback(async () => {
    if (!lotteryContract) return;
    try {
      const currentProv = provider || lotteryContract.runner?.provider;
      const [enteredEvents, winnerEvents] = await Promise.all([
        lotteryContract.queryFilter(lotteryContract.filters.PlayerEntered(), 0, 'latest'),
        lotteryContract.queryFilter(lotteryContract.filters.WinnerPicked(), 0, 'latest'),
      ]);

      const blockTimestampCache = {};
      const getTimestamp = async (blockNumber) => {
        if (!blockNumber) return null;
        if (blockTimestampCache[blockNumber]) return blockTimestampCache[blockNumber];
        try {
          if (currentProv && currentProv.getBlock) {
            const block = await currentProv.getBlock(blockNumber);
            if (block && block.timestamp) {
              const timeMs = Number(block.timestamp) * 1000;
              blockTimestampCache[blockNumber] = timeMs;
              return timeMs;
            }
          }
        } catch { /* fallback */ }
        return null;
      };

      const roundsMap = {};

      for (const ev of enteredEvents) {
        const rId = Number(ev.args[0]);
        const player = ev.args[1];
        const time = await getTimestamp(ev.blockNumber);

        if (!roundsMap[rId]) {
          roundsMap[rId] = {
            roundId: rId,
            tickets: [],
            winner: null,
            prize: 0n,
            winnerTimestamp: null,
            winnerTx: null,
            isCompleted: false,
          };
        }

        roundsMap[rId].tickets.push({
          player,
          txHash: ev.transactionHash,
          blockNumber: ev.blockNumber,
          timestamp: time,
        });
      }

      for (const ev of winnerEvents) {
        const rId = Number(ev.args[0]);
        const winner = ev.args[1];
        const amount = ev.args[2];
        const time = await getTimestamp(ev.blockNumber);

        if (!roundsMap[rId]) {
          roundsMap[rId] = {
            roundId: rId,
            tickets: [],
            winner: null,
            prize: 0n,
            winnerTimestamp: null,
            winnerTx: null,
            isCompleted: false,
          };
        }

        roundsMap[rId].winner = winner;
        roundsMap[rId].prize = amount;
        roundsMap[rId].winnerTimestamp = time;
        roundsMap[rId].winnerTx = ev.transactionHash;
        roundsMap[rId].isCompleted = true;
      }

      const list = Object.values(roundsMap).sort((a, b) => b.roundId - a.roundId);
      setHistoryRounds(list);

      // Imposta il round selezionato di default se non impostato
      setSelectedRoundId((prev) => (prev !== null ? prev : (list[0]?.roundId || 1)));
    } catch (err) {
      console.warn('Errore recupero storico eventi:', err);
    }
  }, [lotteryContract, provider]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // ───────────────────────────────────────────────────────────
  // Listeners eventi smart contract
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lotteryContract) return;

    const onPlayerEntered = (lId, player) => {
      setEventsFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `🎟️ ${shortAddr(player)} ha acquistato un biglietto per il Round #${lId}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
      refreshData();
    };

    const onRequestSent = (reqId) => {
      setEventsFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `🎲 Richiesta VRF inviata all'oracolo Chainlink (Req ID: #${reqId})`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
      refreshData();
    };

    const onWinnerPicked = (lId, winner, amount) => {
      setEventsFeed((prev) => [
        {
          id: Date.now() + Math.random(),
          text: `🏆 VINCITORE Round #${lId}! ${shortAddr(winner)} ha vinto ${fmt(amount)} NAO!`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
      refreshData();
    };

    lotteryContract.on('PlayerEntered', onPlayerEntered);
    lotteryContract.on('RequestSent', onRequestSent);
    lotteryContract.on('WinnerPicked', onWinnerPicked);

    return () => {
      lotteryContract.off('PlayerEntered', onPlayerEntered);
      lotteryContract.off('RequestSent', onRequestSent);
      lotteryContract.off('WinnerPicked', onWinnerPicked);
    };
  }, [lotteryContract, refreshData]);

  // ───────────────────────────────────────────────────────────
  // Azioni Utente
  // ───────────────────────────────────────────────────────────
  const handleBuyTicket = async () => {
    if (!signer || !lotteryContract || !tokenContract) {
      setStatus({ message: 'Connetti prima il tuo wallet!', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      setStatus({ message: 'Verifica autorizzazione token NAO...', type: 'info' });

      const bal = await tokenContract.balanceOf(account);
      if (bal < entryFee) {
        setStatus({
          message: 'Saldo NAO insufficiente. Usa il Faucet NAO in alto per ottenere token gratuiti!',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      const currentAllowance = await tokenContract.allowance(account, LOTTERY_ADDRESS);
      if (currentAllowance < entryFee) {
        setStatus({ message: 'Approva lo spendimento dei token NAO nel contratto...', type: 'info' });
        const approveTx = await tokenContract.connect(signer).approve(LOTTERY_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      setStatus({ message: 'Invio transazione di acquisto biglietto...', type: 'info' });
      const tx = await lotteryContract.connect(signer).enter();
      await tx.wait();

      setStatus({ message: 'Biglietto acquistato con successo! Buona fortuna!', type: 'success' });
      await refreshData();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePickWinner = async () => {
    if (!signer || !lotteryContract) return;
    try {
      setLoading(true);
      setStatus({ message: 'Invio richiesta di estrazione a Chainlink VRF...', type: 'info' });
      const tx = await lotteryContract.connect(signer).pickWinner();
      await tx.wait();
      setStatus({ message: 'Estrazione avviata! Stato cambiato in CALCULATING_WINNER.', type: 'success' });
      await refreshData();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillVRF = async () => {
    if (!signer || !vrfContract) return;
    try {
      setLoading(true);
      setStatus({ message: 'Simulazione callback Chainlink VRF (fulfillRandomWords)...', type: 'info' });
      const reqId = lastRequestId !== '0' ? lastRequestId : 1;
      const tx = await vrfContract.connect(signer).fulfillRandomWords(reqId, LOTTERY_ADDRESS);
      await tx.wait();
      setStatus({ message: 'Randomness Chainlink verificata e vincitore estratto con successo!', type: 'success' });
      await refreshData();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFaucet = async () => {
    if (!signer || !tokenContract) return;
    try {
      setLoading(true);
      setStatus({ message: 'Richiesta di 50 NAO in corso dal Faucet di test...', type: 'info' });
      try {
        const tx = await tokenContract.connect(signer).mint(account, ethers.parseEther('50'));
        await tx.wait();
      } catch {
        setStatus({ message: 'Faucet disponibile solo se consentito dal contratto o via script fund.', type: 'info' });
      }
      setStatus({ message: '50 NAO accreditati con successo al tuo wallet!', type: 'success' });
      await refreshData();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetEntryFee = async (e) => {
    e.preventDefault();
    if (!signer || !lotteryContract || !newFeeInput) return;
    try {
      setLoading(true);
      setStatus({ message: 'Aggiornamento del costo del biglietto...', type: 'info' });
      const tx = await lotteryContract.connect(signer).setEntryFee(ethers.parseEther(newFeeInput));
      await tx.wait();
      setStatus({ message: `Prezzo biglietto aggiornato a ${newFeeInput} NAO`, type: 'success' });
      setNewFeeInput('');
      await refreshData();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.reason || err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-wrapper">
          <div className="brand-icon">🎲</div>
          <div>
            <h1 className="brand-title">NAO Lottery</h1>
            <div className="brand-subtitle">
              <span>Provably Fair Gaming</span>
              <span className="chainlink-badge">Chainlink VRF V2</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {account ? (
            <>
              {chainOk ? (
                <div className="network-badge ok">
                  <span className="dot pulse"></span> Localhost (31337)
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={switchNetwork}>
                  ⚠️ Passa a Hardhat Local
                </button>
              )}

              <div className="pill balance-pill" title="Saldo Token NAO">
                🪙 <span className="balance-value">{fmt(naoBal, 2)}</span> NAO
              </div>

              <div className="pill balance-pill" title="Saldo ETH per Gas">
                ⛽ <span className="balance-value">{fmt(ethBal, 3)}</span> ETH
              </div>

              <div className="pill account-pill" title={account}>
                👤 {shortAddr(account)} {isOwner && '⭐ (Owner)'}
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleFaucet}
                disabled={loading}
                title="Richiedi 50 NAO per testare la lotteria"
              >
                🚰 Faucet NAO
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={connectWallet} disabled={loading}>
              🦊 Connetti Wallet
            </button>
          )}
        </div>
      </header>

      {/* Notifications */}
      {status && (
        <div className={`status-banner ${status.type}`}>
          <span>{status.message}</span>
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={() => setStatus(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Hero: Jackpot & Status */}
      <section className="jackpot-hero">
        <div>
          <div className="jackpot-label">
            <span>✨ Montepremi Attuale • Round #{roundId}</span>
          </div>
          <div className="jackpot-amount">{fmt(potBalance, 2)} NAO</div>
          <div className="jackpot-details">
            <span>
              Prezzo Biglietto: <strong>{fmt(entryFee, 2)} NAO</strong>
            </span>
            <span>•</span>
            <span>
              Biglietti Emessi: <strong>{players.length}</strong>
            </span>
            <span>•</span>
            <span>
              Partecipanti Unici: <strong>{new Set(players).size}</strong>
            </span>
          </div>
        </div>

        <div className="round-status-box">
          <div
            className={`state-badge ${
              lotteryState === 0 ? 'open' : lotteryState === 1 ? 'calculating' : 'closed'
            }`}
          >
            <span className="dot pulse"></span>
            {STATE_NAMES[lotteryState]}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {lotteryState === 0 && 'Biglietteria aperta a tutti'}
            {lotteryState === 1 && '🎲 Estrazione numero casuale...'}
            {lotteryState === 2 && 'Lotteria conclusa'}
          </div>
        </div>
      </section>

      {/* Recent Winner Banner */}
      {recentWinner && recentWinner !== ethers.ZeroAddress && (
        <section className="winner-card">
          <div className="winner-info">
            <div className="trophy-icon">🏆</div>
            <div>
              <div className="winner-text-title">Ultimo Vincitore Estratto (Round #{roundId - 1})</div>
              <div className="winner-address">{shortAddr(recentWinner)}</div>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Premio Vinto: </span>
            <span className="winner-prize">+{fmt(recentPrize, 2)} NAO</span>
          </div>
        </section>
      )}

      {/* Main Grid: Player Actions & VRF Control */}
      <div className="main-grid">
        {/* Player Action Card */}
        <div className="card">
          <h2 className="card-title">🎟️ Partecipa alla Lotteria</h2>
          <p className="card-subtitle">
            Acquista uno o più biglietti pagando in token NAO. Il vincitore riceverà il 100% del montepremi accumulato.
          </p>

          <div className={`user-ticket-box ${userTicketsCount > 0 ? 'highlight' : ''}`}>
            <div>
              <div className="ticket-stat-label">I Tuoi Biglietti</div>
              <div className="ticket-stat-val">{userTicketsCount}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ticket-stat-label">Probabilità di Vincita</div>
              <div className="ticket-stat-val" style={{ color: userTicketsCount > 0 ? '#10b981' : 'var(--text-dim)' }}>
                {userWinProbability}%
              </div>
            </div>
          </div>

          <button
            className="btn btn-gold"
            onClick={handleBuyTicket}
            disabled={loading || lotteryState !== 0}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 'auto' }}
          >
            {loading ? 'Transazione in corso...' : `Acquista Biglietto (${fmt(entryFee, 2)} NAO)`}
          </button>
        </div>

        {/* Chainlink VRF & Admin Card */}
        <div className="card vrf-panel">
          <h2 className="card-title">🎲 Chainlink VRF Verifiable Random</h2>
          <p className="card-subtitle">
            L'estrazione utilizza l'oracolo crittografico Chainlink VRF per garantire casualità matematicamente imparziale.
          </p>

          <div className="vrf-info-box">
            <div className="vrf-info-row">
              <span>VRF Coordinator:</span>
              <span>{shortAddr(VRF_COORDINATOR_ADDRESS)}</span>
            </div>
            <div className="vrf-info-row">
              <span>Ultimo Request ID:</span>
              <span>#{lastRequestId}</span>
            </div>
            <div className="vrf-info-row">
              <span>Stato Macchina:</span>
              <span style={{ fontWeight: 'bold' }}>{STATE_NAMES[lotteryState]}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            {lotteryState === 0 ? (
              <button
                className="btn btn-primary"
                onClick={handlePickWinner}
                disabled={loading || players.length === 0 || !isOwner}
                title={!isOwner ? 'Solo il proprietario del contratto può avviare l’estrazione' : ''}
              >
                🎯 Avvia Estrazione (pickWinner)
              </button>
            ) : lotteryState === 1 ? (
              <button
                className="btn btn-emerald"
                onClick={handleFulfillVRF}
                disabled={loading}
              >
                ⚡ Simula Risposta VRF (fulfillRandomWords)
              </button>
            ) : null}

            {/* Admin Fee Update */}
            {isOwner && lotteryState === 0 && players.length === 0 && (
              <form onSubmit={handleSetEntryFee} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Nuovo prezzo (NAO)"
                  value={newFeeInput}
                  onChange={(e) => setNewFeeInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={!newFeeInput || loading}>
                  Salva Prezzo
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Players List Card */}
        <div className="card">
          <h2 className="card-title">👥 Giocatori del Round #{roundId}</h2>
          <p className="card-subtitle">
            Elenco in tempo reale dei biglietti registrati nel round corrente ({players.length} totali):
          </p>

          <div className="players-list">
            {players.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                Nessun biglietto acquistato finora in questo round.
              </div>
            ) : (
              players.map((addr, idx) => {
                const isMe = account && addr.toLowerCase() === account.toLowerCase();
                return (
                  <div key={idx} className={`player-item ${isMe ? 'is-me' : ''}`}>
                    <span>
                      #{idx + 1} {shortAddr(addr)} {isMe && '(Tu)'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>1 Biglietto</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Realtime Event Feed */}
      <section className="card events-card">
        <h2 className="card-title">📡 Feed Eventi Blockchain in Tempo Reale</h2>
        <div className="events-list">
          {eventsFeed.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              In attesa di transazioni ed eventi on-chain...
            </div>
          ) : (
            eventsFeed.map((ev) => (
              <div key={ev.id} className="event-item">
                <span className="event-type">{ev.text}</span>
                <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ev.time}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Storico Completo delle Partite ed Estrazioni (Paginato)       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="history-section">
        <div className="card history-card">
          <div className="history-nav-bar">
            <div>
              <h2 className="card-title">📜 Storico Partite & Estrazioni</h2>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                Consulta lo storico di ogni estrazione, l'elenco dei biglietti venduti, i timestamp e il vincitore proclamato.
              </p>
            </div>

            {/* Navigatore Paginato per Round */}
            {historyRounds.length > 0 && (
              <div className="round-pills-container">
                {historyRounds.map((r) => {
                  const isSelected = selectedRound?.roundId === r.roundId;
                  return (
                    <button
                      key={r.roundId}
                      className={`round-pill-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedRoundId(r.roundId)}
                    >
                      {r.isCompleted ? '🏆' : '⏳'} Round #{r.roundId}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRound ? (
            <div>
              {/* Panoramica del Round Selezionato */}
              <div className="round-overview-grid">
                <div className={`overview-box ${selectedRound.isCompleted ? 'highlight' : ''}`}>
                  <div className="overview-title">
                    {selectedRound.isCompleted ? '🏆 Vincitore Estratto' : '⏳ Stato Round'}
                  </div>
                  <div className="overview-value" style={{ fontSize: '1.15rem' }}>
                    {selectedRound.isCompleted ? (
                      <span>
                        {shortAddr(selectedRound.winner)}{' '}
                        {account && selectedRound.winner?.toLowerCase() === account.toLowerCase() && (
                          <span style={{ color: '#10b981', fontSize: '0.85rem' }}>(Tu!)</span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#fbbf24' }}>In Corso (Non ancora estratto)</span>
                    )}
                  </div>
                  <div className="overview-sub">
                    {selectedRound.isCompleted
                      ? `Estratto il: ${formatTimestamp(selectedRound.winnerTimestamp)}`
                      : 'Estrazione in attesa di pickWinner()'}
                  </div>
                </div>

                <div className="overview-box">
                  <div className="overview-title">💰 Montepremi Round</div>
                  <div className="overview-value" style={{ color: '#fbbf24' }}>
                    {fmt(selectedRound.prize, 2)} NAO
                  </div>
                  <div className="overview-sub">
                    {selectedRound.isCompleted ? 'Accreditato al vincitore' : 'Montepremi provvisorio'}
                  </div>
                </div>

                <div className="overview-box">
                  <div className="overview-title">🎟️ Biglietti Venduti</div>
                  <div className="overview-value">{selectedRound.tickets.length}</div>
                  <div className="overview-sub">
                    Partecipanti unici: {new Set(selectedRound.tickets.map((t) => t.player.toLowerCase())).size}
                  </div>
                </div>
              </div>

              {/* Tabella Biglietti Venduti */}
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', marginTop: '10px' }}>
                🎟️ Elenco Biglietti Acquistati (Round #{selectedRound.roundId})
              </h3>

              {selectedRound.tickets.length === 0 ? (
                <div className="empty-history-box">
                  Nessun biglietto registrato per questo round.
                </div>
              ) : (
                <div className="tickets-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th># Biglietto</th>
                        <th>Giocatore</th>
                        <th>Data & Ora Acquisto (Timestamp)</th>
                        <th>Transazione On-Chain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRound.tickets.map((ticket, tIdx) => {
                        const isWinner =
                          selectedRound.isCompleted &&
                          selectedRound.winner?.toLowerCase() === ticket.player.toLowerCase();
                        const isMe = account && ticket.player.toLowerCase() === account.toLowerCase();

                        return (
                          <tr
                            key={tIdx}
                            className={`${isWinner ? 'is-winner-row' : ''} ${isMe ? 'is-user-row' : ''}`}
                          >
                            <td>
                              <strong>Biglietto #{tIdx + 1}</strong>
                              {isWinner && ' 👑 (Vincitore)'}
                            </td>
                            <td>
                              <span>{shortAddr(ticket.player)}</span>
                              {isMe && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#818cf8' }}>(Tu)</span>}
                            </td>
                            <td>{formatTimestamp(ticket.timestamp)}</td>
                            <td>
                              {ticket.txHash ? (
                                <span className="tx-link" title={ticket.txHash}>
                                  {ticket.txHash.slice(0, 10)}…{ticket.txHash.slice(-8)}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-dim)' }}>Blocco locale</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-history-box">
              Nessuna partita o estrazione ancora registrata sulla blockchain.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          BlockChainExamples • HardhatSolidity13LotteryChainlink • Made with ❤️ by{' '}
          <a href="https://www.alnao.it" target="_blank" rel="noreferrer">
            AlNao
          </a>
        </p>
      </footer>
    </div>
  );
}
