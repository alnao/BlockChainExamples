import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';

const AdminPanel = ({ contract }) => {
  const [issuerAddress, setIssuerAddress] = useState('');
  const [removeIssuerAddress, setRemoveIssuerAddress] = useState('');
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [removeDocumentType, setRemoveDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  // Carica i tipi di documento dal contratto
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!contract) return;
      try {
        let types = [];
        let i = 0;
        while (true) {
          try {
            const type = await contract.documentTypes(i);
            types.push(type);
            i++;
          } catch (err) {
            break;
          }
        }
        setDocumentTypes(types);
      } catch (err) {
        setDocumentTypes([]);
      }
    };
    fetchDocumentTypes();
  }, [contract, success]);
  const handleAddDocumentType = async (e) => {
    e.preventDefault();
    if (!contract || !documentType) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const tx = await contract.addDocumentType(documentType);
      await tx.wait();
      setSuccess(`Tipo di documento aggiunto: ${documentType}`);
      setDocumentType('');
    } catch (err) {
      setError('Errore aggiunta tipo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocumentType = async (e) => {
    e.preventDefault();
    if (!contract || !removeDocumentType) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const tx = await contract.removeDocumentType(removeDocumentType);
      await tx.wait();
      setSuccess(`Tipo di documento rimosso: ${removeDocumentType}`);
      setRemoveDocumentType('');
    } catch (err) {
      setError('Errore rimozione tipo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIssuer = async (e) => {
    e.preventDefault();
    if (!contract || !issuerAddress) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.addIssuer(issuerAddress);
      const receipt = await tx.wait();

      setSuccess(`Issuer aggiunto con successo: ${issuerAddress}`);
      setIssuerAddress('');
      
      console.log('Add issuer transaction:', receipt.hash);

    } catch (err) {
      console.error('Errore aggiunta issuer:', err);
      if (err.message.includes('Already authorized')) {
        setError('Questo indirizzo è già un issuer autorizzato.');
      } else {
        setError('Errore durante l\'aggiunta: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveIssuer = async (e) => {
    e.preventDefault();
    if (!contract || !removeIssuerAddress) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.removeIssuer(removeIssuerAddress);
      const receipt = await tx.wait();

      setSuccess(`Issuer rimosso con successo: ${removeIssuerAddress}`);
      setRemoveIssuerAddress('');
      
      console.log('Remove issuer transaction:', receipt.hash);

    } catch (err) {
      console.error('Errore rimozione issuer:', err);
      if (err.message.includes('Not an issuer')) {
        setError('Questo indirizzo non è un issuer autorizzato.');
      } else {
        setError('Errore durante la rimozione: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async (e) => {
    e.preventDefault();
    if (!contract || !newAdminAddress) return;

    const confirmed = window.confirm(
      `Sei sicuro di voler trasferire i privilegi di admin a ${newAdminAddress}? Questa azione è irreversibile!`
    );
    
    if (!confirmed) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.transferAdmin(newAdminAddress);
      const receipt = await tx.wait();

      setSuccess(`Admin trasferito con successo a: ${newAdminAddress}`);
      setNewAdminAddress('');
      
      console.log('Transfer admin transaction:', receipt.hash);

    } catch (err) {
      console.error('Errore trasferimento admin:', err);
      setError('Errore durante il trasferimento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5>⚙️ Pannello Amministratore</h5>
      <p className="text-muted">Gestisci issuer autorizzati e trasferisci privilegi admin.</p>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">➕ Aggiungi Issuer</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddIssuer}>
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo Issuer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0x..."
                    value={issuerAddress}
                    onChange={(e) => setIssuerAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  variant="success"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Aggiunta...
                    </>
                  ) : (
                    'Aggiungi Issuer'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">➖ Rimuovi Issuer</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleRemoveIssuer}>
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo Issuer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0x..."
                    value={removeIssuerAddress}
                    onChange={(e) => setRemoveIssuerAddress(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  variant="warning"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Rimozione...
                    </>
                  ) : (
                    'Rimuovi Issuer'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">➕ Aggiungi Tipo Documento</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddDocumentType}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo Documento</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Es: Certificate, Workshop, Diploma..."
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  variant="info"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Aggiunta...
                    </>
                  ) : (
                    'Aggiungi Tipo'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">➖ Rimuovi Tipo Documento</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleRemoveDocumentType}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo Documento</Form.Label>
                  <Form.Select
                    value={removeDocumentType}
                    onChange={(e) => setRemoveDocumentType(e.target.value)}
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    {documentTypes.map((type, idx) => (
                      <option key={idx} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button 
                  type="submit" 
                  variant="danger"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Rimozione...
                    </>
                  ) : (
                    'Rimuovi Tipo'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminPanel;