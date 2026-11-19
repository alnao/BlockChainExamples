/**
 * App.jsx — Frontend per Anchor01VotationsSolana
 *
 * Stack:
 *   - @solana/web3.js per la connessione al validator locale
 *   - @coral-xyz/anchor per interagire con il program
 *   - Phantom Wallet (window.solana) come wallet browser
 *
 * DIFFERENZE rispetto ai frontend Ethereum (Forge01, Vyper01):
 *   - Non usa MetaMask ma Phantom (o Backpack, Solflare)
 *   - Non usa ethers.js ma @solana/web3.js + @coral-xyz/anchor
 *   - Non c'è chainId — ci si connette a un RPC endpoint (localnet/devnet/mainnet)
 *   - Le transazioni includono TUTTI gli account che vengono toccati (accounts: {...})
 *   - I PDA (Program Derived Address) si calcolano lato client con findProgramAddressSync
 *   - Il balance è in SOL/lamports, non ETH/wei
 */

import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { PROGRAM_ID, RPC_URL } from './contracts/config.js';
import './App.css';

// ─── Helpers PDA ─────────────────────────────────────────────────────────────
const programId = new PublicKey(PROGRAM_ID);

// session_id (u64) serializzato little-endian, come `to_le_bytes()` in Rust
function u64LE(id) { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(id)); return b; }

function programStatePDA()         { return PublicKey.findProgramAddressSync([Buffer.from("program_state")], programId); }
function sessionPDA(id)            { return PublicKey.findProgramAddressSync([Buffer.from("session"), u64LE(id)], programId); }
function candidatePDA(id, pubkey)  { return PublicKey.findProgramAddressSync([Buffer.from("candidate"), u64LE(id), pubkey.toBuffer()], programId); }
function voteRecordPDA(id, pubkey) { return PublicKey.findProgramAddressSync([Buffer.from("vote"), u64LE(id), pubkey.toBuffer()], programId); }

// Filtro getProgramAccounts: CandidateAccount con session_id = id.
// Layout dell'account: [8 byte discriminator][session_id u64 LE]... → session_id sta all'offset 8.
// È l'equivalente Solana di "leggere un mapping": non esiste un elenco on-chain,
// si chiede al nodo tutti gli account del program che corrispondono al filtro.
function sessionFilter(id) {
  return [{ memcmp: { offset: 8, bytes: anchor.utils.bytes.bs58.encode(u64LE(id)) } }];
}

const STATE_LABELS = { inactive: 'Inattivo', registration: 'Registrazione', voting: 'Votazione', completed: 'Completato' };
function shortKey(pk) { const s = pk?.toBase58?.() || pk || ''; return `${s.slice(0,4)}…${s.slice(-4)}`; }
function lamportsToSol(n) { return (Number(n) / LAMPORTS_PER_SOL).toFixed(4); }
function solToLamports(s) { return new anchor.BN(Math.round(parseFloat(s) * LAMPORTS_PER_SOL)); }
function fmtDate(ts) { const n = Number(ts); return n > 0 ? new Date(n * 1000).toLocaleString('it-IT') : '—'; }
const sessionStateKey = (s) => Object.keys(s.state)[0];

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [wallet, setWallet]       = useState(null);  // PublicKey
  const [provider, setProvider]   = useState(null);  // anchor.AnchorProvider
  const [program, setProgram]     = useState(null);  // anchor.Program
  const [balance, setBalance]     = useState(null);  // SOL balance

  const [programState, setProgramState] = useState(null);
  const [session, setSession]           = useState(null);
  const [candidates, setCandidates]     = useState([]);   // [{ publicKey: PDA, account }] ordinati per voti
  const [myVote, setMyVote]             = useState(null); // VoteRecord dell'utente nella sessione corrente
  const [pastSessions, setPast]         = useState([]);   // [{ publicKey, account }] sessioni Completed
  const [funds, setFunds]               = useState(null); // { lamports, rent } dell'account sessione corrente

  const [status, setStatus]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState('current');
  const [idl, setIdl]         = useState(null);

  const [fTitle, setFTitle]       = useState('');
  const [fDesc, setFDesc]         = useState('');
  const [fRegFee, setFRegFee]     = useState('0.01');
  const [fVoteFee, setFVoteFee]   = useState('0.001');
  const [fMaxVotes, setFMaxVotes] = useState('3');
  const [fName, setFName]         = useState('');
  const [fProposal, setFProposal] = useState('');
  const [fWithdraw, setFWithdraw] = useState('');

  // Carica IDL generato da `anchor build`
  useEffect(() => {
    import('./contracts/voting.json').then(m => setIdl(m.default)).catch(() => {
      console.warn("IDL non trovato. Esegui anchor build e copia target/idl/voting.json in app/src/contracts/");
    });
  }, []);

  // Crea provider + program per il wallet `pk`.
  // Phantom firma (signTransaction), ma la tx viene inviata dal frontend al validator locale (RPC_URL).
  const setupWallet = useCallback((pk) => {
    setWallet(pk);
    const connection = new Connection(RPC_URL, "confirmed");
    const walletAdapter = {
      publicKey:   pk,
      signTransaction:    (tx) => window.solana.signTransaction(tx),
      signAllTransactions:(txs) => window.solana.signAllTransactions(txs),
    };
    const prov = new anchor.AnchorProvider(connection, walletAdapter, { commitment: "confirmed" });
    setProvider(prov);
    setProgram(idl ? new anchor.Program(idl, prov) : null);
  }, [idl]);

  // Connetti Phantom
  const connectWallet = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      setError("Phantom Wallet non trovato. Installa Phantom da phantom.app.");
      return;
    }
    try {
      await window.solana.connect();
      setupWallet(window.solana.publicKey);
    } catch (e) { setError(String(e)); }
  }, [setupWallet]);

  // Cambio account in Phantom (utile per provare con più wallet: admin, candidati, votanti)
  useEffect(() => {
    const sol = window.solana;
    if (!sol?.on || !wallet) return;
    const onChange = (pk) => {
      if (pk) setupWallet(pk);
      else sol.connect().then(() => setupWallet(sol.publicKey)).catch(() => {});
    };
    sol.on('accountChanged', onChange);
    return () => sol.removeListener?.('accountChanged', onChange);
  }, [wallet, setupWallet]);

  useEffect(() => {
    if (provider && idl && !program) {
      setProgram(new anchor.Program(idl, provider));
    }
  }, [provider, idl, program]);

  // Refresh dati
  const refresh = useCallback(async () => {
    if (!program || !wallet) return;
    try {
      // Balance SOL
      const bal = await provider.connection.getBalance(wallet);
      setBalance(bal);

      // ProgramState
      const [psPDA] = programStatePDA();
      let ps;
      try { ps = await program.account.programState.fetch(psPDA); setProgramState(ps); }
      catch { setProgramState(null); return; }

      const sid = ps.currentSessionId?.toNumber?.() ?? 0;

      if (sid > 0) {
        // Sessione corrente (o l'ultima, se già completata: current_session_id resta impostato)
        const [sPDA] = sessionPDA(sid);
        setSession(await program.account.votingSession.fetch(sPDA));

        // Candidati della sessione: getProgramAccounts con filtro memcmp su session_id
        const cands = await program.account.candidateAccount.all(sessionFilter(sid));
        cands.sort((a, b) => b.account.voteCount.cmp(a.account.voteCount));
        setCandidates(cands);

        // VoteRecord dell'utente: se l'account esiste, ha già votato
        const [vrPDA] = voteRecordPDA(sid, wallet);
        setMyVote(await program.account.voteRecord.fetchNullable(vrPDA));

        // Fondi sull'account sessione (fee incassate) e minimo per il rent
        const info = await provider.connection.getAccountInfo(sPDA);
        const rent = await provider.connection.getMinimumBalanceForRentExemption(info.data.length);
        setFunds({ lamports: info.lamports, rent });
      } else {
        setSession(null); setCandidates([]); setMyVote(null); setFunds(null);
      }

      // Storico: tutte le VotingSession in stato Completed, dalla più recente
      const all = await program.account.votingSession.all();
      setPast(all
        .filter(s => sessionStateKey(s.account) === 'completed')
        .sort((a, b) => b.account.id.cmp(a.account.id)));
    } catch (e) { console.error('refresh error:', e); }
  }, [program, wallet, provider]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 6000);
    return () => clearInterval(iv);
  }, [refresh]);

  // TX helper
  async function runTx(label, fn) {
    setLoading(true); setError(''); setStatus(`⏳ ${label}...`);
    try {
      const sig = await fn();
      setStatus(`✅ ${label} completato! Sig: ${sig?.slice(0,12)}...`);
      await refresh();
    } catch (e) {
      setError(`❌ ${label}: ${e?.message || String(e)}`); setStatus('');
    } finally { setLoading(false); }
  }

  const isAdmin = programState && wallet &&
    programState.admin.toBase58() === wallet.toBase58();
  const stateKey = programState ? Object.keys(programState.currentState)[0] : 'inactive';
  const amCandidate = wallet && candidates.some(c => c.account.authority.equals(wallet));

  // Lista candidati: in votazione mostra voti, barra di avanzamento e pulsante "Vota"
  const renderCandidates = (withVote) => {
    const maxV = session?.maxVotes?.toNumber?.() || 0;
    return (
      <div className="cand-list">
        {candidates.map(c => {
          const votes     = c.account.voteCount.toNumber();
          const isMe      = c.account.authority.equals(wallet);
          const votedThis = myVote && myVote.candidate.equals(c.account.authority);
          return (
            <div key={c.publicKey.toBase58()} className={`cand-item ${votedThis ? 'voted' : ''}`}>
              <div className="cand-main">
                <div className="cand-name">
                  {c.account.name}
                  {isMe      && <span className="tag">tu</span>}
                  {votedThis && <span className="tag tag-ok">tuo voto</span>}
                </div>
                <div className="cand-proposal">{c.account.proposal}</div>
                <div className="cand-key mono" title={`PDA: ${c.publicKey.toBase58()}`}>{shortKey(c.account.authority)}</div>
              </div>
              {withVote && (
                <div className="cand-side">
                  <div className="cand-votes"><strong>{votes}</strong> / {maxV} voti</div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${maxV ? Math.min(100, votes / maxV * 100) : 0}%` }} /></div>
                  <button className="btn btn-primary btn-sm" disabled={loading || !!myVote} onClick={() => handleVote(c)}>
                    Vota ({lamportsToSol(session.votingFee)} SOL)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Riepilogo di una sessione conclusa (annullata = nessun vincitore impostato)
  const renderResult = (s) => {
    const cancelled = s.winner.equals(PublicKey.default);
    return (
      <div className="result">
        <div className="result-head">
          <strong>#{s.id.toString()} — {s.title}</strong>
          <span className={`state-badge ${cancelled ? 'state-inactive' : 'state-completed'}`}>{cancelled ? 'Annullata' : 'Completata'}</span>
        </div>
        <p className="session-desc">{s.description}</p>
        {cancelled
          ? <p className="text-muted">Sessione annullata dall'admin: nessun vincitore.</p>
          : <p className="result-winner">🏆 Vincitore: <strong>{s.winnerName}</strong> <span className="mono text-muted">({shortKey(s.winner)})</span></p>}
        <div className="fees">
          <span>Voti totali: <strong>{s.totalVotes.toString()}</strong></span>
          <span>Candidati: <strong>{s.candidateCount}</strong></span>
          <span>Chiusa il: <strong>{fmtDate(s.endTimestamp)}</strong></span>
        </div>
      </div>
    );
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInitProgram = () => runTx('Inizializza program', async () => {
    const [psPDA] = programStatePDA();
    return program.methods.initializeProgram()
      .accounts({ programState: psPDA, authority: wallet, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();
  });

  const handleCreateSession = (e) => {
    e.preventDefault();
    const nextId = (programState?.sessionCounter?.toNumber() ?? 0) + 1;
    const [sPDA] = sessionPDA(nextId);
    runTx('Crea sessione', () =>
      program.methods.createVotingSession(
        fTitle, fDesc,
        solToLamports(fRegFee),
        solToLamports(fVoteFee)
      )
      .accounts({
        programState: programStatePDA()[0],
        votingSession: sPDA,
        authority: wallet,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()
    );
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const sid = programState.currentSessionId.toNumber();
    const [sPDA]    = sessionPDA(sid);
    const [candPDA] = candidatePDA(sid, wallet);
    runTx('Registra candidatura', () =>
      program.methods.registerCandidate(fName, fProposal)
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sPDA,
          candidateAccount: candPDA,
          candidateSigner: wallet,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
    );
  };

  const handleCloseReg = (e) => {
    e.preventDefault();
    const sid  = programState.currentSessionId.toNumber();
    const [sPDA] = sessionPDA(sid);
    runTx('Avvia votazione', () =>
      program.methods.closeRegistrationAndStartVoting(new anchor.BN(parseInt(fMaxVotes)))
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sPDA,
          authority: wallet,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
    );
  };

  // Voto: crea il VoteRecord PDA [b"vote", session_id, voter] — se esiste già la tx fallisce
  const handleVote = (cand) => {
    const sid = programState.currentSessionId.toNumber();
    runTx(`Voto per ${cand.account.name}`, () =>
      program.methods.vote()
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sessionPDA(sid)[0],
          candidateAccount: cand.publicKey,
          voteRecord: voteRecordPDA(sid, wallet)[0],
          voter: wallet,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
    );
  };

  // Fine votazione manuale: il program non può iterare sui candidati,
  // quindi il client passa il CandidateAccount con più voti (candidates è già ordinato)
  const handleEndVoting = () => {
    const winner = candidates[0];
    if (!winner) return;
    if (!window.confirm(`Terminare la votazione? Vincitore: ${winner.account.name} (${winner.account.voteCount} voti)`)) return;
    const sid = programState.currentSessionId.toNumber();
    runTx('Termina votazione', () =>
      program.methods.endVoting()
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sessionPDA(sid)[0],
          winnerCandidate: winner.publicKey,
          authority: wallet,
        })
        .rpc()
    );
  };

  const handleCancel = () => {
    if (!window.confirm('Annullare la sessione senza vincitore?')) return;
    const sid = programState.currentSessionId.toNumber();
    runTx('Annulla sessione', () =>
      program.methods.cancelVoting()
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sessionPDA(sid)[0],
          authority: wallet,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
    );
  };

  // Lamports prelevabili = saldo dell'account sessione − minimo per il rent
  // (sotto il minimo il runtime rifiuta la tx: l'account non sarebbe più rent-exempt)
  const withdrawable = funds ? Math.max(0, funds.lamports - funds.rent) : 0;

  const handleWithdraw = (e) => {
    e.preventDefault();
    // vuoto = preleva tutto; confronto con Number (i lamports stanno ampiamente sotto 2^53)
    const lamports = fWithdraw ? Math.round(parseFloat(fWithdraw) * LAMPORTS_PER_SOL) : withdrawable;
    if (!(lamports > 0) || lamports > withdrawable) {
      setError(`❌ Importo non valido: massimo ${lamportsToSol(withdrawable)} SOL`);
      return;
    }
    const sid = programState.currentSessionId.toNumber();
    runTx('Preleva fondi', () =>
      program.methods.withdrawFunds(new anchor.BN(lamports))
        .accounts({
          programState: programStatePDA()[0],
          votingSession: sessionPDA(sid)[0],
          authority: wallet,
        })
        .rpc()
    ).then(() => setFWithdraw(''));
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  if (!wallet) {
    return (
      <div className="connect-screen">
        <div className="connect-card">
          <div className="logo">🦀</div>
          <h1>Anchor Voting — Solana</h1>
          <p>Sistema di votazione su <strong>Solana</strong> con Rust + Anchor.<br/>
             Usa account PDA invece di storage interno, lamports invece di ETH.</p>
          {!idl && (
            <div className="warn-box">
              ⚠️ IDL non trovato. Esegui <code>anchor build</code> e copia<br/>
              <code>target/idl/voting.json</code> in <code>app/src/contracts/</code>
            </div>
          )}
          <button className="btn btn-primary btn-lg" onClick={connectWallet} disabled={!idl}>
            Connetti Phantom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="brand-icon">🦀</span>
          <span className="brand-name">Anchor Voting — Solana</span>
          <span className="badge-anchor">Anchor 0.30</span>
        </div>
        <div className="header-info">
          <span className={`state-badge state-${stateKey}`}>{STATE_LABELS[stateKey]}</span>
          <span className="chip sol">{balance !== null ? lamportsToSol(balance) : '...'} SOL</span>
          <span className="account-badge">{shortKey(wallet)}</span>
          {isAdmin && <span className="admin-badge">Admin</span>}
        </div>
      </header>

      {status && <div className="status-bar">{status}</div>}
      {error  && <div className="error-bar">{error} <button onClick={() => setError('')}>✕</button></div>}

      <nav className="tabs">
        <button className={`tab ${tab==='current'?'active':''}`} onClick={()=>setTab('current')}>Votazione</button>
        <button className={`tab ${tab==='past'?'active':''}`} onClick={()=>setTab('past')}>Storico</button>
        {isAdmin && <button className={`tab ${tab==='admin'?'active':''}`} onClick={()=>setTab('admin')}>Admin</button>}
        <button className={`tab ${tab==='info'?'active':''}`} onClick={()=>setTab('info')}>Info Solana</button>
      </nav>

      <main className="main">

        {/* ── Init ── */}
        {!programState && (
          <div className="card warn-card">
            <h3>Program non inizializzato</h3>
            <p>Il ProgramState non esiste ancora. Clicca per inizializzare (solo la prima volta).</p>
            <button className="btn btn-primary" onClick={handleInitProgram} disabled={loading}>
              Inizializza Program
            </button>
          </div>
        )}

        {/* ── Tab: Votazione ── */}
        {tab === 'current' && programState && (
          <section>
            {stateKey === 'inactive' && (
              <>
                <div className="empty-state">
                  <p>🦀 Nessuna votazione attiva.</p>
                  {isAdmin && <p>Vai su <strong>Admin</strong> per creare una sessione.</p>}
                </div>
                {session && sessionStateKey(session) === 'completed' && (
                  <div className="card">
                    <h3>Ultima votazione</h3>
                    {renderResult(session)}
                  </div>
                )}
              </>
            )}

            {stateKey === 'registration' && session && (
              <div>
                <div className="session-card">
                  <h2>#{session.id.toString()} — {session.title}</h2>
                  <p className="session-desc">{session.description}</p>
                  <div className="fees">
                    <span>Fee candidatura: <strong>{lamportsToSol(session.registrationFee)} SOL</strong></span>
                    <span>Fee voto: <strong>{lamportsToSol(session.votingFee)} SOL</strong></span>
                    <span>Candidati: <strong>{session.candidateCount}</strong></span>
                  </div>
                </div>

                <div className="card">
                  <h3>Candidati registrati</h3>
                  {candidates.length === 0
                    ? <p className="text-muted">Nessun candidato ancora. Ne servono almeno 2 per avviare la votazione.</p>
                    : renderCandidates(false)}
                </div>

                {amCandidate
                  ? <div className="card"><p>✅ Sei registrato come candidato in questa sessione.</p></div>
                  : (
                    <div className="card">
                      <h3>Candidati come {shortKey(wallet)}</h3>
                      <form className="form-col" onSubmit={handleRegister}>
                        <input placeholder="Il tuo nome" maxLength={64} value={fName} onChange={e=>setFName(e.target.value)} required />
                        <textarea placeholder="La tua proposta" maxLength={256} value={fProposal} onChange={e=>setFProposal(e.target.value)} rows={3} required />
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                          Candidati ({lamportsToSol(session.registrationFee)} SOL)
                        </button>
                      </form>
                    </div>
                  )}
              </div>
            )}

            {stateKey === 'voting' && session && (
              <div>
                <div className="session-card">
                  <h2>#{session.id.toString()} — {session.title}</h2>
                  <p className="session-desc">{session.description}</p>
                  <div className="fees">
                    <span>Fee voto: <strong>{lamportsToSol(session.votingFee)} SOL</strong></span>
                    <span>Voti per vincere: <strong>{session.maxVotes?.toString()}</strong></span>
                    <span>Voti totali: <strong>{session.totalVotes?.toString()}</strong></span>
                  </div>
                </div>

                <div className="card">
                  <h3>Candidati</h3>
                  {myVote
                    ? <p className="form-hint">✅ Hai già votato in questa sessione (VoteRecord PDA presente on-chain).</p>
                    : <p className="form-hint">Un solo voto per wallet: il voto crea il tuo VoteRecord PDA. Il primo candidato che raggiunge {session.maxVotes?.toString()} voti vince automaticamente.</p>}
                  {renderCandidates(true)}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Storico ── */}
        {tab === 'past' && (
          <section>
            <div className="section-header"><h2>Sessioni Passate</h2></div>
            {pastSessions.length === 0
              ? <div className="empty-state"><p>Nessuna sessione conclusa.</p></div>
              : pastSessions.map(s => (
                  <div className="card" key={s.publicKey.toBase58()}>{renderResult(s.account)}</div>
                ))}
            <p className="text-muted">
              Le sessioni sono lette con <code>program.account.votingSession.all()</code> (getProgramAccounts
              filtrato sul discriminator dell'account), poi filtrate per stato <code>Completed</code>.
            </p>
          </section>
        )}

        {/* ── Tab: Admin ── */}
        {tab === 'admin' && isAdmin && programState && (
          <section>
            <div className="section-header"><h2>Admin</h2></div>
            {stateKey === 'inactive' && (
              <div className="card">
                <h3>Crea sessione di votazione</h3>
                <form className="form-col" onSubmit={handleCreateSession}>
                  <input placeholder="Titolo" maxLength={64} value={fTitle} onChange={e=>setFTitle(e.target.value)} required />
                  <textarea placeholder="Descrizione" maxLength={256} value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={3} required />
                  <div className="form-row">
                    <div className="form-col-half">
                      <label>Fee candidatura (SOL)</label>
                      <input type="number" step="0.001" min="0" value={fRegFee} onChange={e=>setFRegFee(e.target.value)} required />
                    </div>
                    <div className="form-col-half">
                      <label>Fee voto (SOL)</label>
                      <input type="number" step="0.0001" min="0" value={fVoteFee} onChange={e=>setFVoteFee(e.target.value)} required />
                    </div>
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={loading}>Crea</button>
                </form>
              </div>
            )}

            {stateKey === 'registration' && (
              <div className="card">
                <h3>Avvia votazione</h3>
                <p className="form-hint">Candidati: {session?.candidateCount ?? 0} (min 2)</p>
                <form className="form-row" onSubmit={handleCloseReg}>
                  <input type="number" placeholder="Voti per vincere" value={fMaxVotes}
                    onChange={e=>setFMaxVotes(e.target.value)} min="1" required />
                  <button className="btn btn-primary" type="submit"
                    disabled={loading || (session?.candidateCount ?? 0) < 2}>Avvia</button>
                </form>
              </div>
            )}

            {stateKey === 'voting' && (
              <div className="card">
                <h3>Termina votazione</h3>
                <p className="form-hint">
                  Il program non può scorrere i candidati: il frontend passa il CandidateAccount con più voti
                  {candidates[0] && <> — ora <strong>{candidates[0].account.name}</strong> con {candidates[0].account.voteCount.toString()} voti</>}.
                  A parità di voti vince il primo in elenco.
                </p>
                <button className="btn btn-primary" onClick={handleEndVoting} disabled={loading || candidates.length === 0}>
                  Termina e proclama vincitore
                </button>
              </div>
            )}

            {(stateKey === 'registration' || stateKey === 'voting') && (
              <div className="card">
                <h3>Annulla sessione</h3>
                <p className="form-hint">Chiude la sessione senza vincitore. Le fee restano sull'account sessione (prelevabili sotto).</p>
                <button className="btn btn-danger" onClick={handleCancel} disabled={loading}>Annulla sessione</button>
              </div>
            )}

            {session && funds && (
              <div className="card">
                <h3>Fondi sessione #{session.id.toString()}</h3>
                <div className="fees">
                  <span>Saldo account: <strong>{lamportsToSol(funds.lamports)} SOL</strong></span>
                  <span>Minimo rent (bloccato): <strong>{lamportsToSol(funds.rent)} SOL</strong></span>
                  <span>Prelevabile: <strong>{lamportsToSol(withdrawable)} SOL</strong></span>
                </div>
                <form className="form-row withdraw-form" onSubmit={handleWithdraw}>
                  <input type="number" step="0.0001" min="0" placeholder="SOL (vuoto = tutto)"
                    value={fWithdraw} onChange={e=>setFWithdraw(e.target.value)} />
                  <button className="btn btn-primary" type="submit" disabled={loading || withdrawable <= 0}>Preleva</button>
                </form>
                <p className="form-hint">
                  withdraw_funds agisce solo sulla sessione corrente: preleva le fee prima di crearne una nuova.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Info Solana ── */}
        {tab === 'info' && (
          <section>
            <div className="section-header"><h2>Informazioni Solana / Anchor</h2></div>
            <div className="card info-grid">
              <div className="info-item">
                <div className="info-label">Program ID</div>
                <div className="info-value mono">{PROGRAM_ID}</div>
              </div>
              <div className="info-item">
                <div className="info-label">RPC Endpoint</div>
                <div className="info-value mono">{RPC_URL}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Wallet</div>
                <div className="info-value mono">{wallet?.toBase58()}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Balance</div>
                <div className="info-value">{balance !== null ? `${lamportsToSol(balance)} SOL` : '...'}</div>
              </div>
              {programState && (
                <>
                  <div className="info-item">
                    <div className="info-label">Admin</div>
                    <div className="info-value mono">{programState.admin?.toBase58()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Session Counter</div>
                    <div className="info-value">{programState.sessionCounter?.toString()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">ProgramState PDA</div>
                    <div className="info-value mono">{programStatePDA()[0].toBase58()}</div>
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h3>Come funzionano i PDA</h3>
              <p className="text-muted">
                I Program Derived Address (PDA) sono indirizzi deterministici calcolati da:<br/>
                <code>PDA = hash(seeds + program_id)</code><br/><br/>
                In questo program:<br/>
                • <code>ProgramState</code>: seeds = [b"program_state"]<br/>
                • <code>VotingSession N</code>: seeds = [b"session", N as u64 LE]<br/>
                • <code>Candidate C in session N</code>: seeds = [b"candidate", N, C.pubkey]<br/>
                • <code>VoteRecord di voter V in session N</code>: seeds = [b"vote", N, V.pubkey]<br/><br/>
                Il VoteRecord è il meccanismo anti-doppio voto: Anchor restituisce errore
                se si tenta di creare un account già esistente.
              </p>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
