// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="app-footer">
    <div className="footer-content">
      <p>&copy; {new Date().getFullYear()} Sistema di Votazione su Blockchain</p>
      <p className="powered-by">Powered by Ethereum, Hardhat &amp; wagmi/viem - written by AlNao</p>
    </div>
  </footer>
);

export default Footer;
