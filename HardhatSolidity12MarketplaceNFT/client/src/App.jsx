import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  TOKEN_ADDRESS,
  NFT_ADDRESS,
  MARKETPLACE_ADDRESS,
  CHAIN_ID,
} from './contracts/config.js';
import TOKEN_ABI       from './contracts/token_abi.json';
import NFT_ABI         from './contracts/nft_abi.json';
import MARKETPLACE_ABI from './contracts/marketplace_abi.json';
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

// Tab principali
const TABS = ['Marketplace', 'I Miei NFT', 'Mint Pubblico', 'Admin'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

function fmt(wei) {
  return parseFloat(ethers.formatEther(wei)).toFixed(4);
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

  // --- contracts ---
  const [token, setToken]           = useState(null);
  const [nft, setNft]               = useState(null);
  const [market, setMarket]         = useState(null);

  // --- balances ---
  const [naoBalance, setNaoBalance] = useState('0');
  const [ethBalance, setEthBalance] = useState('0');

  // --- data ---
  const [myNfts, setMyNfts]         = useState([]);       // NFT di proprietà
  const [listings, setListings]     = useState([]);       // listing attivi
  const [feeBps, setFeeBps]         = useState(0n);

  // --- ui ---
  const [activeTab, setActiveTab]   = useState(TABS[0]);
  const [status, setStatus]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // --- form fields ---
  const [listTokenId, setListTokenId]   = useState('');
  const [listPrice, setListPrice]       = useState('');
  const [mintUri, setMintUri]           = useState('');
  const [pubMintUri, setPubMintUri]     = useState('');
  const [pubMintPrice, setPubMintPrice] = useState('0');
  const [newFee, setNewFee]             = useState('');
  const [withdrawTo, setWithdrawTo]     = useState('');

  // ───────────────────────────────────────────────────────────
  // Wallet connect / events
  // ───────────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask non trovato. Installa MetaMask per continuare.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await setupProvider();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const setupProvider = useCallback(async () => {
    const prov = new ethers.BrowserProvider(window.ethereum);
    const net  = await prov.getNetwork();
    const ok   = net.chainId.toString() === CHAIN_ID;
    setProvider(prov);
    setChainOk(ok);

    const accounts = await prov.listAccounts();
    if (accounts.length === 0) { setAccount(null); return; }

    const sgn = await prov.getSigner();
    setAccount(await sgn.getAddress());
    setSigner(sgn);

    if (ok) {
      setToken(new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, sgn));
      setNft(new ethers.Contract(NFT_ADDRESS, NFT_ABI, sgn));
      setMarket(new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, sgn));
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

  // ───────────────────────────────────────────────────────────
  // Data refresh
  // ───────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!account || !token || !nft || !market || !provider) return;
    try {
      // Balances
      const nao = await token.balanceOf(account);
      const eth = await provider.getBalance(account);
      setNaoBalance(fmt(nao));
      setEthBalance(fmt(eth));

      // Fee marketplace
      const fee = await market.feeBps();
      setFeeBps(fee);

      // My NFTs: scansione trasferimenti Transfer(from=0, to=account)
      const totalSupply = await nft.totalSupply();
      const owned = [];
      for (let id = 0n; id < totalSupply; id++) {
        try {
          const owner = await nft.ownerOf(id);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const uri = await nft.tokenURI(id);
            const [, , active] = await market.getListing(NFT_ADDRESS, id);
            owned.push({ id, uri, listed: active });
          }
        } catch { /* token burned / non esiste */ }
      }
      setMyNfts(owned);

      // Active listings (tutti i tokenId da 0 a totalSupply)
      const active = [];
      for (let id = 0n; id < totalSupply; id++) {
        try {
          const [seller, price, isActive] = await market.getListing(NFT_ADDRESS, id);
          if (isActive) {
            const uri = await nft.tokenURI(id);
            const [royalty, feeAmt, sellerNet] = await market.getPaymentBreakdown(NFT_ADDRESS, id);
            active.push({ id, seller, price, uri, royalty, feeAmt, sellerNet });
          }
        } catch { /* skip */ }
      }
      setListings(active);

      // publicMintPrice per il form Mint Pubblico
      const pmp = await nft.publicMintPrice();
      setPubMintPrice(ethers.formatEther(pmp));

    } catch (e) {
      console.error('refreshData error:', e);
    }
  }, [account, token, nft, market, provider]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // ───────────────────────────────────────────────────────────
  // Transaction helper
  // ───────────────────────────────────────────────────────────
  async function runTx(label, fn) {
    setLoading(true);
    setError('');
    setStatus(`⏳ ${label}...`);
    try {
      const tx = await fn();
      setStatus(`⏳ ${label}: in attesa di conferma...`);
      await tx.wait();
      setStatus(`✅ ${label}: completato!`);
      await refreshData();
    } catch (e) {
      const msg = e?.reason || e?.message || String(e);
      setError(`❌ ${label}: ${msg}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  // Assicura allowance ERC20 prima di una transazione
  async function ensureAllowance(spender, amount) {
    const allowance = await token.allowance(account, spender);
    if (allowance < amount) {
      setStatus('⏳ Approvazione token ERC20...');
      const tx = await token.approve(spender, amount);
      await tx.wait();
    }
  }

  // ───────────────────────────────────────────────────────────
  // Handlers — My NFTs
  // ───────────────────────────────────────────────────────────
  async function handleList(e) {
    e.preventDefault();
    if (!listTokenId || !listPrice) return;
    const tokenId = BigInt(listTokenId);
    const price   = ethers.parseEther(listPrice);
    await runTx(`Lista NFT #${tokenId} a ${listPrice} NAO`, async () => {
      // Approva marketplace se non approvato
      const approved = await nft.getApproved(tokenId);
      if (approved.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
        setStatus('⏳ Approvazione NFT...');
        const appTx = await nft.approve(MARKETPLACE_ADDRESS, tokenId);
        await appTx.wait();
      }
      return market.listItem(NFT_ADDRESS, tokenId, price);
    });
    setListTokenId(''); setListPrice('');
  }

  async function handleCancelListing(tokenId) {
    await runTx(`Cancella listing NFT #${tokenId}`, () =>
      market.cancelListing(NFT_ADDRESS, tokenId)
    );
  }

  // ───────────────────────────────────────────────────────────
  // Handlers — Marketplace
  // ───────────────────────────────────────────────────────────
  async function handleBuy(tokenId, price) {
    await runTx(`Acquisto NFT #${tokenId}`, async () => {
      await ensureAllowance(MARKETPLACE_ADDRESS, price);
      return market.buyItem(NFT_ADDRESS, tokenId);
    });
  }

  // ───────────────────────────────────────────────────────────
  // Handlers — Mint Pubblico
  // ───────────────────────────────────────────────────────────
  async function handlePublicMint(e) {
    e.preventDefault();
    if (!pubMintUri) return;
    const price = ethers.parseEther(pubMintPrice);
    await runTx('Mint pubblico NFT', () =>
      nft.publicMint(pubMintUri, { value: price })
    );
    setPubMintUri('');
  }

  // ───────────────────────────────────────────────────────────
  // Handlers — Admin
  // ───────────────────────────────────────────────────────────
  async function handleMintToWallet(e) {
    e.preventDefault();
    if (!mintUri) return;
    await runTx('Mint NFT (owner)', () =>
      nft.mint(account, mintUri)
    );
    setMintUri('');
  }

  async function handleSetFee(e) {
    e.preventDefault();
    if (!newFee) return;
    await runTx(`Imposta fee a ${newFee} bps`, () =>
      market.setFee(BigInt(newFee))
    );
    setNewFee('');
  }

  async function handleWithdrawFees(e) {
    e.preventDefault();
    const to = withdrawTo || account;
    await runTx('Preleva fee marketplace', () =>
      market.withdrawFees(to)
    );
    setWithdrawTo('');
  }

  async function handlePause() {
    await runTx('Pausa marketplace', () => market.pause());
  }

  async function handleUnpause() {
    await runTx('Riprendi marketplace', () => market.unpause());
  }

  // ───────────────────────────────────────────────────────────
  // Render helpers
  // ───────────────────────────────────────────────────────────
  function NftCard({ item }) {
    const isOwner = item.seller
      ? item.seller.toLowerCase() === account?.toLowerCase()
      : true;
    const canBuy  = item.seller && !isOwner;
    return (
      <div className="nft-card">
        <div className="nft-id">NFT #{item.id.toString()}</div>
        <div className="nft-uri" title={item.uri}>{item.uri}</div>
        {item.seller && (
          <div className="nft-meta">
            <span className="label">Seller</span> {shortAddr(item.seller)}
          </div>
        )}
        {item.price !== undefined && (
          <div className="nft-price">
            <span className="price-tag">{fmt(item.price)} NAO</span>
            {item.royalty !== undefined && (
              <div className="breakdown">
                <span>Royalty: {fmt(item.royalty)} NAO</span>
                <span>Fee: {fmt(item.feeAmt)} NAO</span>
                <span>Seller net: {fmt(item.sellerNet)} NAO</span>
              </div>
            )}
          </div>
        )}
        {item.listed && (
          <button className="btn btn-secondary" onClick={() => handleCancelListing(item.id)}>
            Cancella Listing
          </button>
        )}
        {canBuy && (
          <button className="btn btn-primary" onClick={() => handleBuy(item.id, item.price)} disabled={loading}>
            Acquista
          </button>
        )}
        {isOwner && item.seller && (
          <span className="badge-mine">Il tuo listing</span>
        )}
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  // Layout
  // ───────────────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="connect-screen">
        <div className="connect-card">
          <div className="logo">🛒</div>
          <h1>NAO NFT Marketplace</h1>
          <p>Compra, vendi e minta NFT ERC721 con royalties ERC2981.<br />Pagamenti in token NAO.</p>
          <button className="btn btn-primary btn-lg" onClick={connectWallet}>
            Connetti MetaMask
          </button>
          {error && <p className="error-msg">{error}</p>}
        </div>
      </div>
    );
  }

  if (!chainOk) {
    return (
      <div className="connect-screen">
        <div className="connect-card">
          <div className="logo">⚠️</div>
          <h1>Rete non corretta</h1>
          <p>Connesso a una rete diversa da Hardhat Local (chainId {CHAIN_ID}).</p>
          <button className="btn btn-primary btn-lg" onClick={switchNetwork}>
            Cambia rete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-name">NAO NFT Marketplace</span>
        </div>
        <div className="header-info">
          <div className="balance-chips">
            <span className="chip eth">{ethBalance} ETH</span>
            <span className="chip nao">{naoBalance} NAO</span>
          </div>
          <div className="account-badge">{shortAddr(account)}</div>
        </div>
      </header>

      {/* ── Status / Error ── */}
      {status && <div className="status-bar">{status}</div>}
      {error  && <div className="error-bar">{error} <button onClick={() => setError('')}>✕</button></div>}

      {/* ── Tabs ── */}
      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="main">

        {/* ══════════════════════════════════════════════════════
            TAB: Marketplace
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'Marketplace' && (
          <section>
            <div className="section-header">
              <h2>Listing Attivi</h2>
              <span className="badge">{listings.length}</span>
              <span className="fee-info">Fee marketplace: {Number(feeBps) / 100}%</span>
            </div>
            {listings.length === 0 ? (
              <div className="empty-state">
                <p>Nessun NFT in vendita al momento.</p>
                <p>Vai su <strong>I Miei NFT</strong> per listare i tuoi.</p>
              </div>
            ) : (
              <div className="nft-grid">
                {listings.map(item => <NftCard key={item.id.toString()} item={item} />)}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: I Miei NFT
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'I Miei NFT' && (
          <section>
            <div className="section-header">
              <h2>I Miei NFT</h2>
              <span className="badge">{myNfts.length}</span>
            </div>

            {/* Form: lista un NFT */}
            <div className="card">
              <h3>Lista un NFT nel Marketplace</h3>
              <form className="form-row" onSubmit={handleList}>
                <input
                  type="number"
                  placeholder="Token ID"
                  value={listTokenId}
                  onChange={e => setListTokenId(e.target.value)}
                  min="0"
                  required
                />
                <input
                  type="number"
                  placeholder="Prezzo in NAO"
                  value={listPrice}
                  onChange={e => setListPrice(e.target.value)}
                  min="0"
                  step="0.1"
                  required
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  Lista NFT
                </button>
              </form>
              <p className="form-hint">
                Il marketplace approverà automaticamente il trasferimento dell'NFT.
              </p>
            </div>

            {myNfts.length === 0 ? (
              <div className="empty-state">
                <p>Non possiedi nessun NFT di questa collezione.</p>
                <p>Usa <strong>Mint Pubblico</strong> per ottenerne uno.</p>
              </div>
            ) : (
              <div className="nft-grid">
                {myNfts.map(item => <NftCard key={item.id.toString()} item={item} />)}
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: Mint Pubblico
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'Mint Pubblico' && (
          <section>
            <div className="section-header">
              <h2>Mint Pubblico</h2>
            </div>
            <div className="card">
              <h3>Minta un NFT</h3>
              <p className="form-hint">
                Prezzo corrente: <strong>{pubMintPrice} ETH</strong> per NFT.
                Il pagamento avviene in ETH nativo.
              </p>
              <form className="form-col" onSubmit={handlePublicMint}>
                <label>URI Metadati (IPFS o URL)</label>
                <input
                  type="text"
                  placeholder="ipfs://QmXxx... oppure https://..."
                  value={pubMintUri}
                  onChange={e => setPubMintUri(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit" disabled={loading || pubMintPrice === '0'}>
                  {pubMintPrice === '0' ? 'Mint pubblico disabilitato' : `Minta (${pubMintPrice} ETH)`}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB: Admin
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'Admin' && (
          <section>
            <div className="section-header">
              <h2>Pannello Admin</h2>
              <span className="form-hint">Solo owner di NFTCollection e Marketplace</span>
            </div>

            {/* Mint riservato owner */}
            <div className="card">
              <h3>Mint NFT (Owner)</h3>
              <p className="form-hint">Minta un NFT direttamente al tuo wallet, senza pagamento ETH.</p>
              <form className="form-col" onSubmit={handleMintToWallet}>
                <label>URI Metadati</label>
                <input
                  type="text"
                  placeholder="ipfs://QmXxx..."
                  value={mintUri}
                  onChange={e => setMintUri(e.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  Minta
                </button>
              </form>
            </div>

            {/* Fee marketplace */}
            <div className="card">
              <h3>Fee Marketplace</h3>
              <p className="form-hint">
                Fee attuale: <strong>{Number(feeBps) / 100}%</strong> ({feeBps.toString()} bps). Max 10% (1000 bps).
              </p>
              <form className="form-row" onSubmit={handleSetFee}>
                <input
                  type="number"
                  placeholder="Nuova fee in bps (es. 250 = 2.5%)"
                  value={newFee}
                  onChange={e => setNewFee(e.target.value)}
                  min="0"
                  max="1000"
                  required
                />
                <button className="btn btn-secondary" type="submit" disabled={loading}>
                  Aggiorna Fee
                </button>
              </form>
            </div>

            {/* Withdraw fee */}
            <div className="card">
              <h3>Preleva Fee Accumulate</h3>
              <p className="form-hint">Invia le fee accumulate dal marketplace a un indirizzo.</p>
              <form className="form-row" onSubmit={handleWithdrawFees}>
                <input
                  type="text"
                  placeholder={`Indirizzo (default: ${shortAddr(account)})`}
                  value={withdrawTo}
                  onChange={e => setWithdrawTo(e.target.value)}
                />
                <button className="btn btn-secondary" type="submit" disabled={loading}>
                  Preleva
                </button>
              </form>
            </div>

            {/* Pause / Unpause */}
            <div className="card">
              <h3>Pausa Marketplace</h3>
              <p className="form-hint">
                Quando in pausa, listItem, updateListingPrice e buyItem sono bloccati.
                cancelListing rimane disponibile.
              </p>
              <div className="btn-group">
                <button className="btn btn-danger" onClick={handlePause} disabled={loading}>
                  ⏸ Metti in Pausa
                </button>
                <button className="btn btn-success" onClick={handleUnpause} disabled={loading}>
                  ▶ Riprendi
                </button>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
