import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-message">{message || 'Caricamento...'}</p>
    </div>
  );
};

export default LoadingSpinner;