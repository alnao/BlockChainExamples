import React, { useState } from "react";
import { Container, Card, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { ethers } from "ethers";
import DocumentCertifierABI from "./abis/DocumentCertifier.json";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // <- Inserisci indirizzo

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form states
  const [issuerAddress, setIssuerAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [pdfHash, setPdfHash] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [docInfo, setDocInfo] = useState(null);

  const connectWallet = async () => {
  const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
  await ethProvider.send("eth_requestAccounts", []);
  const signer = ethProvider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentCertifierABI, signer);

  setProvider(ethProvider);
  setSigner(signer);
  setContract(contract);
  setAlert({ type: "success", message: "Wallet connesso!" });
  };

  const addIssuer = async () => {
  try {
    const tx = await contract.addIssuer(issuerAddress);
    await tx.wait();
    setAlert({ type: "success", message: `Issuer ${issuerAddress} aggiunto.` });
  } catch (err) {
    setAlert({ type: "danger", message: err.message });
  }
  };

  const issueDocument = async () => {
  try {
    const tx = await contract.issueDocument(recipient, pdfHash, metadataURI);
    await tx.wait();
    setAlert({ type: "success", message: `Documento emesso per ${recipient}` });
  } catch (err) {
    setAlert({ type: "danger", message: err.message });
  }
  };

  const verifyDocument = async () => {
  try {
    const data = await contract.getDocument(verifyHash);
    setDocInfo(data);
  } catch (err) {
    setAlert({ type: "danger", message: "Documento non trovato." });
  }
  };

  return (
  <Container className="py-4">
    <h2 className="mb-4">Document Certifier (Arbitrum)</h2>
    <Button onClick={connectWallet} className="mb-3">Connetti Wallet</Button>
    {alert && <Alert variant={alert.type}>{alert.message}</Alert>}

    <Row>
    <Col md={6}>
      <Card className="mb-4">
      <Card.Body>
        <Card.Title>➕ Aggiungi Issuer</Card.Title>
        <Form.Control type="text" placeholder="Indirizzo issuer" value={issuerAddress} onChange={(e) => setIssuerAddress(e.target.value)} className="my-2" />
        <Button onClick={addIssuer}>Aggiungi</Button>
      </Card.Body>
      </Card>
    </Col>

    <Col md={6}>
      <Card className="mb-4">
      <Card.Body>
        <Card.Title>📄 Emetti Documento</Card.Title>
        <Form.Control type="text" placeholder="Destinatario" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="my-2" />
        <Form.Control type="text" placeholder="Hash del PDF (keccak256)" value={pdfHash} onChange={(e) => setPdfHash(e.target.value)} className="my-2" />
        <Form.Control type="text" placeholder="Metadata URI (IPFS, etc.)" value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} className="my-2" />
        <Button onClick={issueDocument}>Emetti</Button>
      </Card.Body>
      </Card>
    </Col>

    <Col md={12}>
      <Card className="mb-4">
      <Card.Body>
        <Card.Title>🔍 Verifica Documento</Card.Title>
        <Form.Control type="text" placeholder="Hash del documento" value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)} className="my-2" />
        <Button onClick={verifyDocument}>Verifica</Button>

        {docInfo && (
        <div className="mt-3">
          <p><strong>Issuer:</strong> {docInfo.issuer}</p>
          <p><strong>Recipient:</strong> {docInfo.recipient}</p>
          <p><strong>Metadata URI:</strong> <a href={docInfo.metadataURI} target="_blank" rel="noopener noreferrer">{docInfo.metadataURI}</a></p>
          <p><strong>Timestamp:</strong> {new Date(docInfo.issuedAt * 1000).toLocaleString()}</p>
          <p><strong>Revocato:</strong> {docInfo.revoked ? "Sì" : "No"}</p>
        </div>
        )}
      </Card.Body>
      </Card>
    </Col>
    </Row>
  </Container>
  );
};

export default App;

/*
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/