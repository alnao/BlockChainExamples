// src/components/AdminPanel.jsx
// Pannello admin — crea sessione, avvia votazione, termina, preleva fondi
import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { VotingState } from '../contractConfig';
import './AdminPanel.css';

const AdminPanel = ({ contractAddress, contractAbi, votingState, onSuccess }) => {
  // Stato form creazione votazione
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [regFeeEth, setRegFeeEth] = useState('0.1');
  const [voteFeeEth, setVoteFeeEth] = useState('0.01');

  // Stato form avvio votazione
  const [maxVotes, setMaxVotes] = useState('5');

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  React.useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
      reset();
      setTitle('');
      setDescription('');
    }
  }, [isSuccess, onSuccess, reset]);

  const isBusy = isPending || isConfirming;

  const handleCreateVoting = (e) => {
    e.preventDefault();
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'createVotingSession',
      args: [title, description, parseEther(regFeeEth), parseEther(voteFeeEth)],
    });
  };

  const handleStartVoting = (e) => {
    e.preventDefault();
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'closeRegistrationAndStartVoting',
      args: [BigInt(maxVotes)],
    });
  };

  const handleEndVoting = () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'endVoting',
    });
  };

  const handleCancelVoting = () => {
    if (window.confirm('Sei sicuro di voler cancellare la votazione?')) {
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'cancelVoting',
      });
    }
  };

  return (
    <div className="admin-panel">
      <h3>⚙️ Pannello Amministratore</h3>

      {writeError && (
        <p className="error-message">
          Errore: {writeError.shortMessage ?? writeError.message}
        </p>
      )}
      {isBusy && (
        <p className="tx-status">
          {isPending ? 'In attesa di conferma MetaMask...' : 'Transazione in corso...'}
        </p>
      )}

      {/* Crea nuova votazione (solo quando inattivo) */}
      {votingState === VotingState.Inactive && (
        <form className="admin-form" onSubmit={handleCreateVoting}>
          <h4>Crea nuova sessione di votazione</h4>
          <div className="form-group">
            <label>Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Elezioni comunali 2025"
              required
              disabled={isBusy}
            />
          </div>
          <div className="form-group">
            <label>Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrizione della votazione..."
              required
              disabled={isBusy}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Commissione candidatura (NAO)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={regFeeEth}
                onChange={(e) => setRegFeeEth(e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="form-group">
              <label>Commissione voto (NAO)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={voteFeeEth}
                onChange={(e) => setVoteFeeEth(e.target.value)}
                disabled={isBusy}
              />
            </div>
          </div>
          <button type="submit" className="button primary" disabled={isBusy}>
            Crea votazione
          </button>
        </form>
      )}

      {/* Avvia votazione (fase registrazione) */}
      {votingState === VotingState.Registration && (
        <form className="admin-form" onSubmit={handleStartVoting}>
          <h4>Avvia fase di votazione</h4>
          <div className="form-group">
            <label>Voti massimi per vincere (M)</label>
            <input
              type="number"
              min="1"
              value={maxVotes}
              onChange={(e) => setMaxVotes(e.target.value)}
              disabled={isBusy}
            />
          </div>
          <div className="admin-actions">
            <button type="submit" className="button primary" disabled={isBusy}>
              Avvia votazione
            </button>
            <button
              type="button"
              className="button danger"
              onClick={handleCancelVoting}
              disabled={isBusy}
            >
              Cancella sessione
            </button>
          </div>
        </form>
      )}

      {/* Termina votazione (fase voto) */}
      {votingState === VotingState.Voting && (
        <div className="admin-form">
          <h4>Gestione votazione in corso</h4>
          <div className="admin-actions">
            <button className="button primary" onClick={handleEndVoting} disabled={isBusy}>
              Termina votazione
            </button>
            <button
              className="button danger"
              onClick={handleCancelVoting}
              disabled={isBusy}
            >
              Cancella votazione
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
