import React from 'react';
import './ConnectWallet.css';

const ConnectWallet = ({ initWeb3, error }) => {
  return (
    <div className="connect-wallet-container">
      <div className="connect-card">
        <h2>Benvenuto nel Sistema di Votazione</h2>
        <p className="description">
          Questa applicazione ti permette di partecipare alle votazioni su blockchain.
          Puoi registrarti come candidato durante la fase di registrazione o votare durante la fase di votazione.
        </p>

        <div className="metamask-info">
          <img 
            src="https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg" 
            alt="MetaMask Logo" 
            className="metamask-logo" 
          />
          <p>
            Per utilizzare l'applicazione, è necessario connettersi con un wallet Ethereum, come MetaMask.
          </p>
        </div>

        {error && (
          <div className="connect-error">
            <p>{error}</p>
          </div>
        )}

        <button className="connect-button" onClick={initWeb3}>
          Connetti Wallet
        </button>

        <div className="info-box">
          <h3>Come funziona?</h3>
          <ol>
            <li>Connetti il tuo wallet Ethereum</li>
            <li>Se la fase di registrazione è aperta, puoi candidarti</li>
            <li>Se la fase di votazione è aperta, puoi votare per un candidato</li>
            <li>Puoi visualizzare lo storico delle votazioni passate</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ConnectWallet;