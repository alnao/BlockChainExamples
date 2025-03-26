import React, { useState } from 'react';
import './PastVotings.css';

const PastVotings = ({ pastVotings, onBackClick }) => {
  const [selectedVoting, setSelectedVoting] = useState(null);

  // Formatta l'indirizzo
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  // Calcola la percentuale di voti
  const calculatePercentage = (voteCount, totalVotes) => {
    return totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  };

  // Se non ci sono votazioni passate
  if (pastVotings.length === 0) {
    return (
      <div className="past-votings empty">
        <h2>Storico votazioni</h2>
        <p>Non ci sono votazioni precedenti da visualizzare.</p>
        <button className="button secondary" onClick={onBackClick}>Torna indietro</button>
      </div>
    );
  }

  // Se è selezionata una votazione specifica
  if (selectedVoting) {
    return (
      <div className="past-voting-details">
        <div className="back-navigation">
          <button className="button back" onClick={() => setSelectedVoting(null)}>
            ← Torna all'elenco
          </button>
        </div>
        
        <h2>{selectedVoting.title}</h2>
        <div className="voting-meta">
          <p><strong>Data:</strong> {selectedVoting.date}</p>
          <p><strong>ID votazione:</strong> {selectedVoting.id}</p>
          <p><strong>Candidati totali:</strong> {selectedVoting.totalCandidates}</p>
          <p><strong>Voti totali:</strong> {selectedVoting.totalVotes}</p>
        </div>
        
        <div className="winner-section">
          <h3>Vincitore</h3>
          <div className="winner-card">
            <div className="winner-name">{selectedVoting.winnerName}</div>
            <div className="winner-address">{formatAddress(selectedVoting.winner)}</div>
            <div className="winner-stats">
              <div className="votes">
                <span className="vote-count">{selectedVoting.voteCount}</span> voti
              </div>
              <div className="percentage">
                {calculatePercentage(selectedVoting.voteCount, selectedVoting.totalVotes)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visualizzazione dell'elenco delle votazioni passate
  return (
    <div className="past-votings">
      <div className="section-header">
        <h2>Storico votazioni</h2>
        <button className="button secondary" onClick={onBackClick}>Torna alla votazione corrente</button>
      </div>
      
      <div className="votings-list">
        {pastVotings.map((voting) => (
          <div 
            key={voting.id} 
            className="voting-card"
            onClick={() => setSelectedVoting(voting)}
          >
            <div className="voting-header">
              <h3>{voting.title}</h3>
              <div className="voting-date">{voting.date}</div>
            </div>
            
            <div className="voting-summary">
              <div className="winner-info">
                <p><strong>Vincitore:</strong> {voting.winnerName}</p>
                <p className="address">{formatAddress(voting.winner)}</p>
              </div>
              
              <div className="voting-stats">
                <div className="stat">
                  <div className="value">{voting.voteCount}</div>
                  <div className="label">Voti vincitore</div>
                </div>
                
                <div className="stat">
                  <div className="value">{voting.totalVotes}</div>
                  <div className="label">Voti totali</div>
                </div>
                
                <div className="stat">
                  <div className="value">{calculatePercentage(voting.voteCount, voting.totalVotes)}%</div>
                  <div className="label">Percentuale</div>
                </div>
              </div>
            </div>
            
            <div className="view-details">Visualizza dettagli</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PastVotings;