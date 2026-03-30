import React, { useState } from 'react';
import Web3 from 'web3';
import './VotingSection.css';

const VotingSection = ({ candidates, onVote, userHasVoted, votingFee }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Ordinamento dei candidati per numero di voti (decrescente)
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  // Calcola la percentuale di voti per ciascun candidato
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);
  
  // Formatta l'indirizzo
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  // Gestione della selezione del candidato
  const handleCandidateSelect = (candidate) => {
    if (userHasVoted) return;
    setSelectedCandidate(candidate);
    setShowConfirmation(true);
  };

  // Conferma il voto
  const confirmVote = () => {
    if (selectedCandidate) {
      onVote(selectedCandidate.address);
      setShowConfirmation(false);
      setSelectedCandidate(null);
    }
  };

  // Annulla il voto
  const cancelVote = () => {
    setShowConfirmation(false);
    setSelectedCandidate(null);
  };

  // Se l'utente ha già votato
  if (userHasVoted) {
    return (
      <div className="voting-section">
        <div className="already-voted-message">
          <h3>Hai già votato</h3>
          <p>Grazie per aver partecipato alla votazione.</p>
        </div>
        
        <div className="candidates-results">
          <h3>Risultati parziali</h3>
          {sortedCandidates.map((candidate) => (
            <div key={candidate.address} className="candidate-result-card">
              <div className="candidate-info">
                <h4>{candidate.name}</h4>
                <p className="candidate-address">{formatAddress(candidate.address)}</p>
              </div>
              
              <div className="vote-info">
                <div className="vote-count">{candidate.voteCount} voti</div>
                <div className="vote-percentage">
                  {totalVotes > 0 ? Math.round((candidate.voteCount / totalVotes) * 100) : 0}%
                </div>
              </div>
              
              <div className="vote-bar-container">
                <div 
                  className="vote-bar" 
                  style={{ 
                    width: `${totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Se non ci sono candidati disponibili per il voto
  if (candidates.length === 0) {
    return (
      <div className="voting-section empty">
        <h3>Nessun candidato disponibile</h3>
        <p>Non ci sono candidati registrati per questa votazione.</p>
      </div>
    );
  }

  return (
    <div className="voting-section">
      {!showConfirmation ? (
        <div className="candidates-list">
          <h3>Seleziona un candidato</h3>
          <p className="voting-instructions">
            Clicca su un candidato per votarlo. È richiesta una commissione di {Web3.utils.fromWei(votingFee, 'ether')} ETH.
          </p>
          
          {sortedCandidates.map((candidate) => (
            <div 
              key={candidate.address} 
              className="candidate-vote-card"
              onClick={() => handleCandidateSelect(candidate)}
            >
              <div className="candidate-info">
                <h4>{candidate.name}</h4>
                <p className="candidate-address">{formatAddress(candidate.address)}</p>
              </div>
              
              <div className="candidate-proposal">
                <p>{candidate.proposal}</p>
              </div>
              
              <div className="vote-info">
                <div className="vote-count">{candidate.voteCount} voti</div>
                <div className="vote-button">Vota</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="confirmation-dialog">
          <h4>Conferma voto</h4>
          
          {selectedCandidate && (
            <div className="confirmation-details">
              <p>Stai per votare per:</p>
              <h3>{selectedCandidate.name}</h3>
              <p className="candidate-address">{formatAddress(selectedCandidate.address)}</p>
              <p className="candidate-proposal">{selectedCandidate.proposal}</p>
            </div>
          )}
          
          <p className="warning-message">
            Questa operazione richiede il pagamento di una commissione di {Web3.utils.fromWei(votingFee, 'ether')} ETH e non può essere annullata.
          </p>
          
          <div className="confirmation-actions">
            <button className="button primary" onClick={confirmVote}>Conferma voto</button>
            <button className="button secondary" onClick={cancelVote}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingSection;