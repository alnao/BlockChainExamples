// App.js - Applicazione per il Presidente
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleVotingABI from './contracts/SimpleVoting.json';
import './App.css';

function App() {
  // Stati per gestire Web3, contratto, account e dati
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [isPresident, setIsPresident] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Connessione al wallet...');
  
  // Stati per la gestione degli elettori
  const [elettori, setElettori] = useState([]);
  const [nuovoElettore, setNuovoElettore] = useState('');
  const [registrazioneInCorso, setRegistrazioneInCorso] = useState(false);
  
  // Stati per la gestione delle proposte
  const [proposte, setProposte] = useState([]);
  const [nuovaProposta, setNuovaProposta] = useState('');
  const [aggiuntaInCorso, setAggiuntaInCorso] = useState(false);
  
  // Stati per le informazioni sulla votazione
  const [infoVotazione, setInfoVotazione] = useState({
    presidente: '',
    inizioVotazioni: 0,
    fineVotazioni: 0,
    votoFinito: false,
    durataInOre: 0
  });
  
  // Inizializzazione di Web3 e del contratto
  useEffect(() => {
    const init = async () => {
      try {
        // Verifica se MetaMask è installato
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          try {
            // Richiedi l'accesso agli account
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Ottieni l'account corrente
            const accounts = await web3Instance.eth.getAccounts();
            setAccount(accounts[0]);
            
            // Inizializza il contratto
            const networkId = await web3Instance.eth.net.getId();
            const deployedNetwork = SimpleVotingABI.networks[networkId];
            
            if (deployedNetwork) {
              const contractInstance = new web3Instance.eth.Contract(
                SimpleVotingABI.abi,
                deployedNetwork.address
              );
              setContract(contractInstance);
              
              // Controlla se l'utente connesso è il presidente
              const presidenteAddress = await contractInstance.methods.presidente().call();
              setIsPresident(accounts[0].toLowerCase() === presidenteAddress.toLowerCase());
              
              // Inizializza i dati
              await caricaDati(contractInstance, accounts[0]);
              
              // Gestisci il cambio di account
              window.ethereum.on('accountsChanged', async (newAccounts) => {
                setAccount(newAccounts[0]);
                setIsPresident(newAccounts[0].toLowerCase() === presidenteAddress.toLowerCase());
                await caricaDati(contractInstance, newAccounts[0]);
              });
            } else {
              setLoadingMessage('Contratto non trovato sulla rete attuale. Verifica la connessione della rete.');
            }
          } catch (error) {
            setLoadingMessage('Impossibile connettersi agli account: ' + error.message);
          }
        } else {
          setLoadingMessage('MetaMask non trovato. Installa MetaMask per utilizzare questa applicazione.');
        }
      } catch (error) {
        setLoadingMessage('Errore durante l\'inizializzazione: ' + error.message);
      }
    };
    
    init();
  }, []);
  
  // Funzione per caricare i dati dal contratto
  const caricaDati = async (contractInstance, currentAccount) => {
    try {
      setLoadingMessage('Caricamento dati...');
      
      // Ottieni info sulla votazione
      const presidente = await contractInstance.methods.presidente().call();
      const inizioVotazioni = await contractInstance.methods.inizioVotazioni().call();
      const durataVotazioni = await contractInstance.methods.durataVotazioni().call();
      const votoFinito = await contractInstance.methods.votoFinito().call();
      
      const fineVotazioni = parseInt(inizioVotazioni) + parseInt(durataVotazioni);
      const durataInOre = parseInt(durataVotazioni) / 3600;
      
      setInfoVotazione({
        presidente,
        inizioVotazioni: parseInt(inizioVotazioni),
        fineVotazioni,
        votoFinito,
        durataInOre
      });
      
      // Ottieni l'elenco degli elettori
      await caricaElettori(contractInstance);
      
      // Ottieni l'elenco delle proposte
      await caricaProposte(contractInstance);
      
      setLoadingMessage('');
    } catch (error) {
      setLoadingMessage('Errore durante il caricamento dei dati: ' + error.message);
    }
  };
  
  // Funzione per caricare l'elenco degli elettori
  const caricaElettori = async (contractInstance) => {
    try {
      const elencoElettori = await contractInstance.methods.getElencoElettori().call();
      
      const elettoriDettagli = await Promise.all(
        elencoElettori.map(async (indirizzo) => {
          const elettore = await contractInstance.methods.elettori(indirizzo).call();
          return {
            indirizzo,
            iscritto: elettore.iscritto,
            peso: elettore.peso
          };
        })
      );
      
      setElettori(elettoriDettagli);
    } catch (error) {
      console.error('Errore durante il caricamento degli elettori:', error);
    }
  };
  
  // Funzione per caricare l'elenco delle proposte
  const caricaProposte = async (contractInstance) => {
    try {
      const numProposte = await contractInstance.methods.getNumeroProposte().call();
      
      const proposteDettagli = await Promise.all(
        Array.from({ length: parseInt(numProposte) }, (_, i) => i).map(async (id) => {
          const proposta = await contractInstance.methods.getDettagliProposta(id).call();
          return {
            id: proposta.id,
            descrizione: proposta.descrizione,
            votiTotali: proposta.votiTotali,
            eseguita: proposta.eseguita
          };
        })
      );
      
      setProposte(proposteDettagli);
    } catch (error) {
      console.error('Errore durante il caricamento delle proposte:', error);
    }
  };
  
  // Funzione per registrare un nuovo elettore
  const registraElettore = async () => {
    if (!nuovoElettore || !web3.utils.isAddress(nuovoElettore)) {
      alert('Inserisci un indirizzo Ethereum valido');
      return;
    }
    
    try {
      setRegistrazioneInCorso(true);
      
      // Controlla se l'elettore è già registrato
      const elettoreEsistente = elettori.find(e => e.indirizzo.toLowerCase() === nuovoElettore.toLowerCase());
      if (elettoreEsistente) {
        alert('Questo indirizzo è già registrato come elettore');
        setRegistrazioneInCorso(false);
        return;
      }
      
      // Registra l'elettore
      await contract.methods.registraElettore(nuovoElettore).send({ from: account });
      
      // Aggiorna l'elenco degli elettori
      await caricaElettori(contract);
      
      // Resetta il campo
      setNuovoElettore('');
      alert('Elettore registrato con successo!');
    } catch (error) {
      alert('Errore durante la registrazione: ' + error.message);
    } finally {
      setRegistrazioneInCorso(false);
    }
  };
  
  // Funzione per aggiungere una nuova proposta
  const aggiungiProposta = async () => {
    if (!nuovaProposta.trim()) {
      alert('Inserisci una descrizione per la proposta');
      return;
    }
    
    try {
      setAggiuntaInCorso(true);
      
      // Aggiungi la proposta
      await contract.methods.aggiungiProposta(nuovaProposta).send({ from: account });
      
      // Aggiorna l'elenco delle proposte
      await caricaProposte(contract);
      
      // Resetta il campo
      setNuovaProposta('');
      alert('Proposta aggiunta con successo!');
    } catch (error) {
      alert('Errore durante l\'aggiunta della proposta: ' + error.message);
    } finally {
      setAggiuntaInCorso(false);
    }
  };
  
  // Funzione per concludere le votazioni
  const concludiVotazioni = async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Se le votazioni sono già terminate temporalmente, non serve concluderle
      if (now >= infoVotazione.fineVotazioni || infoVotazione.votoFinito) {
        alert('Le votazioni sono già concluse');
        return;
      }
      
      if (window.confirm('Sei sicuro di voler concludere le votazioni in anticipo?')) {
        await contract.methods.concludiVotazioni().send({ from: account });
        
        // Aggiorna le info
        const votoFinito = await contract.methods.votoFinito().call();
        setInfoVotazione(prev => ({ ...prev, votoFinito }));
        
        alert('Votazioni concluse con successo!');
      }
    } catch (error) {
      alert('Errore durante la conclusione delle votazioni: ' + error.message);
    }
  };
  
  // Funzione per formattare la data
  const formatDateTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  // Controlla se le votazioni sono attive
  const isVotazioneAttiva = () => {
    const now = Math.floor(Date.now() / 1000);
    return now >= infoVotazione.inizioVotazioni && 
           now < infoVotazione.fineVotazioni && 
           !infoVotazione.votoFinito;
  };
  
  // Calcola il tempo rimanente
  const calcolaTempoRimanente = () => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now >= infoVotazione.fineVotazioni || infoVotazione.votoFinito) {
      return 'Votazioni concluse';
    }
    
    const secondiRimanenti = infoVotazione.fineVotazioni - now;
    
    if (secondiRimanenti <= 0) {
      return 'Votazioni concluse';
    }
    
    const ore = Math.floor(secondiRimanenti / 3600);
    const minuti = Math.floor((secondiRimanenti % 3600) / 60);
    
    return `${ore} ore e ${minuti} minuti`;
  };
  
  // Se il caricamento è in corso, mostra il messaggio di caricamento
  if (loadingMessage) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Caricamento</h2>
          <p>{loadingMessage}</p>
        </div>
      </div>
    );
  }
  
  // Se l'utente non è il presidente, mostra un messaggio di errore
  if (!isPresident) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Admin Panel - Sistema di Votazione</h1>
        </header>
        <div className="error-message">
          <h2>Accesso non autorizzato</h2>
          <p>Solo il presidente può accedere a questa applicazione.</p>
          <p>Il tuo indirizzo: {account}</p>
          <p>Indirizzo del presidente: {infoVotazione.presidente}</p>
        </div>
      </div>
    );
  }
  
  // Renderizza l'interfaccia per il presidente
  return (
    <div className="app">
      <header className="app-header">
        <h1>Admin Panel - Sistema di Votazione</h1>
        <p>Connesso come: {account} (Presidente)</p>
      </header>
      
      <main className="app-main">
        <section className="info-section">
          <h2>Informazioni Votazione</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Inizio:</strong> {formatDateTime(infoVotazione.inizioVotazioni)}
            </div>
            <div className="info-item">
              <strong>Fine:</strong> {formatDateTime(infoVotazione.fineVotazioni)}
            </div>
            <div className="info-item">
              <strong>Durata:</strong> {infoVotazione.durataInOre.toFixed(0)} ore
            </div>
            <div className="info-item">
              <strong>Stato:</strong> {isVotazioneAttiva() ? 'ATTIVO' : 'NON ATTIVO'}
            </div>
            <div className="info-item">
              <strong>Tempo rimanente:</strong> {calcolaTempoRimanente()}
            </div>
          </div>
          
          {isVotazioneAttiva() && (
            <button 
              className="button button-warning" 
              onClick={concludiVotazioni}
            >
              Concludi Votazioni Anticipatamente
            </button>
          )}
        </section>
        
        <div className="two-columns">
          <section className="elettori-section">
            <h2>Gestione Elettori</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Indirizzo Ethereum (0x...)"
                value={nuovoElettore}
                onChange={(e) => setNuovoElettore(e.target.value)}
                disabled={registrazioneInCorso || !isVotazioneAttiva()}
              />
              <button 
                className="button"
                onClick={registraElettore}
                disabled={registrazioneInCorso || !isVotazioneAttiva()}
              >
                {registrazioneInCorso ? 'Registrazione...' : 'Registra Elettore'}
              </button>
            </div>
            
            <h3>Elettori Registrati ({elettori.length})</h3>
            <div className="elettori-list">
              {elettori.length === 0 ? (
                <p>Nessun elettore registrato.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Indirizzo</th>
                      <th>Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elettori.map((elettore, index) => (
                      <tr key={elettore.indirizzo} className={elettore.indirizzo === account ? 'highlighted-row' : ''}>
                        <td>{index + 1}</td>
                        <td>
                          <span title={elettore.indirizzo}>
                            {elettore.indirizzo.substring(0, 10)}...
                          </span>
                        </td>
                        <td>{elettore.peso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          
          <section className="proposte-section">
            <h2>Gestione Proposte</h2>
            <div className="form-group">
              <input
                type="text"
                placeholder="Descrizione della proposta"
                value={nuovaProposta}
                onChange={(e) => setNuovaProposta(e.target.value)}
                disabled={aggiuntaInCorso || !isVotazioneAttiva()}
              />
              <button 
                className="button"
                onClick={aggiungiProposta}
                disabled={aggiuntaInCorso || !isVotazioneAttiva()}
              >
                {aggiuntaInCorso ? 'Aggiunta...' : 'Aggiungi Proposta'}
              </button>
            </div>
            
            <h3>Proposte ({proposte.length})</h3>
            <div className="proposte-list">
              {proposte.length === 0 ? (
                <p>Nessuna proposta aggiunta.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Descrizione</th>
                      <th>Voti</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposte.map((proposta) => (
                      <tr key={proposta.id}>
                        <td>{proposta.id}</td>
                        <td>{proposta.descrizione}</td>
                        <td>{proposta.votiTotali}</td>
                        <td>
                          {proposta.eseguita ? 'Eseguita' : 
                           (parseInt(proposta.votiTotali) > 0 && 
                            proposte.every(p => parseInt(p.votiTotali) <= parseInt(proposta.votiTotali)) ? 
                            'Vincente' : '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Sistema di Votazione Decentralizzato &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;