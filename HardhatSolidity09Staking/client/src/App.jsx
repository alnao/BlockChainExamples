import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

// ABIs incrementali (o importali dai JSON generati prima)
import stakingAbi from './contracts/staking_abi.json';
import tokenAbi from './contracts/token_abi.json';
import { TOKEN_ADDRESS, STAKING_ADDRESS } from './contracts/config';

function App() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);

  const [balance, setBalance] = useState('0');
  const [stakedBalance, setStakedBalance] = useState('0');
  const [rewards, setRewards] = useState('0');
  const [amountInput, setAmountInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask non rilevato! Installalo per continuare.');
        return;
      }
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      
      const _staking = new ethers.Contract(STAKING_ADDRESS, stakingAbi, _signer);
      const _token = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, _signer);
      
      setProvider(_provider);
      setSigner(_signer);
      setStakingContract(_staking);
      setTokenContract(_token);
      
      setError('');
    } catch (err) {
      console.error(err);
      setError('Errore connessione wallet: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambio account e rete in tempo reale
  useEffect(() => {
    if (window.ethereum) {
      const handleAccounts = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Re-inizializziamo provider e signer per il nuovo account
          const _provider = new ethers.BrowserProvider(window.ethereum);
          _provider.getSigner().then(_signer => {
            setSigner(_signer);
            setStakingContract(new ethers.Contract(STAKING_ADDRESS, stakingAbi, _signer));
            setTokenContract(new ethers.Contract(TOKEN_ADDRESS, tokenAbi, _signer));
          });
        } else {
          setAccount('');
          setSigner(null);
        }
      };

      const handleChain = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccounts);
      window.ethereum.on('chainChanged', handleChain);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccounts);
        window.ethereum.removeListener('chainChanged', handleChain);
      };
    }
  }, []);

  const updateBalances = useCallback(async () => {
    if (!account || !stakingContract || !tokenContract) return;

    try {
      // Verifica se l'indirizzo ha codice (debug per BAD_DATA 0x)
      const code = await provider.getCode(TOKEN_ADDRESS);
      if (code === "0x") {
        setError(`ERRORE: Nessun contratto trovato all'indirizzo ${TOKEN_ADDRESS}. Hai fatto il deploy sulla rete corretta?`);
        return;
      }

      const b = await tokenContract.balanceOf(account);
      const s = await stakingContract.stakedBalance(account);
      const r = await stakingContract.calculateReward(account);

      setBalance(ethers.formatEther(b));
      setStakedBalance(ethers.formatEther(s));
      setRewards(ethers.formatEther(r));
      setError(''); // Pulisci errori precedenti se ora funziona
    } catch (err) {
      console.error('Update failed:', err);
      if (err.code === 'BAD_DATA') {
        setError("Errore Decodifica: L'indirizzo fornito non sembra un contratto valido su questa rete.");
      }
    }
  }, [account, stakingContract, tokenContract]);

  useEffect(() => {
    if (account) {
      updateBalances();
      const interval = setInterval(updateBalances, 5000); // Aggiorna ogni 5 secondi
      return () => clearInterval(interval);
    }
  }, [account, updateBalances]);

  const handleStake = async () => {
    if (!amountInput) return;
    try {
      setLoading(true);
      setStatus('In attesa di approvazione token...');
      const amount = ethers.parseEther(amountInput);
      
      // Controlla allowance
      const allowance = await tokenContract.allowance(account, STAKING_ADDRESS);
      if (allowance < amount) {
        const txApprove = await tokenContract.approve(STAKING_ADDRESS, amount);
        await txApprove.wait();
      }
      
      setStatus('Esecuzione Stake...');
      const txStake = await stakingContract.stake(amount);
      await txStake.wait();
      
      setStatus('Stake completato con successo!');
      setAmountInput('');
      updateBalances();
    } catch (err) {
      console.error(err);
      setError('Stake fallito: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleWithdraw = async () => {
    if (!amountInput) return;
    try {
      setLoading(true);
      setStatus('Esecuzione Unstake...');
      const amount = ethers.parseEther(amountInput);
      const tx = await stakingContract.withdraw(amount);
      await tx.wait();
      
      setStatus('Unstake completato!');
      setAmountInput('');
      updateBalances();
    } catch (err) {
      console.error(err);
      setError('Unstake fallito: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleClaim = async () => {
    try {
      setLoading(true);
      setStatus('Riscossione premi...');
      const tx = await stakingContract.claimReward();
      await tx.wait();
      
      setStatus('Premi riscossi con successo!');
      updateBalances();
    } catch (err) {
      console.error(err);
      setError('Claim fallito: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleEmergencyWithdraw = async () => {
    try {
      setLoading(true);
      setStatus('Esecuzione Unstake d\'emergenza...');
      const tx = await stakingContract.emergencyWithdraw();
      await tx.wait();
      
      setStatus('Unstake d\'emergenza completato!');
      updateBalances();
    } catch (err) {
      console.error(err);
      setError('Unstake d\'emergenza fallito: ' + (err.reason || err.message));
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>💎 NAO Staking</h1>
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
        {error && <div className="error-msg">{error}</div>}
        {status && <div className="status-msg" style={{color: '#6366f1', marginBottom: '1rem', fontWeight: 600}}>{status}</div>}
        
        {!account ? (
          <div className="hero">
            <h2>Gestisci il tuo Yield Farming direttamente dal web.</h2>
            <p>Connetti il tuo account Hardhat o MetaMask per iniziare a mettere in stake i tuoi token NAO.</p>
          </div>
        ) : (
          <>
            <div className="dashboard">
              <div className="card">
                <h3>Wallet Balance</h3>
                <div className="value">
                  {parseFloat(balance).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  <span className="symbol">NAO</span>
                </div>
                <div className="detail">Disponibili nel wallet</div>
              </div>

              <div className="card">
                <h3>Staked Tokens</h3>
                <div className="value">
                  {parseFloat(stakedBalance).toLocaleString(undefined, {maximumFractionDigits: 2})}
                  <span className="symbol">NAO</span>
                </div>
                <div className="detail">Token bloccati in yield</div>
              </div>

              <div className="card">
                <h3>Rewards Earned</h3>
                <div className="value" style={{color: '#c084fc'}}>
                  {parseFloat(rewards).toLocaleString(undefined, {maximumFractionDigits: 6})}
                  <span className="symbol">NAO</span>
                </div>
                <div className="detail">Guadagno stimato accumulato</div>
              </div>
            </div>

            <div className="staking-actions">
              <div className="action-box">
                <div className="action-header">
                  <h2>Gestione Stake</h2>
                  <p style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>Inserisci l'importo per Depositare o Ritirare</p>
                </div>
                
                <div className="input-container">
                  <input 
                    type="number" 
                    placeholder="Esempio: 10" 
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                  <button className="action-btn" onClick={handleStake} disabled={loading || !amountInput}>
                    {loading && <span className="loading-spinner"></span>}
                    Stake
                  </button>
                  <button className="action-btn secondary-btn" onClick={handleWithdraw} disabled={loading || !amountInput}>
                    Unstake
                  </button>
                  <button className="action-btn secondary-btn" onClick={handleEmergencyWithdraw} disabled={loading || parseFloat(stakedBalance) <= 0} style={{backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444'}}>
                    Emergenza Unstake
                  </button>
                </div>
              </div>

              <div className="action-box">
                <div className="action-header">
                   <h2>Reward Farming</h2>
                   <p style={{color: 'var(--text-dim)', fontSize: '0.85rem'}}>Riscossa immediata dei premi maturati</p>
                </div>
                
                <div className="claim-content" style={{padding: '1rem 0'}}>
                   <div style={{marginBottom: '1rem'}}>
                      <span style={{fontSize: '0.9rem', color: 'var(--text-dim)'}}>Totale maturato:</span>
                      <div className="reward-amount" style={{fontSize: '1.5rem'}}>
                         {parseFloat(rewards).toFixed(6)} NAO
                      </div>
                   </div>
                   
                   <button className="action-btn" onClick={handleClaim} disabled={loading || parseFloat(rewards) <= 0}>
                     Claim Rewards
                   </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      <footer style={{marginTop: '4rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem'}}>
         <p>&copy; 2026 NAO Blockchain Staking Platform - AlNao</p>
      </footer>
    </div>
  );
}

export default App;
