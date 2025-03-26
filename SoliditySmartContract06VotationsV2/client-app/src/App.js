import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import VotingSystemContract from './contracts/AdvancedVotingSystem.json';
import './App.css';

// Componenti
import Header from './components/Header';
import Footer from './components/Footer';
import RegistrationForm from './components/RegistrationForm';
import VotingSection from './components/VotingSection';
import PastVotings from './components/PastVotings';
import LoadingSpinner from './components/LoadingSpinner';
import ConnectWallet from './components/ConnectWallet';

// Costanti per gli stati del contratto
const VotingState = {
  INACTIVE: '0',
  REGISTRATION: '1',
  VOTING: '2',
  COMPLETED: '3'
};

function App() {
  // Stati per web3 e contratto
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  
  // Stati per le informazioni della votazione
  const [contractAddress, setContractAddress] = useState('');
  const [votingState, setVotingState] = useState(null);
  const [currentVotingId, setCurrentVotingId] = useState(null);
  const [votingDetails, setVotingDetails] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [pastVotings, setPastVotings] = useState([]);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [userIsCandidate, setUserIsCandidate] = useState(false);
  const [admin, setAdmin] = useState('');
  
  // Stati per la UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('current'); // 'current' or 'past'

  // Inizializzazione di Web3
  const initWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        try {
          // Richiedi l'accesso agli account
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
          
          // Ottieni info di rete
          const networkId = await web3Instance.eth.net.getId();
          setNetworkId(networkId);
          
          // Configurazione degli eventi per metamask
          window.ethereum.on('accountsChanged', (accounts) => {
            setAccount(accounts[0] || '');
            loadContractData(web3Instance, accounts[0], contract);
          });
          
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
          
          return web3Instance;
        } catch (err) {
          setError('Per favore approva la connessione con MetaMask.');
          setLoading(false);
          return null;
        }
      } else {
        setError('MetaMask non trovato. Installa MetaMask per utilizzare questa app.');
        setLoading(false);
        return null;
      }
    } catch (err) {
      setError(`Errore di inizializzazione: ${err.message}`);
      setLoading(false);
      return null;
    }
  };

  // Inizializzazione del contratto
  const initContract = async (web3Instance) => {
    if (!web3Instance) return null;
    
    try {
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = VotingSystemContract.networks[networkId];
      
      if (!deployedNetwork) {
        setError(`Contratto non trovato sulla rete ${networkId}.`);
        setLoading(false);
        return null;
      }
      console.log("Contratto trovato:",deployedNetwork.address);
      const contractInstance = new web3Instance.eth.Contract(
        VotingSystemContract.abi,
        deployedNetwork.address
      );
      console.log("Contratto istanziato:",contractInstance);
      
      setContractAddress(deployedNetwork.address);
      setContract(contractInstance);

      //const accounts = await web3Instance.eth.getAccounts();
      //console.log("Account trovato:",accounts[0]);
      //loadContractData(web3Instance, accounts[0], contract);
      
      return contractInstance;
    } catch (err) {
      setError(`Errore nell'inizializzazione del contratto: ${err.message}`);
      setLoading(false);
      return null;
    }
  };

  // Carica i dati dal contratto
  const loadContractData = async (web3Instance, userAccount, contractInstance) => {
    console.log("User account:",userAccount);
    if (!userAccount){
      const accounts = await web3Instance.eth.getAccounts();
      console.log("Account recuperato:",accounts[0]);
      userAccount=accounts[0];
      setAccount(userAccount);
    }

    console.log("Iniziando caricamento dati...",web3Instance,contractInstance,userAccount);
    
    if (!web3Instance || !contractInstance || !userAccount) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Ottieni l'admin del contratto
      console.log("Caricamento admin...");
      const adminAddress = await contractInstance.methods.admin().call();
      setAdmin(adminAddress);
      
      // Ottieni lo stato corrente della votazione
      console.log("Caricamento stato corrente...");
      const state = await contractInstance.methods.getCurrentState().call();
      // Converti qualsiasi valore BigNumber a stringa per confronto sicuro
      const stateStr = state.toString();
      setVotingState(stateStr);
      
      // Ottieni ID della votazione corrente (se attiva)
      console.log("Verifica votazione corrente...");
      
      if (stateStr !== '0') { // Se non è inattivo
        try {
          const votingId = await contractInstance.methods.getCurrentVotingId().call();
          console.log("ID votazione corrente:", votingId);
          
          // Converti in stringa e verifica che non sia '0'
          const votingIdStr = votingId.toString();
          
          if (votingIdStr && votingIdStr !== '0') {
            setCurrentVotingId(votingIdStr);
            
            try {
              // Ottieni dettagli della votazione corrente
              console.log("Caricamento dettagli votazione...");
              const details = await contractInstance.methods.getVotingSessionDetails(votingIdStr).call();
              // Assicurati che tutti i valori numerici siano convertiti in stringhe
              const sanitizedDetails = Object.keys(details).reduce((acc, key) => {
                acc[key] = details[key] !== null && details[key] !== undefined ? 
                            details[key].toString() : 
                            details[key];
                return acc;
              }, {});
              setVotingDetails(sanitizedDetails);
              
              // Ottieni l'elenco dei candidati
              console.log("Caricamento candidati...");
              const candidateAddresses = await contractInstance.methods.getCandidatesList(votingIdStr).call();
              
              const candidatesData = await Promise.all(
                candidateAddresses.map(async (address) => {
                  const details = await contractInstance.methods.getCandidateDetails(votingIdStr, address).call();
                  return {
                    address,
                    name: details.name,
                    proposal: details.proposal,
                    voteCount: parseInt(details.voteCount.toString())
                  };
                })
              );
              
              setCandidates(candidatesData);
              
              // Verifica se l'utente ha già votato
              if (stateStr === '2') { // Solo se è in fase di votazione
                console.log("Verifica se l'utente ha già votato...");
                const hasVoted = await contractInstance.methods.hasVoted(votingIdStr, userAccount).call();
                setUserHasVoted(hasVoted);
              } else {
                setUserHasVoted(false);
              }
              
              // Verifica se l'utente è un candidato
              setUserIsCandidate(candidatesData.some(c => c.address.toLowerCase() === userAccount.toLowerCase()));
            } catch (detailError) {
              console.error("Errore nel caricamento dettagli votazione:", detailError);
              // Gestisci l'errore ma continua con il resto del caricamento
              setCandidates([]);
              setUserHasVoted(false);
              setUserIsCandidate(false);
            }
          } else {
            setCandidates([]);
            setUserHasVoted(false);
            setUserIsCandidate(false);
          }
        } catch (votingIdError) {
          console.error("Errore nel recupero ID votazione:", votingIdError);
          setCurrentVotingId(null);
          setCandidates([]);
          setUserHasVoted(false);
          setUserIsCandidate(false);
        }
      } else {
        // Reset dei dati della votazione se non è attiva
        setCurrentVotingId(null);
        setVotingDetails(null);
        setCandidates([]);
        setUserHasVoted(false);
        setUserIsCandidate(false);
      }
      
      // Ottieni le votazioni passate
      console.log("Caricamento votazioni passate...");
      try {
        const pastVotingIds = await contractInstance.methods.getPastVotingSessions().call();
        console.log("ID votazioni passate:", pastVotingIds);
        
        if (pastVotingIds && pastVotingIds.length > 0) {
          // Ottieni i dettagli delle votazioni passate
          try {
            console.log("Caricamento risultati votazioni passate...");
            const results = await contractInstance.methods.getAllPastVotingResults().call();
            
            const pastVotingsData = await Promise.all(
              pastVotingIds.map(async (id, index) => {
                try {
                  // Converti in stringa per sicurezza
                  const idStr = id.toString();
                  const details = await contractInstance.methods.getVotingSessionDetails(idStr).call();
                  return {
                    id: idStr,
                    title: results.titles[index],
                    winner: results.winners[index],
                    winnerName: results.winnerNames[index],
                    voteCount: parseInt(results.voteCounts[index].toString()),
                    totalVotes: parseInt(details.totalVotes.toString()),
                    date: new Date(parseInt(details.startTimestamp.toString()) * 1000).toLocaleDateString(),
                    totalCandidates: parseInt(details.totalCandidates.toString())
                  };
                } catch (detailError) {
                  console.error(`Errore nel caricamento dettagli votazione ${id}:`, detailError);
                  return null;
                }
              })
            );
            
            // Filtra eventuali elementi null e inverte l'ordine (più recenti prima)
            setPastVotings(pastVotingsData.filter(item => item !== null).reverse());
          } catch (resultsError) {
            console.error("Errore nel caricamento risultati votazioni passate:", resultsError);
            setPastVotings([]);
          }
        } else {
          setPastVotings([]);
        }
      } catch (pastIdsError) {
        console.error("Errore nel caricamento ID votazioni passate:", pastIdsError);
        setPastVotings([]);
      }
      
      console.log("Caricamento dati completato");
    } catch (err) {
      console.error("Errore generale nel caricamento dei dati:", err);
      setError(`Errore nel caricamento dei dati: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Effetto per l'inizializzazione
  useEffect(() => {
    const initialize = async () => {
      const web3Instance = await initWeb3();
      if (!web3Instance) return;
      
      const contractInstance = await initContract(web3Instance);
      if (!contractInstance) return;
      
      await loadContractData(web3Instance, account, contractInstance);
    };
    
    initialize();
  }, []);

  // Funzione per candidarsi
  const registerCandidate = async (name, proposal) => {
    if (!web3 || !contract || !account || votingState !== VotingState.REGISTRATION) {
      alert("Impossibile registrare la candidatura in questo momento.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Ottieni la commissione di registrazione
      const registrationFee = await contract.methods.registrationFee().call();
      
      // Registra il candidato
      await contract.methods.registerCandidate(name, proposal)
        .send({ from: account, value: registrationFee });
      
      // Ricarica i dati
      await loadContractData(web3, account, contract);
      
      alert("Candidatura registrata con successo!");
    } catch (err) {
      console.error("Errore nella registrazione:", err);
      alert(`Errore nella registrazione: ${err.message}`);
      setLoading(false);
    }
  };

  // Funzione per votare
  const vote = async (candidateAddress) => {
    if (!web3 || !contract || !account || votingState !== VotingState.VOTING || userHasVoted) {
      alert("Impossibile votare in questo momento.");
      return;
    }
    
    try {
      setLoading(true);
      
      // Ottieni la commissione di voto
      const votingFee = await contract.methods.votingFee().call();
      
      // Effettua il voto
      await contract.methods.vote(candidateAddress)
        .send({ from: account, value: votingFee });
      
      // Ricarica i dati
      await loadContractData(web3, account, contract);
      
      alert("Voto registrato con successo!");
    } catch (err) {
      console.error("Errore durante il voto:", err);
      alert(`Errore durante il voto: ${err.message}`);
      setLoading(false);
    }
  };

  // Funzione per ricaricare i dati manualmente
  const refreshData = () => {
    if (web3 && contract && account) {
      loadContractData(web3, account, contract);
    }
  };

  // Rendering condizionale in base allo stato
  const renderContent = () => {
    if (!web3 || !account) {
      return <ConnectWallet initWeb3={initWeb3} error={error} />;
    }
    
    if (loading) {
      return <LoadingSpinner message="Caricamento dati in corso..." />;
    }
    
    if (error) {
      return (
        <div className="error-container">
          <h2>Si è verificato un errore</h2>
          <p>{error}</p>
          <button className="button" onClick={refreshData}>Riprova</button>
        </div>
      );
    }
    
    if (tab === 'current') {
      // Votazione in corso o inattiva
      if (votingState === VotingState.REGISTRATION) {
        return (
          <div className="current-voting">
            <h2>Registrazione candidati aperta</h2>
            <div className="voting-info">
              <p><strong>Titolo:</strong> {votingDetails.title}</p>
              <p><strong>Descrizione:</strong> {votingDetails.description}</p>
              <p><strong>Commissione di registrazione:</strong> {web3.utils.fromWei(votingDetails.registrationFee, 'ether')} ETH</p>
            </div>
            
            {userIsCandidate ? (
              <div className="already-registered">
                <h3>Sei già registrato come candidato</h3>
                <p>Attendi che l'amministratore chiuda la fase di registrazione e avvii la votazione.</p>
              </div>
            ) : (
              <RegistrationForm onRegister={registerCandidate} />
            )}
            
            {candidates.length > 0 && (
              <div className="candidates-list">
                <h3>Candidati registrati ({candidates.length})</h3>
                {candidates.map((candidate, index) => (
                  <div key={candidate.address} className="candidate-card">
                    <h4>{candidate.name}</h4>
                    <p className="candidate-address">
                      {candidate.address.substring(0, 6)}...{candidate.address.substring(38)}
                    </p>
                    <p className="candidate-proposal">{candidate.proposal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      } else if (votingState === VotingState.VOTING) {
        return (
          <div className="current-voting">
            <h2>Votazione in corso</h2>
            <div className="voting-info">
              <p><strong>Titolo:</strong> {votingDetails.title}</p>
              <p><strong>Descrizione:</strong> {votingDetails.description}</p>
              <p><strong>Commissione di voto:</strong> {web3.utils.fromWei(votingDetails.votingFee, 'ether')} ETH</p>
              <p><strong>Voti massimi per vincere:</strong> {votingDetails.maxVotesRequired}</p>
            </div>
            
            <VotingSection 
              candidates={candidates}
              onVote={vote}
              userHasVoted={userHasVoted}
              votingFee={votingDetails ? votingDetails.votingFee : '0'}
            />
          </div>
        );
      } else {
        // Inactive
        return (
          <div className="no-voting">
            <h2>Nessuna votazione attiva</h2>
            <p>Al momento non ci sono votazioni attive.</p>
            {pastVotings.length > 0 && (
              <p>
                <button className="button" onClick={() => setTab('past')}>
                  Visualizza votazioni passate
                </button>
              </p>
            )}
            {account.toLowerCase() === admin.toLowerCase() && (
              <div className="admin-section">
                <h3>Sezione Admin</h3>
                <p>Sei l'amministratore del contratto. Usa gli script Truffle per creare una nuova votazione.</p>
              </div>
            )}
          </div>
        );
      }
    } else {
      // Visualizzazione delle votazioni passate
      return <PastVotings pastVotings={pastVotings} onBackClick={() => setTab('current')} />;
    }
  };

  return (
    <div className="app">
      <Header 
        account={account} 
        networkId={networkId}
        contractAddress={contractAddress}
        votingState={votingState}
        admin={admin}
        refreshData={refreshData}
      />
      
      <main className="app-content">
        {/* Tabs per navigare tra votazione corrente e storico */}
        {!loading && !error && web3 && (
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

export default App;