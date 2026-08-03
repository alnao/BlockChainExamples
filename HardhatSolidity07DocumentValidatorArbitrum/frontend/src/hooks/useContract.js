import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

export const useContract = () => {
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkUserRoles = useCallback(async (contractInstance, address) => {
    try {
      const adminAddress = await contractInstance.admin();
      const issuerStatus = await contractInstance.isAuthorizedIssuer(address);
      const adminCheck = adminAddress.toLowerCase() === address.toLowerCase();
      setIsAdmin(adminCheck);
      setIsIssuer(issuerStatus);
    } catch (error) {
      console.error('Errore verifica ruoli:', error);
      setIsAdmin(false);
      setIsIssuer(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);

      let signerInstance;

      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const p = new ethers.BrowserProvider(window.ethereum);
        setProvider(p);
        signerInstance = await p.getSigner();
      } else {
        // Fallback al nodo locale (solo sviluppo)
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) throw new Error('Nessun account disponibile');
        signerInstance = accounts[0];
      }

      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerInstance);
      const address = await signerInstance.getAddress();

      setContract(contractInstance);
      setSigner(signerInstance);
      setAccount(address);
      await checkUserRoles(contractInstance, address);

    } catch (error) {
      console.error('Errore connessione wallet:', error);
      alert('Errore nella connessione al wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [checkUserRoles]);

  // Listener cambio account e rete
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        setContract(null);
        setSigner(null);
        setAccount('');
        setIsAdmin(false);
        setIsIssuer(false);
      } else {
        await connectWallet();
      }
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [connectWallet]);

  // Auto-connessione se MetaMask è già autorizzato
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) await connectWallet();
      } catch (error) {
        console.error('Errore controllo connessione:', error);
      }
    };
    checkConnection();
  }, [connectWallet]);

  return { contract, signer, provider, account, isAdmin, isIssuer, loading, connectWallet };
};
