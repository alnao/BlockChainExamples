// src/components/PastVotings.jsx
import React, { useState } from 'react';
import { useReadContract, useChainId } from 'wagmi';
import { CONTRACT_ABI, getContractAddress } from '../contractConfig';
import './PastVotings.css';

const fmt = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');

function PastVotingDetail({ voting, onBack, contractAddress }) {
  const { data: details } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getVotingSessionDetails',
    args: [BigInt(voting.id)],
  });

  const totalVotes = Number(details?.totalVotes ?? 0n);
  const perc = totalVotes > 0 ? Math.round((voting.voteCount / totalVotes) * 100) : 0;
  const startDate = details
    ? new Date(Number(details.startTimestamp) * 1000).toLocaleDateString('it-IT')
    : '—';
  const endDate = details
    ? new Date(Number(details.endTimestamp) * 1000).toLocaleDateString('it-IT')
    : '—';

  return (
    <div className="past-voting-details">
      <div className="back-navigation">
        <button className="button back" onClick={onBack}>← Torna all'elenco</button>
      </div>
      <h2>{voting.title}</h2>
      <div className="voting-meta">
        <p><strong>Periodo:</strong> {startDate} → {endDate}</p>
        <p><strong>ID votazione:</strong> {voting.id}</p>
        <p><strong>Candidati totali:</strong> {details?.totalCandidates?.toString() ?? '—'}</p>
        <p><strong>Voti totali:</strong> {totalVotes}</p>
      </div>
      <div className="winner-section">
        <h3>Vincitore</h3>
        <div className="winner-card">
          <div className="winner-name">{voting.winnerName}</div>
          <div className="winner-address">{fmt(voting.winner)}</div>
          <div className="winner-stats">
            <div className="votes">
              <span className="vote-count">{voting.voteCount}</span> voti
            </div>
            <div className="percentage">{perc}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PastVotings = ({ pastVotings, onBackClick }) => {
  const [selected, setSelected] = useState(null);
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);

  if (pastVotings.length === 0) {
    return (
      <div className="past-votings empty">
        <h2>Storico votazioni</h2>
        <p>Non ci sono votazioni precedenti.</p>
        <button className="button secondary" onClick={onBackClick}>Torna indietro</button>
      </div>
    );
  }

  if (selected) {
    return <PastVotingDetail voting={selected} onBack={() => setSelected(null)} contractAddress={contractAddress} />;
  }

  return (
    <div className="past-votings">
      <div className="section-header">
        <h2>Storico votazioni</h2>
        <button className="button secondary" onClick={onBackClick}>
          Torna alla votazione corrente
        </button>
      </div>
      <div className="votings-list">
        {[...pastVotings].reverse().map((v) => (
          <div key={v.id} className="voting-card" onClick={() => setSelected(v)}>
            <div className="voting-header">
              <h3>{v.title}</h3>
            </div>
            <div className="voting-summary">
              <div className="winner-info">
                <p><strong>Vincitore:</strong> {v.winnerName}</p>
                <p className="address">{fmt(v.winner)}</p>
              </div>
              <div className="voting-stats">
                <div className="stat">
                  <div className="value">{v.voteCount}</div>
                  <div className="label">Voti vincitore</div>
                </div>
              </div>
            </div>
            <div className="view-details">Visualizza dettagli →</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PastVotings;
