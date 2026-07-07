// src/components/Header.jsx
import React from 'react';
import { useDisconnect } from 'wagmi';
import { STATE_LABELS, STATE_COLORS } from '../contractConfig';
import './Header.css';

const NETWORK_NAMES = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet',
  31337: 'Hardhat Local',
  42161: 'Arbitrum One',
};

const Header = ({ account, chainId, contractAddress, votingState, admin, onRefresh }) => {
  const { disconnect } = useDisconnect();

  const fmt = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const networkName = chainId ? (NETWORK_NAMES[chainId] ?? `Chain ${chainId}`) : '—';
  const stateLabel = votingState !== null ? STATE_LABELS[votingState] : null;
  const stateColor = votingState !== null ? STATE_COLORS[votingState] : '#888';
  const isAdmin =
    account && admin
      ? account.toLowerCase() === admin.toLowerCase()
      : false;

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <h1>Sistema di Votazione</h1>
          {stateLabel && (
            <div className="voting-state" style={{ backgroundColor: stateColor }}>
              {stateLabel}
            </div>
          )}
        </div>

        <div className="account-info">
          {account ? (
            <div className="connected-info">
              <div className="address-container">
                <span className="address">{fmt(account)}</span>
                {isAdmin && <span className="admin-badge">Admin</span>}
              </div>
              <div className="network-info">{networkName}</div>
              <button className="refresh-button" onClick={onRefresh} title="Aggiorna">
                ⟳
              </button>
              <button
                className="disconnect-button"
                onClick={() => disconnect()}
                title="Disconnetti"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="connect-prompt">Portafoglio non connesso</div>
          )}
        </div>
      </div>

      {contractAddress && (
        <div className="contract-info">Contratto: {fmt(contractAddress)}</div>
      )}
    </header>
  );
};

export default Header;
