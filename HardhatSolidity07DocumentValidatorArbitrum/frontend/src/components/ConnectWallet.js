import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';

const ConnectWallet = ({ onConnect, loading }) => {
  return (
    <Card>
      <Card.Header className="text-center">
        <h4>🔗 Connetti Wallet</h4>
      </Card.Header>
      <Card.Body className="text-center">
        <Alert variant="info">
          <strong>Rete Arbitrum</strong>
          <br />
          Connettiti a Arbitrum One per interagire con il contratto.
        </Alert>
        
        <div className="d-grid gap-2">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={onConnect}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Connessione in corso...
              </>
            ) : (
              '🦊 Connetti Wallet'
            )}
          </Button>
        </div>

        <hr />

        <div className="small text-muted">
          <p><strong>Istruzioni:</strong></p>
          <ul className="text-start">
            <li>Assicurati di avere MetaMask installato</li>
            <li>Il wallet cambierà automaticamente su Arbitrum One</li>
            <li>Avrai bisogno di ETH su Arbitrum per le transazioni</li>
            <li>Contratto: <code>{process.env.REACT_APP_CONTRACT_ADDRESS || 'Non configurato'}</code></li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConnectWallet;