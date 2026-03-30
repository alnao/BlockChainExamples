import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Funzione per verificare ruoli
  const checkUserRoles = async (contractInstance, address) => {
    try {
      const adminAddress = await contractInstance.admin();
      const issuerStatus = await contractInstance.isAuthorizedIssuer(address);
      
      const adminCheck = adminAddress.toLowerCase() === address.toLowerCase();
      
      setIsAdmin(adminCheck);
      setIsIssuer(issuerStatus);
      
      console.log('Ruoli utente:', { address, isAdmin: adminCheck, isIssuer: issuerStatus });
    } catch (error) {
      console.error('Errore verifica ruoli:', error);
      setIsAdmin(false);
      setIsIssuer(false);
    }
  };

  // Connessione al provider
  const connectWallet = async () => {
    try {
      setLoading(true);
      
      let provider, signerInstance;
      
      if (window.ethereum) {
        // MetaMask è disponibile
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.BrowserProvider(window.ethereum);
        signerInstance = await provider.getSigner();
      } else {
        // Fallback al provider locale
        provider = new ethers.JsonRpcProvider(RPC_URL);
        // Usa il primo account locale (per sviluppo)
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          signerInstance = accounts[0];
        } else {
          throw new Error('Nessun account disponibile');
        }
      }

      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);
      const address = await signerInstance.getAddress();

      setContract(contractInstance);
      setSigner(signerInstance);
      setAccount(address);

      // Verifica ruoli
      await checkUserRoles(contractInstance, address);

    } catch (error) {
      console.error('Errore connessione wallet:', error);
      alert('Errore nella connessione al wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Listener per cambio account - SPOSTATO DOPO connectWallet
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        console.log('Account cambiato:', accounts);
        
        if (accounts.length === 0) {
          // Disconnesso
          setContract(null);
          setSigner(null);
          setAccount('');
          setIsAdmin(false);
          setIsIssuer(false);
        } else {
          // Nuovo account - riconnetti
          console.log('Riconnessione con nuovo account...');
          await connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        console.log('Rete cambiata:', chainId);
        // Ricarica la pagina per evitare problemi
        window.location.reload();
      };

      // Rimuovi listener esistenti prima di aggiungerne di nuovi
      if (window.ethereum.removeAllListeners) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }

      // Aggiungi i listener
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []); // Dipendenza vuota per evitare loop infiniti

  // Auto-connessione se già connesso
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Errore controllo connessione:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    contract,
    signer,
    account,
    isAdmin,
    isIssuer,
    loading,
    connectWallet
  };
};