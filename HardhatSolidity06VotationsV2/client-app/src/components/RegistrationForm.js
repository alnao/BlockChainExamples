import React, { useState } from 'react';
import './RegistrationForm.css';

const RegistrationForm = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [proposal, setProposal] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState({ name: '', proposal: '' });

  // Validazione dei campi
  const validateForm = () => {
    const newErrors = { name: '', proposal: '' };
    let isValid = true;
    
    if (!name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Il nome deve avere almeno 2 caratteri';
      isValid = false;
    }
    
    if (!proposal.trim()) {
      newErrors.proposal = 'La proposta è obbligatoria';
      isValid = false;
    } else if (proposal.trim().length < 10) {
      newErrors.proposal = 'La proposta deve avere almeno 10 caratteri';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Gestore per l'invio del form
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  // Conferma la registrazione
  const confirmRegistration = () => {
    onRegister(name, proposal);
    setShowConfirmation(false);
    // Reset del form
    setName('');
    setProposal('');
  };

  // Annulla la registrazione
  const cancelRegistration = () => {
    setShowConfirmation(false);
  };

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
            />
            {errors.proposal && <div className="error-message">{errors.proposal}</div>}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="button primary">Candidati</button>
          </div>
          
          <div className="form-info">
            <p>
              Per candidarti è necessario pagare una commissione. 
              MetaMask ti chiederà di confermare la transazione.
            </p>
          </div>
        </form>
      ) : (
        <div className="confirmation-dialog">
          <h4>Conferma candidatura</h4>
          <p>Stai per candidarti con i seguenti dati:</p>
          
          <div className="confirmation-details">
            <p><strong>Nome:</strong> {name}</p>
            <p><strong>Proposta:</strong> {proposal}</p>
          </div>
          
          <p className="warning-message">
            La registrazione richiede il pagamento di una commissione e non può essere annullata.
          </p>
          
          <div className="confirmation-actions">
            <button className="button primary" onClick={confirmRegistration}>Conferma</button>
            <button className="button secondary" onClick={cancelRegistration}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;