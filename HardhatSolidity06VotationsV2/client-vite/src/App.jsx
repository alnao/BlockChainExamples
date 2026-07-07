// src/App.jsx
// Componente principale — usa wagmi hooks al posto di web3.js manuale
import React, { useState } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useWatchContractEvent,
} from 'wagmi';

import { CONTRACT_ABI, VotingState, getContractAddress } from './contractConfig';
import Header from './components/Header';
import Footer from './components/Footer';
import ConnectWallet from './components/ConnectWallet';
import LoadingSpinner from './components/LoadingSpinner';
import RegistrationForm from './components/RegistrationForm';
import VotingSection from './components/VotingSection';
import PastVotings from './components/PastVotings';
import AdminPanel from './components/AdminPanel';

import './App.css';

function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [tab, setTab] = useState('current');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // Indirizzo contratto per la rete attiva
  const CONTRACT_ADDRESS = getContractAddress(chainId);
  const isUnsupportedNetwork = isConnected && !CONTRACT_ADDRESS;

  // ---- Lettura dati dal contratto ----------------------------------------

  const sharedArgs = {
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
  };

  const { data: admin, isLoading: loadingAdmin } = useReadContract({
    ...sharedArgs,
    functionName: 'admin',
    query: { queryKey: ['admin', CONTRACT_ADDRESS, refreshKey] },
  });

  const { data: votingState, isLoading: loadingState } = useReadContract({
    ...sharedArgs,
    functionName: 'getCurrentState',
    query: { queryKey: ['getCurrentState', CONTRACT_ADDRESS, refreshKey] },
  });

  const stateNum = votingState !== undefined ? Number(votingState) : null;
  const isActive = stateNum !== null && stateNum !== VotingState.Inactive;

  // isAdmin: true solo quando ENTRAMBI address e admin sono disponibili
  // Usiamo un confronto case-insensitive perché viem può restituire checksum diverso
  const isAdmin =
    !!address && !!admin &&
    address.toLowerCase() === admin.toLowerCase();

  // Loading solo sul votingState — admin arriva quasi sempre insieme
  const isLoading = loadingState;

  const { data: currentVotingId } = useReadContract({
    ...sharedArgs,
    functionName: 'getCurrentVotingId',
    query: { enabled: isActive, queryKey: ['getCurrentVotingId', refreshKey] },
  });

  const votingIdBigInt = currentVotingId ?? 0n;

  const { data: votingDetails } = useReadContract({
    ...sharedArgs,
    functionName: 'getVotingSessionDetails',
    args: [votingIdBigInt],
    query: { enabled: isActive && votingIdBigInt > 0n, queryKey: ['getVotingSessionDetails', votingIdBigInt?.toString(), refreshKey] },
  });

  const { data: candidateAddresses } = useReadContract({
    ...sharedArgs,
    functionName: 'getCandidatesList',
    args: [votingIdBigInt],
    query: { enabled: isActive && votingIdBigInt > 0n, queryKey: ['getCandidatesList', votingIdBigInt?.toString(), refreshKey] },
  });

  const { data: userHasVoted } = useReadContract({
    ...sharedArgs,
    functionName: 'hasVoted',
    args: [votingIdBigInt, address],
    query: {
      enabled: isActive && votingIdBigInt > 0n && stateNum === VotingState.Voting && !!address,
      queryKey: ['hasVoted', votingIdBigInt?.toString(), address, refreshKey],
    },
  });

  const { data: pastVotingIds } = useReadContract({
    ...sharedArgs,
    functionName: 'getPastVotingSessions',
    query: { queryKey: ['getPastVotingSessions', refreshKey] },
  });

  const { data: pastResults } = useReadContract({
    ...sharedArgs,
    functionName: 'getAllPastVotingResults',
    query: {
      enabled: !!pastVotingIds && pastVotingIds.length > 0,
      queryKey: ['getAllPastVotingResults', refreshKey],
    },
  });

  // Aggiorna automaticamente quando cambia lo stato on-chain
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'VotingSessionCreated',
    onLogs: refresh,
  });
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'VoteCast',
    onLogs: refresh,
  });
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'VotingCompleted',
    onLogs: refresh,
  });
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'CandidateRegistered',
    onLogs: refresh,
  });

  // Normalizza i dati dei candidati per i componenti figli
  // (le letture singole di getCandidateDetails le fa VotingSection direttamente)
  const userIsCandidate =
    candidateAddresses?.some(
      (a) => address && a.toLowerCase() === address.toLowerCase()
    ) ?? false;

  // Costruisce la lista storico votazioni
  // getAllPastVotingResults ritorna array posizionale:
  // [0]=votingIds, [1]=titles, [2]=winners, [3]=winnerNames, [4]=voteCounts
  const pastVotings =
    pastResults && pastVotingIds
      ? pastVotingIds.map((id, i) => ({
          id: id.toString(),
          title: pastResults[1][i],
          winner: pastResults[2][i],
          winnerName: pastResults[3][i],
          voteCount: Number(pastResults[4][i]),
        }))
      : [];

  // ---- Rendering -----------------------------------------------------------

  if (!isConnected) {
    return (
      <div className="app">
        <Header
          account={null}
          chainId={chainId}
          contractAddress={null}
          votingState={null}
          admin={null}
          onRefresh={refresh}
        />
        <main className="app-content">
          <ConnectWallet />
        </main>
        <Footer />
      </div>
    );
  }

  // Rete non supportata o contratto non deployato su questa rete
  if (isUnsupportedNetwork) {
    const SUPPORTED = {
      31337: 'Hardhat locale (npm run node)',
      11155111: 'Sepolia testnet',
    };
    return (
      <div className="app">
        <Header account={address} chainId={chainId} contractAddress={null}
          votingState={null} admin={null} onRefresh={refresh} />
        <main className="app-content">
          <div className="error-container">
            <h2>Rete non supportata</h2>
            <p>
              Sei connesso alla rete <strong>chainId {chainId}</strong> ma il contratto
              non è deployato qui.
            </p>
            <p>Reti supportate:</p>
            <ul style={{ textAlign: 'left', marginTop: '10px', marginBottom: '20px' }}>
              {Object.entries(SUPPORTED).map(([id, name]) => (
                <li key={id}><strong>chainId {id}</strong> — {name}</li>
              ))}
            </ul>
            <p>
              In MetaMask cambia rete oppure aggiungi <strong>Hardhat localhost</strong>:
            </p>
            <code style={{ display: 'block', background: '#f5f5f5', padding: '10px',
              borderRadius: '6px', marginTop: '10px', fontSize: '13px', textAlign: 'left' }}>
              RPC: http://127.0.0.1:8545<br/>
              Chain ID: 31337<br/>
              Simbolo: NAO
            </code>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner message="Caricamento dati in corso..." />;

    // Se admin è undefined dopo il caricamento, il contratto non è raggiungibile
    if (!isLoading && votingState === undefined) {
      return (
        <div className="error-container">
          <h2>Contratto non raggiungibile</h2>
          <p>
            Impossibile leggere i dati dal contratto all'indirizzo{' '}
            <code>{CONTRACT_ADDRESS}</code>
          </p>
          <p style={{ marginTop: '15px' }}>Possibili cause:</p>
          <ul style={{ textAlign: 'left', marginTop: '8px', marginBottom: '20px' }}>
            <li>Il nodo locale non è in esecuzione → avvia <code>npm run node</code></li>
            <li>Il contratto non è deployato → esegui <code>npm run deploy:local</code></li>
            <li>MetaMask è su una rete diversa da chainId {chainId}</li>
          </ul>
          <button className="button" onClick={refresh}>Riprova</button>
        </div>
      );
    }

    if (tab === 'past') {
      return <PastVotings pastVotings={pastVotings} onBackClick={() => setTab('current')} />;
    }

    // Tab 'current'
    if (stateNum === VotingState.Registration) {
      return (
        <div className="current-voting">
          <h2>Registrazione candidati aperta</h2>
          <div className="voting-info">
            <p><strong>Titolo:</strong> {votingDetails?.title}</p>
            <p><strong>Descrizione:</strong> {votingDetails?.description}</p>
            <p>
              <strong>Commissione registrazione:</strong>{' '}
              {votingDetails
                ? `${(Number(votingDetails.registrationFee) / 1e18).toFixed(4)} NAO`
                : '—'}
            </p>
          </div>

          {userIsCandidate ? (
            <div className="already-registered">
              <h3>Sei già registrato come candidato</h3>
              <p>Attendi che l'amministratore chiuda la fase di registrazione.</p>
            </div>
          ) : (
            <RegistrationForm
              contractAddress={CONTRACT_ADDRESS}
              contractAbi={CONTRACT_ABI}
              registrationFee={votingDetails?.registrationFee ?? 0n}
              onSuccess={refresh}
            />
          )}

          {candidateAddresses && candidateAddresses.length > 0 && (
            <div className="candidates-list">
              <h3>Candidati registrati ({candidateAddresses.length})</h3>
              {candidateAddresses.map((addr) => (
                <CandidateCard
                  key={addr}
                  address={addr}
                  votingId={votingIdBigInt}
                  contractAddress={CONTRACT_ADDRESS}
                  contractAbi={CONTRACT_ABI}
                />
              ))}
            </div>
          )}

          {isAdmin && (
            <AdminPanel
              contractAddress={CONTRACT_ADDRESS}
              contractAbi={CONTRACT_ABI}
              votingState={stateNum}
              onSuccess={refresh}
            />
          )}
        </div>
      );
    }

    if (stateNum === VotingState.Voting) {
      return (
        <div className="current-voting">
          <h2>Votazione in corso</h2>
          <div className="voting-info">
            <p><strong>Titolo:</strong> {votingDetails?.title}</p>
            <p><strong>Descrizione:</strong> {votingDetails?.description}</p>
            <p>
              <strong>Commissione voto:</strong>{' '}
              {votingDetails
                ? `${(Number(votingDetails.votingFee) / 1e18).toFixed(4)} NAO`
                : '—'}
            </p>
            <p>
              <strong>Voti massimi per vincere:</strong>{' '}
              {votingDetails?.maxVotesRequired?.toString()}
            </p>
          </div>

          <VotingSection
            contractAddress={CONTRACT_ADDRESS}
            contractAbi={CONTRACT_ABI}
            votingId={votingIdBigInt}
            candidateAddresses={candidateAddresses ?? []}
            votingFee={votingDetails?.votingFee ?? 0n}
            userHasVoted={userHasVoted ?? false}
            onSuccess={refresh}
          />

          {isAdmin && (
            <AdminPanel
              contractAddress={CONTRACT_ADDRESS}
              contractAbi={CONTRACT_ABI}
              votingState={stateNum}
              onSuccess={refresh}
            />
          )}
        </div>
      );
    }

    // Inactive
    return (
      <div className="no-voting">
        <h2>Nessuna votazione attiva</h2>
        <p>Al momento non ci sono votazioni in corso.</p>

        {/* Debug info — rimuovere in produzione */}
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px',
          padding: '10px', background: '#f9f9f9', borderRadius: '6px',
          fontFamily: 'monospace', textAlign: 'left' }}>
          <strong>Debug:</strong><br/>
          connected: {address?.slice(0,10)}...<br/>
          admin:     {admin?.slice(0,10) ?? 'loading...'}<br/>
          isAdmin:   {String(isAdmin)}<br/>
          chainId:   {chainId}
        </div>

        {pastVotings.length > 0 && (
          <p>
            <button className="button" onClick={() => setTab('past')}>
              Visualizza votazioni passate
            </button>
          </p>
        )}

        {isAdmin && (
          <AdminPanel
            contractAddress={CONTRACT_ADDRESS}
            contractAbi={CONTRACT_ABI}
            votingState={stateNum}
            onSuccess={refresh}
          />
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <Header
        account={address}
        chainId={chainId}
        contractAddress={CONTRACT_ADDRESS}
        votingState={stateNum}
        admin={admin}
        onRefresh={refresh}
      />

      <main className="app-content">
        {!isLoading && isConnected && (
          <div className="tabs">
            <button
              className={`tab-button ${tab === 'current' ? 'active' : ''}`}
              onClick={() => setTab('current')}
            >
              Votazione Corrente
            </button>
            <button
              className={`tab-button ${tab === 'past' ? 'active' : ''}`}
              onClick={() => setTab('past')}
              disabled={pastVotings.length === 0}
            >
              Storico Votazioni
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}

// ---- Componente inline: card singolo candidato in fase registrazione -------
function CandidateCard({ address, votingId, contractAddress, contractAbi }) {
  const { data } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'getCandidateDetails',
    args: [votingId, address],
  });

  if (!data) return null;
  const [name, proposal] = data;

  return (
    <div className="candidate-card">
      <h4>{name}</h4>
      <p className="candidate-address">
        {address.slice(0, 6)}...{address.slice(-4)}
      </p>
      <p className="candidate-proposal">{proposal}</p>
    </div>
  );
}

export default App;
