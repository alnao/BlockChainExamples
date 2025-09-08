import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { createDocumentHash } from '../utils/contract';

const IssuerPanel = ({ contract, account }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [revokeHash, setRevokeHash] = useState('');
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
        if (types.length > 0) setDocumentType(types[0]);
      } catch (err) {
        setDocumentTypes([]);
      }
    };
    fetchDocumentTypes();
  }, [contract]);

  const handleIssueDocument = async (e) => {
    e.preventDefault();
    if (!contract || !recipientAddress || !documentContent || !documentType) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const docHash = createDocumentHash(documentContent);
      console.log('Issuing document with hash:', docHash, 'and type:', documentType);

      const tx = await contract.issueDocument(recipientAddress, docHash, metadataURI || '', documentType);
      const receipt = await tx.wait();

      setSuccess(`Documento emesso con successo! Hash: ${docHash}`);
      setDocumentContent('');
      setRecipientAddress('');
      setMetadataURI('');
      setDocumentType(documentTypes.length > 0 ? documentTypes[0] : '');
      
      console.log('Transaction hash:', receipt.hash);

    } catch (err) {
      console.error('Errore emissione:', err);
      if (err.message.includes('Document already issued')) {
        setError('Documento già esistente con questo contenuto.');
      } else if (err.message.includes('Invalid document type')) {
        setError('Tipo di documento non valido.');
      } else {
        setError('Errore durante l\'emissione: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDocument = async (e) => {
    e.preventDefault();
    if (!contract || !revokeHash) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tx = await contract.revokeDocument(revokeHash);
      const receipt = await tx.wait();

      setSuccess(`Documento revocato con successo!`);
      setRevokeHash('');
      
      console.log('Revoke transaction hash:', receipt.hash);

    } catch (err) {
      console.error('Errore revoca:', err);
      if (err.message.includes('Document not found')) {
        setError('Documento non trovato.');
      } else if (err.message.includes('Already revoked')) {
        setError('Documento già revocato.');
      } else if (err.message.includes('Unauthorized')) {
        setError('Non autorizzato a revocare questo documento.');
      } else {
        setError('Errore durante la revoca: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5>📝 Pannello Emittente</h5>
      <p className="text-muted">Account: <code>{account}</code></p>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">➕ Emetti Nuovo Documento</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleIssueDocument}>
                <Form.Group className="mb-3">
                  <Form.Label>Indirizzo Destinatario</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0x..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contenuto Documento</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Inserisci il contenuto del documento..."
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Il contenuto verrà hashato per creare un identificativo univoco.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tipo Documento</Form.Label>
                  <Form.Select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  >
                    {documentTypes.length === 0 ? (
                      <option value="">Nessun tipo disponibile</option>
                    ) : (
                      documentTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))
                    )}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Seleziona il tipo di documento tra quelli abilitati dall'amministratore.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Metadata URI (opzionale)</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://ipfs.io/ipfs/..."
                    value={metadataURI}
                    onChange={(e) => setMetadataURI(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Link a metadata aggiuntivi (es. IPFS).
                  </Form.Text>
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
                      Emissione in corso...
                    </>
                  ) : (
                    'Emetti Documento'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">❌ Revoca Documento</h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleRevokeDocument}>
                <Form.Group className="mb-3">
                  <Form.Label>Hash Documento da Revocare</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0x..."
                    value={revokeHash}
                    onChange={(e) => setRevokeHash(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Inserisci l'hash del documento che vuoi revocare.
                  </Form.Text>
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
                      Revoca in corso...
                    </>
                  ) : (
                    'Revoca Documento'
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

export default IssuerPanel;