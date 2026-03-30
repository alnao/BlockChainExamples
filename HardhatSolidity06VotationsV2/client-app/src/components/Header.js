import React from 'react';
import './Header.css';

const Header = ({ account, networkId, contractAddress, votingState, admin, refreshData }) => {
  // Formatta l'indirizzo per la visualizzazione
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  // Converti lo stato in una stringa leggibile
  const getStateText = (state) => {
    const states = [
      'Inattivo',
      'Registrazione Candidati',
      'Votazione in Corso',
      'Completato'
    ];
    return state !== null && state !== undefined ? states[state] : 'Sconosciuto';
  };

  // Determina il colore dello stato
  const getStateColor = (state) => {
    const colors = [
      '#888888', // Inattivo - Grigio
      '#3498db', // Registrazione - Blu
      '#2ecc71', // Votazione - Verde
      '#95a5a6'  // Completato - Grigio chiaro
    ];
    return state !== null && state !== undefined ? colors[state] : '#888888';
  };

  // Ottieni il nome della rete
  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      42: 'Kovan Testnet',
      56: 'Binance Smart Chain',
      137: 'Polygon Mainnet',
      1337: 'Local Network',
      5777: 'Ganache'
    };
    return networks[id] || `Network ID: ${id}`;
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <h1>Sistema di Votazione</h1>
          {votingState !== null && (
            <div className="voting-state" style={{ backgroundColor: getStateColor(votingState) }}>
              {getStateText(votingState)}
            </div>
          )}
        </div>
        
        <div className="account-info">
          {account ? (
            <div className="connected-info">
              <div className="address-container">
                <span className="address">
                  {formatAddress(account)}
                </span>
                {admin && account.toLowerCase() === admin.toLowerCase() && (
                  <span className="admin-badge">Admin</span>
                )}
              </div>
              
              <div className="network-info">
                {networkId && <span className="network">{getNetworkName(networkId)}</span>}
              </div>
              
              <button className="refresh-button" onClick={refreshData} title="Aggiorna dati">
                ⟳
              </button>
            </div>
          ) : (
            <div className="connect-prompt">
              <span>Portafoglio non connesso</span>
            </div>
          )}
        </div>
      </div>
      
      {contractAddress && (
        <div className="contract-info">
          <span>Contratto: {formatAddress(contractAddress)}</span>
        </div>
      )}
    </header>
  );
};

export default Header;