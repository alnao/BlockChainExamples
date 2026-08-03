import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Navbar, Badge, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useContract } from './hooks/useContract';
import { switchToArbitrum, NETWORK_LABEL, CHAIN_ID } from './utils/contract';
import ConnectWallet from './components/ConnectWallet';
import AdminPanel from './components/AdminPanel';
import IssuerPanel from './components/IssuerPanel';
import VerifyDocument from './components/VerifyDocument';

function App() {
  const { contract, account, isAdmin, isIssuer, loading, connectWallet, provider } = useContract();
  const [activeTab, setActiveTab] = useState('verify');
  const [networkName, setNetworkName] = useState('');
  const [currentChainId, setCurrentChainId] = useState(null);

  // Aggiungi questo useEffect in App.js per debug
  useEffect(() => {
    console.log('Account cambiato in App:', account);
    console.log('Ruoli:', { isAdmin, isIssuer });
  }, [account, isAdmin, isIssuer]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdDecimal = parseInt(chainId, 16);
          // Mappa chainId → nome rete leggibile
          const NETWORK_NAMES = {
            42161:  'Arbitrum One',
            421614: 'Arbitrum Sepolia',
            31337:  'Locale (Hardhat)',
            11155111: 'Sepolia',
            1: 'Ethereum Mainnet',
          };
          setNetworkName(NETWORK_NAMES[chainIdDecimal] || `ChainId ${chainIdDecimal}`);
          setCurrentChainId(chainIdDecimal);
          
          // Avvisa se la rete non corrisponde a quella del contratto deployato
          if (chainIdDecimal !== CHAIN_ID) {
            console.warn(`Rete attiva (${chainIdDecimal}) diversa da quella configurata (${CHAIN_ID})`);
          }
        } catch (error) {
          console.error('Errore verifica rete:', error);
        }
      }
    };
    checkNetwork();
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => window.ethereum.removeListener?.('chainChanged', checkNetwork);
    }
  }, [account]);

  const handleConnect = async () => {
    if (window.ethereum) {
      const switched = await switchToArbitrum();
      if (switched) {
        await connectWallet();
      }
    } else {
      await connectWallet();
    }
  };

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            📋 Document Certifier
          </Navbar.Brand>
          <Navbar.Text>
            {account ? (
              <>
                {account.slice(0, 6)}...{account.slice(-4)}
                <Badge bg="info" className="ms-2">{networkName}</Badge>
              </>
            ) : (
              'Non connesso'
            )}
          </Navbar.Text>
        </Container>
      </Navbar>

      <Container fluid="md">
        {account && currentChainId && currentChainId !== CHAIN_ID && (
          <Alert variant="warning" className="mt-2">
            ⚠️ Sei connesso alla rete <strong>{networkName}</strong> (chainId {currentChainId}), ma il contratto è deployato su <strong>{NETWORK_LABEL}</strong> (chainId {CHAIN_ID}).
            {' '}
            <Alert.Link href="#" onClick={(e) => { e.preventDefault(); switchToArbitrum(); }}>
              Clicca qui per cambiare rete
            </Alert.Link>
          </Alert>
        )}
        {!account ? (
          <Row className="justify-content-center">
            <Col md={6}>
              <ConnectWallet onConnect={handleConnect} loading={loading} />
            </Col>
          </Row>
        ) : (
          <>
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Header>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                      <Nav.Item>
                        <Nav.Link eventKey="verify">🔍 Verifica Documento</Nav.Link>
                      </Nav.Item>
                      {isIssuer && (
                        <Nav.Item>
                          <Nav.Link eventKey="issue">📝 Emetti Documento</Nav.Link>
                        </Nav.Item>
                      )}
                      {isAdmin && (
                        <Nav.Item>
                          <Nav.Link eventKey="admin">⚙️ Pannello Admin</Nav.Link>
                        </Nav.Item>
                      )}
                    </Nav>
                  </Card.Header>
                  <Card.Body>
                    {activeTab === 'verify' && (
                      <VerifyDocument contract={contract} />
                    )}
                    {activeTab === 'issue' && isIssuer && (
                      <IssuerPanel contract={contract} account={account} provider={provider} />
                    )}
                    {activeTab === 'admin' && isAdmin && (
                      <AdminPanel contract={contract} provider={provider} />
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col>
                <Card className="bg-light">
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <strong>Il tuo ruolo:</strong>
                        <br />
                        {isAdmin && <Badge bg="danger" className="me-1">Admin</Badge>}
                        {isIssuer && <Badge bg="success" className="me-1">Issuer</Badge>}
                        {!isAdmin && !isIssuer && <Badge bg="secondary">Visualizzatore</Badge>}
                      </Col>
                      <Col md={4}>
                        <strong>Contratto:</strong>
                        <br />
                        <code className="small">{contract?.target || 'Non connesso'}</code>
                      </Col>
                      <Col md={4}>
                        <strong>Rete:</strong>
                        <br />
                        <Badge bg="info">{networkName}</Badge>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;