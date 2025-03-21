// App.js - Applicazione migliorata per gli Elettori
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleVotingABI from './contracts/SimpleVoting.json';
import './App.css';

function App() {
  // Stati per web3, contratto e connessione
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stati per i dati dell'elettore
  const [elettore, setElettore] = useState({
    isRegistrato: false,
    peso: 0,
    proposteVotate: []
  });
  
  // Stati per le proposte e la votazione
  const [proposte, setProposte] = useState([]);
  const [selectedProposta, setSelectedProposta] = useState(null);
  const [votazioneInCorso, setVotazioneInCorso] = useState(false);
  
  // Stati per le informazioni della votazione
  const [infoVotazione, setInfoVotazione] = useState({
    presidente: '',
    inizioVotazioni: 0,
    fineVotazioni: 0,
    votoFinito: false
  });
  
  // Stati per la delega
  const [delegaMode, setDelegaMode] = useState(false);
  const [delegatari, setDelegatari] = useState([]);
  const [selectedDelegatario, setSelectedDelegatario] = useState('');
  const [delegaInCorso, setDelegaInCorso] = useState(false);
  
  // Inizializzazione di Web3 e contratto
  useEffect(() => {
    const initializeWeb3 = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Controlla se MetaMask è disponibile
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          try {
            // Richiedi accesso agli account
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Ottieni l'account corrente
            const accounts = await web3Instance.eth.getAccounts();
            console.log('Account connesso:', accounts);
            setAccount(accounts[0]);
            
            // Ottieni l'ID della rete
            const network = await web3Instance.eth.net.getId();
            setNetworkId(network);
            
            // Inizializza il contratto
            const deployedNetwork = SimpleVotingABI.networks[network];
            
            if (deployedNetwork) {
              const contractInstance = new web3Instance.eth.Contract(
                SimpleVotingABI.abi,
                deployedNetwork.address
              );
              setContract(contractInstance);
              
              // Configura listener per il cambio di account
              window.ethereum.on('accountsChanged', (newAccounts) => {
                setAccount(newAccounts[0]);
              });
              
              // Configura listener per il cambio di rete
              window.ethereum.on('chainChanged', () => {
                window.location.reload();
              });
            } else {
              setError(`Contratto non trovato sulla rete ${network}. Verifica di essere connesso alla rete corretta.`);
            }
          } catch (err) {
            setError('Accesso a MetaMask rifiutato o non disponibile.');
          }
        } else if (window.web3) {
          // Legacy dapp browsers
          const web3Instance = new Web3(window.web3.currentProvider);
          setWeb3(web3Instance);
        } else {
          setError('Non è stato trovato alcun provider Ethereum. Installa MetaMask!');
        }
      } catch (err) {
        setError(`Errore durante l'inizializzazione di Web3: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeWeb3();
  }, []);
  
  // Caricamento dei dati quando il contratto e l'account sono disponibili
  useEffect(() => {
    const loadContractData = async () => {
      if (web3 && contract && account) {
        setIsLoading(true);
        try {
          await loadVotazioneInfo();
          await loadElettoreInfo();
          await loadProposte();
          await loadDelegatari();
        } catch (err) {
          setError(`Errore durante il caricamento dei dati: ${err.message}`);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadContractData();
  }, [web3, contract, account]);
  
  // Funzione per caricare le informazioni sulla votazione
  const loadVotazioneInfo = async () => {
    const presidente = await contract.methods.presidente().call();
    const inizioVotazioni = await contract.methods.inizioVotazioni().call();
    const durataVotazioni = await contract.methods.durataVotazioni().call();
    const votoFinito = await contract.methods.votoFinito().call();
    
    const fineVotazioni = Number(inizioVotazioni) + Number(durataVotazioni);
    
    setInfoVotazione({
      presidente,
      inizioVotazioni: Number(inizioVotazioni),
      fineVotazioni,
      votoFinito
    });
  };
  
  // Funzione per caricare le informazioni sull'elettore
  const loadElettoreInfo = async () => {
    // Controlla se l'account corrente è registrato come elettore
    const elettoreData = await contract.methods.elettori(account).call();
    
    // Ottieni le proposte già votate
    const proposteVotate = await contract.methods.getProposteVotate(account).call();
    
    setElettore({
      isRegistrato: elettoreData.iscritto,
      peso: Number(elettoreData.peso),
      proposteVotate: proposteVotate.map(id => Number(id))
    });
  };
  
  // Funzione per caricare le proposte
  const loadProposte = async () => {
    const numProposte = await contract.methods.getNumeroProposte().call();
    
    const proposteArray = [];
    for (let i = 0; i < numProposte; i++) {
      const proposta = await contract.methods.getDettagliProposta(i).call();
      const haVotato = await contract.methods.haVotato(account, i).call();
      
      proposteArray.push({
        id: Number(proposta.id),
        descrizione: proposta.descrizione,
        votiTotali: Number(proposta.votiTotali),
        eseguita: proposta.eseguita,
        haVotato
      });
    }
    
    setProposte(proposteArray);
  };
  
  // Funzione per caricare l'elenco dei possibili delegatari
  const loadDelegatari = async () => {
    const elencoElettori = await contract.methods.getElencoElettori().call();
    
    const elettoriArray = [];
    for (let i = 0; i < elencoElettori.length; i++) {
      const indirizzo = elencoElettori[i];
      
      // Ignora l'elettore corrente
      if (indirizzo.toLowerCase() === account.toLowerCase()) {
        continue;
      }
      
      const elettoreData = await contract.methods.elettori(indirizzo).call();
      
      // Include solo elettori registrati con peso > 0
      if (elettoreData.iscritto && Number(elettoreData.peso) > 0) {
        elettoriArray.push({
          indirizzo,
          peso: Number(elettoreData.peso)
        });
      }
    }
    
    setDelegatari(elettoriArray);
  };
  
  // Funzione per votare
  const votaProposta = async (idProposta) => {
    if (!isVotazioneAttiva()) {
      alert('Le votazioni non sono attive.');
      return;
    }
    
    if (elettore.peso === 0) {
      alert('Non hai peso di voto. Hai già delegato il tuo voto o votato per questa proposta.');
      return;
    }
    
    setVotazioneInCorso(true);
    
    try {
      await contract.methods.vota(idProposta).send({ from: account });
      alert('Voto registrato con successo!');
      
      // Ricarica i dati
      await loadProposte();
      await loadElettoreInfo();
    } catch (err) {
      alert(`Errore durante la votazione: ${err.message}`);
      console.error(err);
    } finally {
      setVotazioneInCorso(false);
      setSelectedProposta(null);
    }
  };
  
  // Funzione per delegare il voto
  const delegaVoto = async () => {
    if (!selectedDelegatario) {
      alert('Seleziona un elettore a cui delegare il tuo voto.');
      return;
    }
    
    if (!isVotazioneAttiva()) {
      alert('Le votazioni non sono attive.');
      return;
    }
    
    if (elettore.peso === 0) {
      alert('Non hai peso di voto da delegare.');
      return;
    }
    
    if (elettore.proposteVotate.length > 0) {
      alert('Hai già votato per alcune proposte. Non puoi delegare il tuo voto.');
      return;
    }
    
    setDelegaInCorso(true);
    
    try {
      await contract.methods.delega(selectedDelegatario).send({ from: account });
      alert('Delega effettuata con successo!');
      
      // Ricarica i dati
      await loadElettoreInfo();
      await loadDelegatari();
      
      // Chiudi il pannello di delega
      setDelegaMode(false);
    } catch (err) {
      alert(`Errore durante la delega: ${err.message}`);
      console.error(err);
    } finally {
      setDelegaInCorso(false);
      setSelectedDelegatario('');
    }
  };
  
  // Funzione per eseguire una proposta
  const eseguiProposta = async (idProposta) => {
    if (!isVotazioneTerminata()) {
      alert('Le votazioni non sono ancora terminate.');
      return;
    }
    
    try {
      await contract.methods.eseguiProposta(idProposta).send({ from: account });
      alert('Proposta eseguita con successo!');
      
      // Ricarica le proposte
      await loadProposte();
    } catch (err) {
      alert(`Errore durante l'esecuzione della proposta: ${err.message}`);
      console.error(err);
    }
  };
  
  // Funzione per verificare se la votazione è attiva
  const isVotazioneAttiva = () => {
    const now = Math.floor(Date.now() / 1000);
    return (
      now >= infoVotazione.inizioVotazioni &&
      now < infoVotazione.fineVotazioni &&
      !infoVotazione.votoFinito
    );
  };
  
  // Funzione per verificare se la votazione è terminata
  const isVotazioneTerminata = () => {
    const now = Math.floor(Date.now() / 1000);
    return now >= infoVotazione.fineVotazioni || infoVotazione.votoFinito;
  };
  
  // Funzione per calcolare il tempo rimanente
  const calcolaTempo = () => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < infoVotazione.inizioVotazioni) {
      const secondiMancanti = infoVotazione.inizioVotazioni - now;
      const ore = Math.floor(secondiMancanti / 3600);
      const minuti = Math.floor((secondiMancanti % 3600) / 60);
      return `Inizia tra ${ore}h ${minuti}m`;
    }
    
    if (isVotazioneTerminata()) {
      return "Votazione terminata";
    }
    
    const secondiRimanenti = infoVotazione.fineVotazioni - now;
    const ore = Math.floor(secondiRimanenti / 3600);
    const minuti = Math.floor((secondiRimanenti % 3600) / 60);
    return `${ore}h ${minuti}m rimanenti`;
  };
  
  // Funzione per formattare la data
  const formatData = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Funzione per abbreviare l'indirizzo
  const abbreviaIndirizzo = (indirizzo) => {
    return `${indirizzo.substring(0, 6)}...${indirizzo.substring(indirizzo.length - 4)}`;
  };
  
  // Funzione per trovare la proposta vincente
  const trovaPropostaVincente = () => {
    if (proposte.length === 0) return null;
    
    // Trova la proposta con più voti
    let vincente = proposte[0];
    for (let i = 1; i < proposte.length; i++) {
      if (proposte[i].votiTotali > vincente.votiTotali) {
        vincente = proposte[i];
      }
    }
    
    // Verifica che abbia almeno un voto
    return vincente.votiTotali > 0 ? vincente : null;
  };
  
  // Rendering della pagina di caricamento
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Caricamento in corso...</p>
        </div>
      </div>
    );
  }
  
  // Rendering della pagina di errore
  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Si è verificato un errore</h2>
          <p>{error}</p>
          <button className="button" onClick={() => window.location.reload()}>
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
  // Rendering della pagina di non registrato
  if (!elettore.isRegistrato) {
    return (
      <div className="app">
        <header>
          <h1>Sistema di Votazione</h1>
          <div className="account-info">
            Connesso come: {abbreviaIndirizzo(account)}
          </div>
        </header>
        
        <main className="not-registered">
          <div className="card">
            <h2>Non sei registrato come elettore</h2>
            <p>Il tuo account non è registrato come elettore in questo sistema di votazione.</p>
            <p>Indirizzo: {account}</p>
            <p className="note">
              Contatta il presidente ({abbreviaIndirizzo(infoVotazione.presidente)}) per essere registrato.
            </p>
          </div>
        </main>
        
        <footer>
          <p>Sistema di Votazione &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    );
  }
  
  // Rendering principale per gli elettori registrati
  return (
    <div className="app">
      <header>
        <h1>Sistema di Votazione</h1>
        <div className="account-info">
          <span>Connesso come: {abbreviaIndirizzo(account)}</span>
          <span className="badge">Elettore Registrato</span>
        </div>
      </header>
      
      <div className="dashboard">
        <div className="status-bar">
          <div className="status-item">
            <span className="label">Stato:</span>
            <span className={`value ${isVotazioneAttiva() ? 'active' : 'inactive'}`}>
              {isVotazioneAttiva() ? 'VOTAZIONE ATTIVA' : (isVotazioneTerminata() ? 'VOTAZIONE TERMINATA' : 'IN ATTESA')}
            </span>
          </div>
          
          <div className="status-item">
            <span className="label">Tempo:</span>
            <span className="value">{calcolaTempo()}</span>
          </div>
          
          <div className="status-item">
            <span className="label">Peso voto:</span>
            <span className="value">{elettore.peso}</span>
          </div>
          
          <div className="status-item">
            <span className="label">Proposte votate:</span>
            <span className="value">{elettore.proposteVotate.length}</span>
          </div>
        </div>
        
        <div className="main-content">
          <div className="left-panel">
            <div className="voting-info card">
              <h2>Informazioni Votazione</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Presidente:</span>
                  <span className="value">{abbreviaIndirizzo(infoVotazione.presidente)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Inizio:</span>
                  <span className="value">{formatData(infoVotazione.inizioVotazioni)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Fine:</span>
                  <span className="value">{formatData(infoVotazione.fineVotazioni)}</span>
                </div>
                <div className="info-item">
                  <span className="label">Terminata:</span>
                  <span className="value">{infoVotazione.votoFinito ? 'Sì' : 'No'}</span>
                </div>
              </div>
            </div>
            
            {/* Sezione delega - visibile solo se la votazione è attiva e l'elettore può delegare */}
            {isVotazioneAttiva() && elettore.peso > 0 && elettore.proposteVotate.length === 0 && (
              <div className="delegation-section card">
                <h2>Delega il tuo voto</h2>
                <p>Puoi delegare il tuo voto ad un altro elettore registrato.</p>
                
                {delegaMode ? (
                  <>
                    <div className="select-container">
                      <select 
                        value={selectedDelegatario}
                        onChange={(e) => setSelectedDelegatario(e.target.value)}
                        disabled={delegaInCorso}
                      >
                        <option value="">Seleziona un elettore</option>
                        {delegatari.map(d => (
                          <option key={d.indirizzo} value={d.indirizzo}>
                            {abbreviaIndirizzo(d.indirizzo)} (Peso: {d.peso})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="button-group">
                      <button 
                        className="button primary" 
                        onClick={delegaVoto}
                        disabled={!selectedDelegatario || delegaInCorso}
                      >
                        {delegaInCorso ? 'Elaborazione...' : 'Conferma Delega'}
                      </button>
                      <button 
                        className="button secondary"
                        onClick={() => {
                          setDelegaMode(false);
                          setSelectedDelegatario('');
                        }}
                        disabled={delegaInCorso}
                      >
                        Annulla
                      </button>
                    </div>
                    
                    <p className="warning">
                      Attenzione: la delega è irreversibile e trasferirà tutto il tuo peso di voto
                      all'elettore selezionato.
                    </p>
                  </>
                ) : (
                  <button 
                    className="button primary"
                    onClick={() => setDelegaMode(true)}
                  >
                    Delega il tuo voto
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="right-panel">
            <div className="proposals card">
              <h2>Proposte</h2>
              
              {proposte.length === 0 ? (
                <p className="no-data">Nessuna proposta disponibile.</p>
              ) : (
                <div className="proposals-list">
                  {proposte.map(proposta => {
                    // Controlla se è la proposta vincente
                    const isVincente = isVotazioneTerminata() && 
                                      trovaPropostaVincente()?.id === proposta.id;
                    
                    return (
                      <div 
                        key={proposta.id} 
                        className={`proposal-card ${proposta.haVotato ? 'voted' : ''} ${isVincente ? 'winning' : ''} ${proposta.eseguita ? 'executed' : ''}`}
                      >
                        <div className="proposal-header">
                          <h3>Proposta #{proposta.id}</h3>
                          <div className="badges">
                            {proposta.haVotato && <span className="badge voted">Hai votato</span>}
                            {isVincente && <span className="badge winning">Vincente</span>}
                            {proposta.eseguita && <span className="badge executed">Eseguita</span>}
                          </div>
                        </div>
                        
                        <div className="proposal-content">
                          <p>{proposta.descrizione}</p>
                        </div>
                        
                        <div className="proposal-footer">
                          <div className="votes">
                            <span className="count">{proposta.votiTotali}</span> voti
                          </div>
                          
                          <div className="actions">
                            {isVotazioneAttiva() && !proposta.haVotato && elettore.peso > 0 && (
                              <button 
                                className="button vote"
                                onClick={() => setSelectedProposta(proposta.id)}
                                disabled={votazioneInCorso}
                              >
                                Vota
                              </button>
                            )}
                            
                            {isVotazioneTerminata() && isVincente && !proposta.eseguita && (
                              <button 
                                className="button execute"
                                onClick={() => eseguiProposta(proposta.id)}
                              >
                                Esegui
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modale di conferma voto */}
      {selectedProposta !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Conferma voto</h3>
            <p>Stai per votare la proposta #{selectedProposta}:</p>
            <p className="proposal-title">
              {proposte.find(p => p.id === selectedProposta)?.descrizione}
            </p>
            <p className="note">Questa azione è irreversibile.</p>
            
            <div className="button-group">
              <button 
                className="button primary"
                onClick={() => votaProposta(selectedProposta)}
                disabled={votazioneInCorso}
              >
                {votazioneInCorso ? 'Elaborazione...' : 'Conferma voto'}
              </button>
              <button 
                className="button secondary"
                onClick={() => setSelectedProposta(null)}
                disabled={votazioneInCorso}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer>
        <p>Sistema di Votazione &copy; {new Date().getFullYear()}</p>
        <p className="network-info">Rete: {networkId} - Contratto: {contract?._address}</p>
      </footer>
    </div>
  );
}

export default App;