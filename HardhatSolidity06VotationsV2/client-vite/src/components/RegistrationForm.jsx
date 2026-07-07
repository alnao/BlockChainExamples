// src/components/RegistrationForm.jsx
import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import './RegistrationForm.css';

const RegistrationForm = ({ contractAddress, contractAbi, registrationFee, onSuccess }) => {
  const [name, setName] = useState('');
  const [proposal, setProposal] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState({ name: '', proposal: '' });

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Notifica il parent al completamento
  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
      setName('');
      setProposal('');
      setShowConfirmation(false);
    }
  }, [isSuccess, onSuccess]);

  const validate = () => {
    const e = { name: '', proposal: '' };
    let ok = true;
    if (!name.trim() || name.trim().length < 2) {
      e.name = 'Il nome deve avere almeno 2 caratteri';
      ok = false;
    }
    if (!proposal.trim() || proposal.trim().length < 10) {
      e.proposal = 'La proposta deve avere almeno 10 caratteri';
      ok = false;
    }
    setErrors(e);
    return ok;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) setShowConfirmation(true);
  };

  const confirmRegistration = () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'registerCandidate',
      args: [name.trim(), proposal.trim()],
      value: registrationFee,
    });
  };

  const isBusy = isPending || isConfirming;

  return (
    <div className="registration-form-container">
      <h3>Registrati come candidato</h3>

      {!showConfirmation ? (
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome del candidato</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inserisci il tuo nome"
              className={errors.name ? 'error' : ''}
              disabled={isBusy}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="proposal">Proposta</label>
            <textarea
              id="proposal"
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Descrivi la tua proposta..."
              rows={4}
              className={errors.proposal ? 'error' : ''}
              disabled={isBusy}
            />
            {errors.proposal && <div className="error-message">{errors.proposal}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="button primary" disabled={isBusy}>
              Candidati
            </button>
          </div>

          <div className="form-info">
            <p>
              Per candidarti è necessario pagare una commissione di{' '}
              {(Number(registrationFee) / 1e18).toFixed(4)} NAO.
              MetaMask ti chiederà di confermare la transazione.
            </p>
          </div>
        </form>
      ) : (
        <div className="confirmation-dialog">
          <h4>Conferma candidatura</h4>
          <div className="confirmation-details">
            <p><strong>Nome:</strong> {name}</p>
            <p><strong>Proposta:</strong> {proposal}</p>
            <p>
              <strong>Commissione:</strong>{' '}
              {(Number(registrationFee) / 1e18).toFixed(4)} NAO
            </p>
          </div>

          <p className="warning-message">
            La registrazione richiede il pagamento della commissione e non può essere
            annullata.
          </p>

          {writeError && (
            <p className="error-message">
              Errore: {writeError.shortMessage ?? writeError.message}
            </p>
          )}

          {isBusy && (
            <p className="tx-status">
              {isPending ? 'In attesa di conferma MetaMask...' : 'Transazione in corso...'}
            </p>
          )}

          <div className="confirmation-actions">
            <button
              className="button primary"
              onClick={confirmRegistration}
              disabled={isBusy}
            >
              Conferma
            </button>
            <button
              className="button secondary"
              onClick={() => setShowConfirmation(false)}
              disabled={isBusy}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
