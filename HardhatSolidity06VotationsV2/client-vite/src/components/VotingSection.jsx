// src/components/VotingSection.jsx
import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import './VotingSection.css';

// Recupera i dettagli di un singolo candidato
function useCandidateDetails(contractAddress, contractAbi, votingId, address) {
  return useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getCandidateDetails',
    args: [votingId, address],
  });
}

// Card di un candidato — legge i propri dati autonomamente
function CandidateVoteCard({ address, votingId, contractAddress, contractAbi, onSelect, disabled }) {
  const { data } = useCandidateDetails(contractAddress, contractAbi, votingId, address);
  if (!data) return null;
  const [name, proposal, voteCount] = data;

  return (
    <div
      className={`candidate-vote-card ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onSelect({ address, name, proposal, voteCount })}
    >
      <div className="candidate-info">
        <h4>{name}</h4>
        <p className="candidate-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
      <div className="candidate-proposal">
        <p>{proposal}</p>
      </div>
      <div className="vote-info">
        <div className="vote-count">{voteCount?.toString()} voti</div>
        {!disabled && <div className="vote-button">Vota</div>}
      </div>
    </div>
  );
}

// Card risultati (dopo aver votato)
function CandidateResultCard({ address, votingId, contractAddress, contractAbi, totalVotes }) {
  const { data } = useCandidateDetails(contractAddress, contractAbi, votingId, address);
  if (!data) return null;
  const [name, , voteCount] = data;
  const count = Number(voteCount ?? 0n);
  const total = Number(totalVotes ?? 0n);
  const perc = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="candidate-result-card">
      <div className="candidate-info">
        <h4>{name}</h4>
        <p className="candidate-address">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
      <div className="vote-info">
        <div className="vote-count">{count} voti</div>
        <div className="vote-percentage">{perc}%</div>
      </div>
      <div className="vote-bar-container">
        <div className="vote-bar" style={{ width: `${perc}%` }} />
      </div>
    </div>
  );
}

// ---- Componente principale -------------------------------------------------

const VotingSection = ({
  contractAddress,
  contractAbi,
  votingId,
  candidateAddresses,
  votingFee,
  userHasVoted,
  onSuccess,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Lettura totalVotes dalla sessione (per le barre percentuale)
  const { data: sessionDetails } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getVotingSessionDetails',
    args: [votingId],
  });

  React.useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
      setShowConfirmation(false);
      setSelectedCandidate(null);
      reset();
    }
  }, [isSuccess, onSuccess, reset]);

  const handleSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setShowConfirmation(true);
  };

  const confirmVote = () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'vote',
      args: [selectedCandidate.address],
      value: votingFee,
    });
  };

  const isBusy = isPending || isConfirming;

  // ---- Vista "hai già votato" con risultati parziali
  if (userHasVoted) {
    return (
      <div className="voting-section">
        <div className="already-voted-message">
          <h3>Hai già votato</h3>
          <p>Grazie per aver partecipato alla votazione.</p>
        </div>
        <div className="candidates-results">
          <h3>Risultati parziali</h3>
          {candidateAddresses.map((addr) => (
            <CandidateResultCard
              key={addr}
              address={addr}
              votingId={votingId}
              contractAddress={contractAddress}
              contractAbi={contractAbi}
              totalVotes={sessionDetails?.totalVotes}
            />
          ))}
        </div>
      </div>
    );
  }

  if (candidateAddresses.length === 0) {
    return (
      <div className="voting-section empty">
        <h3>Nessun candidato disponibile</h3>
      </div>
    );
  }

  return (
    <div className="voting-section">
      {!showConfirmation ? (
        <div className="candidates-list">
          <h3>Seleziona un candidato</h3>
          <p className="voting-instructions">
            Clicca su un candidato per votarlo. È richiesta una commissione di{' '}
            {(Number(votingFee) / 1e18).toFixed(4)} NAO.
          </p>
          {candidateAddresses.map((addr) => (
            <CandidateVoteCard
              key={addr}
              address={addr}
              votingId={votingId}
              contractAddress={contractAddress}
              contractAbi={contractAbi}
              onSelect={handleSelect}
              disabled={isBusy}
            />
          ))}
        </div>
      ) : (
        <div className="confirmation-dialog">
          <h4>Conferma voto</h4>
          {selectedCandidate && (
            <div className="confirmation-details">
              <p>Stai per votare per:</p>
              <h3>{selectedCandidate.name}</h3>
              <p className="candidate-address">
                {selectedCandidate.address.slice(0, 6)}...
                {selectedCandidate.address.slice(-4)}
              </p>
              <p className="candidate-proposal">{selectedCandidate.proposal}</p>
            </div>
          )}
          <p className="warning-message">
            Questa operazione richiede il pagamento di{' '}
            {(Number(votingFee) / 1e18).toFixed(4)} NAO e non può essere annullata.
          </p>

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

          <div className="confirmation-actions">
            <button className="button primary" onClick={confirmVote} disabled={isBusy}>
              Conferma voto
            </button>
            <button
              className="button secondary"
              onClick={() => { setShowConfirmation(false); reset(); }}
              disabled={isBusy}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingSection;
