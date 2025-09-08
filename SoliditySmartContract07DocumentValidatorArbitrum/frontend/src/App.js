import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Navbar, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useContract } from './hooks/useContract';
import { switchToArbitrum } from './utils/contract';
import ConnectWallet from './components/ConnectWallet';
import AdminPanel from './components/AdminPanel';
import IssuerPanel from './components/IssuerPanel';
import VerifyDocument from './components/VerifyDocument';

function App() {
  const { contract, account, isAdmin, isIssuer, loading, connectWallet } = useContract();
  const [activeTab, setActiveTab] = useState('verify');
  const [networkName, setNetworkName] = useState('');

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
          switch (chainId) {
            case '0xa4b1':
              setNetworkName('Arbitrum One');
              break;
            case '0x7a69':
              setNetworkName('Locale (Hardhat)');
              break;
            default:
              setNetworkName('Rete sconosciuta');
          }
        } catch (error) {
          console.error('Errore verifica rete:', error);
        }
      }
    };

    checkNetwork();
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

      <Container>
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
                      <IssuerPanel contract={contract} account={account} />
                    )}
                    {activeTab === 'admin' && isAdmin && (
                      <AdminPanel contract={contract} />
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