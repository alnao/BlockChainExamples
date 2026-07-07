// src/components/LoadingSpinner.jsx
import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message }) => (
  <div className="loading-container">
    <div className="spinner" />
    <p className="loading-message">{message ?? 'Caricamento...'}</p>
  </div>
);

export default LoadingSpinner;
