import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Sistema di Votazione su Blockchain</p>
        <p className="powered-by">Powered by Ethereum & React - written by AlNao</p>
      </div>
    </footer>
  );
};

export default Footer;