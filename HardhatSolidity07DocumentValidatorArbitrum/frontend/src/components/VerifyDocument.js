import React, { useState } from 'react';
import { Form, Button, Alert, Card, Row, Col, Badge } from 'react-bootstrap';
import { createDocumentHash, formatAddress, formatDate } from '../utils/contract';

const VerifyDocument = ({ contract }) => {
  const [documentContent, setDocumentContent] = useState('');
  const [documentHash, setDocumentHash] = useState('');
  const [documentInfo, setDocumentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!contract || (!documentContent && !documentHash)) return;

    setLoading(true);
    setError('');
    setDocumentInfo(null);

    try {
      const hashToVerify = documentHash || createDocumentHash(documentContent);
      console.log('Verifying hash:', hashToVerify);

      const result = await contract.getDocument(hashToVerify);
      
      setDocumentInfo({
        issuer: result[0],
        recipient: result[1],
        metadataURI: result[2],
        issuedAt: result[3],
        revoked: result[4],
        documentType: result[5],
        hash: hashToVerify
      });

    } catch (err) {
      console.error('Errore verifica:', err);
      if (err.message.includes('Document not found')) {
        setError('Documento non trovato. Verifica che il contenuto o l\'hash siano corretti.');
      } else {
        setError('Errore durante la verifica: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateHash = () => {
    if (documentContent) {
      const hash = createDocumentHash(documentContent);
      setDocumentHash(hash);
    }
  };

  return (
    <div>
      <h5>🔍 Verifica Documento</h5>
      
      <Form onSubmit={handleVerify}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Contenuto Documento</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Inserisci il contenuto del documento da verificare..."
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
              />
              <Form.Text className="text-muted">
                Inserisci il contenuto esatto del documento per generare l'hash.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Hash Documento</Form.Label>
              <Form.Control
                type="text"
                placeholder="0x... o genera dall'contenuto"
                value={documentHash}
                onChange={(e) => setDocumentHash(e.target.value)}
              />
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="mt-2"
                onClick={generateHash}
                disabled={!documentContent}
              >
                Genera Hash dal Contenuto
              </Button>
            </Form.Group>
          </Col>
        </Row>

        <Button 
          type="submit" 
          variant="primary"
          disabled={loading || (!documentContent && !documentHash)}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Verifica in corso...
            </>
          ) : (
            'Verifica Documento'
          )}
        </Button>
      </Form>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {documentInfo && (
        <Card className="mt-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">📋 Informazioni Documento</h6>
            <Badge bg={documentInfo.revoked ? 'danger' : 'success'}>
              {documentInfo.revoked ? 'Revocato' : 'Valido'}
            </Badge>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p><strong>Hash:</strong><br />
                <code className="small">{documentInfo.hash}</code></p>
                
                <p><strong>Emittente:</strong><br />
                <code>{formatAddress(documentInfo.issuer)}</code></p>
                
                <p><strong>Destinatario:</strong><br />
                <code>{formatAddress(documentInfo.recipient)}</code></p>
                
                <p><strong>Tipo Documento:</strong><br />
                <span>{documentInfo.documentType || <span className="text-muted">N/A</span>}</span></p>
              </Col>
              <Col md={6}>
                <p><strong>Data Emissione:</strong><br />
                {formatDate(documentInfo.issuedAt)}</p>
                
                <p><strong>Metadata URI:</strong><br />
                {documentInfo.metadataURI ? (
                  <a href={documentInfo.metadataURI} target="_blank" rel="noopener noreferrer">
                    {documentInfo.metadataURI}
                  </a>
                ) : (
                  <span className="text-muted">Nessun metadata</span>
                )}</p>
                
                <p><strong>Stato:</strong><br />
                {documentInfo.revoked ? (
                  <span className="text-danger">❌ Documento revocato</span>
                ) : (
                  <span className="text-success">✅ Documento valido</span>
                )}</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default VerifyDocument;