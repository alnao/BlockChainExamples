import React, { useState, useEffect } from "react";
import Web3 from "web3";
import FundraiserFactoryContract from "./contracts/FundraiserFactory.json";
import FundraiserContract from "./contracts/Fundraiser.json";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap';

const App = () => {
  console.log("Web3 Version:", Web3.version);

  console.log("Starting Web3 initialization...");
  console.log("Window ethereum object:", window.ethereum ? "Available" : "Not available");
  // Dopo aver ottenuto gli account
//  console.log("Accounts from eth_requestAccounts:", accounts);
//  console.log("Current selected account:", accounts[0]);
  // Dopo aver inizializzato il contratto
//  console.log("Contract initialization:", factory ? "Success" : "Failed");

  window.ethereum.on('accountsChanged', (newAccounts) => {
    console.log("MetaMask accountsChanged event triggered");
    console.log("New accounts:", newAccounts);
    console.log("Primary account:", newAccounts[0]);
    
    setState(prevState => ({ 
      ...prevState, 
      accounts: newAccounts 
    }));
  });

  const [state, setState] = useState({
    allAccounts: [],  // Nuovo campo per memorizzare tutti gli account
    web3: null,
    accounts: [],
    factory: null,
    fundraisers: [],
    isLoading: true,
    activeTab: 'home',
    formData: {
      name: '',
      url: '',
      imageURL: '',
      description: '',
      beneficiary: ''
    },
    donationAmount: '0.01',
    selectedFundraiser: null,
    userDonations: {
      values: [],
      dates: []
    },
    notification: {
      show: false,
      type: 'success',
      message: ''
    },
    networkId: null
    
  });

  // Funzione per mostrare notifiche all'utente
  const showNotification = (type, message) => {
    setState(prevState => ({
      ...prevState,
      notification: {
        show: true,
        type,
        message
      }
    }));
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        notification: {
          ...prevState.notification,
          show: false
        }
      }));
    }, 5000);
  };

  // Inizializzazione di Web3 e caricamento dei contratti
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        setState(prevState => ({ ...prevState, isLoading: true }));
        
        let web3Instance;
        
        // Check if MetaMask is installed
        if (window.ethereum) {
          try {
            // Utilizziamo il metodo moderno per richiedere l'autorizzazione
            // Questo mostra il popup di MetaMask per connettersi all'app
            const accounts = await window.ethereum.request({ 
              method: 'eth_requestAccounts' 
            });
            
            console.log("Connected to MetaMask with accounts:", accounts);
            web3Instance = new Web3(window.ethereum);
            
            // Ascolta i cambiamenti di account
            window.ethereum.on('accountsChanged', (newAccounts) => {
              console.log("Account changed:", newAccounts[0]);
              setState(prevState => ({ 
                ...prevState, 
                accounts: newAccounts 
              }));
              
              // Ricarica i fundraisers quando cambia l'account
//              if (prevState.factory) {
//                loadFundraisers(web3Instance, prevState.factory, newAccounts);
//              }
            });
            
            // Ascolta i cambiamenti di rete
            window.ethereum.on('chainChanged', (chainId) => {
              console.log("Network changed to chainId:", chainId);
              window.location.reload(); // Ricarica la pagina per sicurezza
            });
          } catch (error) {
            console.error("User denied account access or error occurred:", error);
            showNotification('error', 'Accesso a MetaMask negato. Per utilizzare l\'app, devi autorizzare la connessione.');
            setState(prevState => ({ ...prevState, isLoading: false }));
            return;
          }
        } 
        /*
        if (window.ethereum) {
          try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3Instance = new Web3(window.ethereum);
            console.log("Connected to MetaMask");
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
              console.log("Account changed:", accounts[0]);
              setState(prevState => ({ 
                ...prevState, 
                accounts 
              }));
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
              console.log("Network changed, reloading...");
              window.location.reload();
            });
          } catch (error) {
            console.error("User denied account access");
            showNotification('error', 'Accesso a MetaMask negato. Per favore autorizza la connessione.');
            setState(prevState => ({ ...prevState, isLoading: false }));
            return;
          }
        } */
        // Legacy dapp browsers
        else if (window.web3) {
          web3Instance = new Web3(window.web3.currentProvider);
          console.log("Connected to legacy web3 browser");
        } 
        // Fallback to local provider
        else {
          const provider = new Web3.providers.HttpProvider('HTTP://127.0.0.1:1337');
          web3Instance = new Web3(provider);
          console.log("Connected to local provider");
        }
        
        // Get accounts
        const accounts = await web3Instance.eth.getAccounts();
        console.log("Accounts:", accounts);
        
        // Get network ID
        const networkId = await web3Instance.eth.net.getId();
        console.log("Network ID:", networkId);
        
        // Initialize factory contract
        let factory = null;
        const deployedNetwork = FundraiserFactoryContract.networks[networkId];
        
        if (deployedNetwork) {
          factory = new web3Instance.eth.Contract(
            FundraiserFactoryContract.abi,
            deployedNetwork.address
          );
          console.log("Factory contract initialized:", deployedNetwork.address);
        } else {
          console.error("FundraiserFactory contract not deployed to detected network");
          showNotification('error', 'Contratto non trovato su questa rete. Assicurati di essere connesso alla rete corretta.');
        }
        
        setState(prevState => ({
          ...prevState,
          web3: web3Instance,
          accounts,
          factory,
          networkId,
          formData: {
            ...prevState.formData,
            beneficiary: accounts[0] || ''
          },
          isLoading: false
        }));
        
        if (factory) {
          // CORREZIONE: Rimossa la virgola in eccesso che causava l'errore di sintassi
          await loadFundraisers(web3Instance, factory, accounts);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        showNotification('error', 'Errore di inizializzazione. Controlla la console per i dettagli.');
        setState(prevState => ({ ...prevState, isLoading: false }));
      }
    };
    
    initWeb3();
  }, []);

  const loadFundraisers = async (web3Instance, factoryInstance, accountsArray) => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      // Use passed instances or state instances
      const web3 = web3Instance || state.web3;
      const factory = factoryInstance || state.factory;
      const accounts = accountsArray || state.accounts;
      
      if (!factory || !web3 || !accounts.length) {
        console.error("Required instances not available");
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      console.log("Loading fundraisers...");
      const count = await factory.methods.fundraisersCount().call();
      console.log("Total fundraisers:", count);
      
      const fundraisers = [];
      
      if (parseInt(count) > 0) {
        const batchSize = 10;
        const maxFundraisersToShow = Math.min(parseInt(count), 30);
        
        for (let i = 0; i < maxFundraisersToShow; i += batchSize) {
          const limit = Math.min(batchSize, maxFundraisersToShow - i);
          console.log(`Loading batch: offset=${i}, limit=${limit}`);
          
          try {
            const fundraisersAddresses = await factory.methods.fundraisers(limit, i).call();
            console.log("Fundraiser addresses:", fundraisersAddresses);
            
            for (let j = 0; j < fundraisersAddresses.length; j++) {
              try {
                const fundraiserAddress = fundraisersAddresses[j];
                const fundraiserInstance = new web3.eth.Contract(
                  FundraiserContract.abi,
                  fundraiserAddress
                );
                
                console.log(`Loading details for fundraiser at ${fundraiserAddress}`);
                
                const [name, url, imageURL, description, totalDonations, donationsCount] = await Promise.all([
                  fundraiserInstance.methods.name().call(),
                  fundraiserInstance.methods.url().call(),
                  fundraiserInstance.methods.imageURL().call(),
                  fundraiserInstance.methods.description().call(),
                  fundraiserInstance.methods.totalDonations().call(),
                  fundraiserInstance.methods.donationsCount().call()
                ]);
                
                fundraisers.push({
                  address: fundraiserAddress,
                  name,
                  url,
                  imageURL,
                  description,
                  totalDonations: web3.utils.fromWei(totalDonations, 'ether'),
                  donationsCount,
                  contract: fundraiserInstance
                });
                
                console.log(`Loaded fundraiser: ${name}`);
              } catch (error) {
                console.error(`Error loading fundraiser at index ${j}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error loading batch at offset ${i}:`, error);
          }
        }
      }
      
      console.log(`Loaded ${fundraisers.length} fundraisers`);
      setState(prevState => ({ 
        ...prevState, 
        fundraisers, 
        isLoading: false 
      }));
    } catch (error) {
      console.error("Error loading fundraisers:", error);
      showNotification('error', 'Errore nel caricamento delle raccolte fondi.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prevState => ({
      ...prevState,
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

  const handleDonationAmountChange = (e) => {
    try {
      if (e && e.target && e.target.value !== undefined) {
        const value = e.target.value || '0.01';
        console.log("Donation amount changed:", value);
        
        setState(prevState => ({
          ...prevState,
          donationAmount: value
        }));
      }
    } catch (error) {
      console.error("Error in handleDonationAmountChange:", error);
    }
  };

  const selectFundraiser = async (fundraiser) => {
    try {
      console.log("Selecting fundraiser:", fundraiser.name);
      setState(prevState => ({ 
        ...prevState, 
        selectedFundraiser: fundraiser,
        activeTab: 'details',
        isLoading: true
      }));
      
      // Reset user donations
      setState(prevState => ({
        ...prevState,
        userDonations: {
          values: [],
          dates: []
        }
      }));
      
      // Get user donations for this fundraiser if any
      if (fundraiser.contract && state.accounts.length > 0) {
        try {
          console.log("Checking user donations...");
          const myDonationsCount = await fundraiser.contract.methods.myDonationsCount().call({ from: state.accounts[0] });
          console.log("User donations count:", myDonationsCount);
          
          if (parseInt(myDonationsCount) > 0) {
            const { values, dates } = await fundraiser.contract.methods.myDonations().call({ from: state.accounts[0] });
            console.log("User donations:", { values, dates });
            
            setState(prevState => ({
              ...prevState,
              userDonations: {
                values: values.map(val => state.web3.utils.fromWei(val, 'ether')),
                dates: dates.map(date => new Date(date * 1000).toLocaleString())
              }
            }));
          }
        } catch (error) {
          console.error("Error loading user donations:", error);
        }
      }
      
      setState(prevState => ({ ...prevState, isLoading: false }));
    } catch (error) {
      console.error("Error selecting fundraiser:", error);
      showNotification('error', 'Errore nel caricamento dei dettagli della raccolta fondi.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const createFundraiser = async (e) => {
    e.preventDefault();
    
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { factory, accounts, formData, web3 } = state;
      const { name, url, imageURL, description, beneficiary } = formData;
      
      // Validate input
      if (!name || !url || !imageURL || !description || !beneficiary) {
        showNotification('error', 'Compila tutti i campi richiesti.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate accounts
      if (!accounts.length) {
        showNotification('error', 'Nessun account disponibile. Accedi a MetaMask.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate beneficiary address
      if (!web3.utils.isAddress(beneficiary)) {
        showNotification('error', 'Indirizzo beneficiario non valido.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      console.log("Creating fundraiser:", { name, url, imageURL, description, beneficiary });
      console.log("Using account:", accounts[0]);
      
      const result = await factory.methods.createFundraiser(
        name,
        url,
        imageURL,
        description,
        beneficiary
      ).send({ 
        from: accounts[0],
        gas: 3000000 // Specify gas limit explicitly
      });
      
      console.log("Fundraiser created:", result);
      
      // Reset form
      setState(prevState => ({
        ...prevState,
        formData: {
          name: '',
          url: '',
          imageURL: '',
          description: '',
          beneficiary: accounts[0] || ''
        }
      }));
      
      showNotification('success', 'Raccolta fondi creata con successo!');
      
      // Reload fundraisers
      await loadFundraisers();
      
      // Switch back to home tab
      setState(prevState => ({ 
        ...prevState, 
        activeTab: 'home', 
        isLoading: false 
      }));
    } catch (error) {
      console.error("Error creating fundraiser:", error);
      const errorMessage = error.message ? error.message.substring(0, 100) + '...' : 'Errore sconosciuto';
      showNotification('error', `Errore nella creazione: ${errorMessage}`);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };
/*
  const donate = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts, web3, donationAmount } = state;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'Nessuna raccolta fondi selezionata.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      if (!accounts.length) {
        showNotification('error', 'Nessun account disponibile. Accedi a MetaMask.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate donation amount
      const amount = parseFloat(donationAmount);
      if (isNaN(amount) || amount <= 0) {
        showNotification('error', 'Importo donazione non valido.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      const amountInWei = web3.utils.toWei(donationAmount.toString(), 'ether');
      console.log(`Donating ${donationAmount} ETH (${amountInWei} wei) to ${selectedFundraiser.name}`);
      
      const result = await selectedFundraiser.contract.methods.donate().send({
        from: accounts[0],
        value: amountInWei,
        gas: 200000 // Specify gas limit explicitly
      });
      
      console.log("Donation result:", result);
      showNotification('success', 'Donazione inviata con successo!');
      
      // Reload fundraisers to update totals
      await loadFundraisers();
      
      // Reload selected fundraiser details
      const updatedFundraiser = state.fundraisers.find(f => f.address === selectedFundraiser.address);
      if (updatedFundraiser) {
        await selectFundraiser(updatedFundraiser);
      }
      
      setState(prevState => ({ ...prevState, isLoading: false }));
    } catch (error) {
      console.error("Error donating:", error);
      const errorMessage = error.message ? error.message.substring(0, 100) + '...' : 'Errore sconosciuto';
      showNotification('error', `Errore nella donazione: ${errorMessage}`);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };
*/
 /*******************************/
 const donate = async () => {
  try {
    setState(prevState => ({ ...prevState, isLoading: true }));
    
    const { selectedFundraiser, donationAmount } = state;
    
    if (!selectedFundraiser || !selectedFundraiser.contract) {
      showNotification('error', 'Nessuna raccolta fondi selezionata.');
      setState(prevState => ({ ...prevState, isLoading: false }));
      return;
    }
    
    // Verifica MetaMask
    if (!window.ethereum) {
      showNotification('error', 'MetaMask non rilevato. Per favore installa MetaMask.');
      setState(prevState => ({ ...prevState, isLoading: false }));
      return;
    }
    
    // Imposta un timeout per la transazione
    let timeoutId = setTimeout(() => {
      showNotification('error', 'La transazione sta impiegando troppo tempo. Potrebbe essere bloccata in MetaMask.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }, 60000); // 60 secondi di timeout
    
    try {
      // Richiedi gli account a MetaMask (usando il metodo più recente)
      const freshAccounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      console.log("Connected accounts:", freshAccounts);
      
      if (!freshAccounts || freshAccounts.length === 0) {
        clearTimeout(timeoutId);
        showNotification('error', 'Nessun account MetaMask disponibile.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Crea una nuova istanza Web3
      const freshWeb3 = new Web3(window.ethereum);
      
      // Controlla il networkId
      const networkId = await freshWeb3.eth.net.getId();
      console.log("Current network ID:", networkId);
      
      // Verifica se il contratto esiste in questa rete
      if (!FundraiserContract.networks[networkId]) {
        clearTimeout(timeoutId);
        showNotification('error', `Il contratto non è distribuito sulla rete attuale (${getNetworkName(networkId)}). Cambia rete in MetaMask.`);
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate donation amount
      const amount = parseFloat(donationAmount);
      if (isNaN(amount) || amount <= 0) {
        clearTimeout(timeoutId);
        showNotification('error', 'Importo donazione non valido.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Converti l'importo in wei
      const amountInWei = freshWeb3.utils.toWei(donationAmount.toString(), 'ether');
      console.log(`Donating ${donationAmount} ETH (${amountInWei} wei) to ${selectedFundraiser.name}`);
      console.log(`Using account: ${freshAccounts[0]}`);
      
      // Controlla il saldo prima di procedere
      const balance = await freshWeb3.eth.getBalance(freshAccounts[0]);
      console.log(`Account balance: ${freshWeb3.utils.fromWei(balance, 'ether')} ETH`);
      
      if (new freshWeb3.utils.BN(balance).lt(new freshWeb3.utils.BN(amountInWei))) {
        clearTimeout(timeoutId);
        showNotification('error', 'Saldo ETH insufficiente per effettuare questa donazione.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Crea una nuova istanza del contratto
      const fundraiserContract = new freshWeb3.eth.Contract(
        FundraiserContract.abi,
        selectedFundraiser.address
      );
      
      // Imposta gas alto ma non eccessivo
      const GAS = 500000;
      
      console.log("Sending transaction with params:", {
        from: freshAccounts[0],
        value: amountInWei,
        gas: GAS
      });
      
      // Invia la transazione con un gestore di eventi
      fundraiserContract.methods.donate().send({
        from: freshAccounts[0],
        value: amountInWei,
        gas: GAS
      })
      .on('transactionHash', (hash) => {
        console.log('Transaction hash:', hash);
        showNotification('success', `Transazione inviata! Hash: ${hash.substring(0, 10)}...`);
      })
      .on('receipt', (receipt) => {
        console.log('Transaction receipt:', receipt);
        clearTimeout(timeoutId);
        showNotification('success', 'Donazione completata con successo!');
        
        // Ricarica i dati
        loadFundraisers(freshWeb3, state.factory, freshAccounts);
        
        // Ricarica i dettagli della raccolta fondi
        if (state.fundraisers.length > 0) {
          const updatedFundraiser = state.fundraisers.find(f => f.address === selectedFundraiser.address);
          if (updatedFundraiser) {
            selectFundraiser(updatedFundraiser);
          }
        }
        
        setState(prevState => ({ ...prevState, isLoading: false }));
      })
      .on('confirmation', (confirmationNumber, receipt) => {
        console.log(`Confirmation #${confirmationNumber}`, receipt);
        if (confirmationNumber === 1) {
          // Prima conferma ricevuta
          clearTimeout(timeoutId);
          setState(prevState => ({ ...prevState, isLoading: false }));
        }
      })
      .on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('Transaction error:', error);
        
        if (error.code === 4001) {
          showNotification('error', 'Transazione rifiutata dall\'utente.');
        } else if (error.message && error.message.includes('insufficient funds')) {
          showNotification('error', 'Fondi insufficienti per completare la donazione.');
        } else {
          showNotification('error', `Errore nella transazione: ${error.message || 'Errore sconosciuto'}`);
        }
        
        setState(prevState => ({ ...prevState, isLoading: false }));
      });
      
      // Aggiorna gli account nello stato per futuri utilizzi
      setState(prevState => ({ 
        ...prevState, 
        accounts: freshAccounts,
        web3: freshWeb3
      }));
      
    } catch (innerError) {
      clearTimeout(timeoutId);
      console.error("Inner error:", innerError);
      showNotification('error', `Errore: ${innerError.message || 'Errore sconosciuto'}`);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
    
  } catch (outerError) {
    console.error("Error donating:", outerError);
    showNotification('error', `Errore nella donazione: ${outerError.message || 'Errore sconosciuto'}`);
    setState(prevState => ({ ...prevState, isLoading: false }));
  }
};
 /***************************** */

  const withdraw = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts } = state;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'Nessuna raccolta fondi selezionata.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      if (!accounts.length) {
        showNotification('error', 'Nessun account disponibile. Accedi a MetaMask.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      console.log(`Withdrawing funds from ${selectedFundraiser.name}`);
      
      const result = await selectedFundraiser.contract.methods.withdraw().send({
        from: accounts[0],
        gas: 200000 // Specify gas limit explicitly
      });
      
      console.log("Withdrawal result:", result);
      showNotification('success', 'Fondi prelevati con successo!');
      
      // Reload fundraisers to update totals
      await loadFundraisers();
      
      // Reload selected fundraiser details
      const updatedFundraiser = state.fundraisers.find(f => f.address === selectedFundraiser.address);
      if (updatedFundraiser) {
        await selectFundraiser(updatedFundraiser);
      }
      
      setState(prevState => ({ ...prevState, isLoading: false }));
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      const errorMessage = error.message ? error.message.substring(0, 100) + '...' : 'Errore sconosciuto';
      showNotification('error', `Errore nel prelievo: ${errorMessage}`);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const changeBeneficiary = async () => {
/*
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts, web3 } = state;
      const newBeneficiary = document.getElementById('newBeneficiaryAddress')?.value;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'Nessuna raccolta fondi selezionata.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      if (!accounts.length) {
        showNotification('error', 'Nessun account disponibile. Accedi a MetaMask.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      if (!newBeneficiary) {
        showNotification('error', 'Inserisci un indirizzo beneficiario.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate beneficiary address
      if (!web3.utils.isAddress(newBeneficiary)) {
        showNotification('error', 'Indirizzo beneficiario non valido.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      console.log(`Changing beneficiary for ${selectedFundraiser.name} to ${newBeneficiary}`);
      
      const result = await selectedFundraiser.contract.methods.setBeneficiary(newBeneficiary).send({
        from: accounts[0],
        gas: 100000 // Specify gas limit explicitly
      });
      
      console.log("Beneficiary change result:", result);
      showNotification('success', 'Beneficiario cambiato con successo!');
      
      // Clear input field
      if (document.getElementById('newBeneficiaryAddress')) {
        document.getElementById('newBeneficiaryAddress').value = '';
      }
      
      // Reload fundraisers
      await loadFundraisers();
      
      // Reload selected fundraiser details
      const updatedFundraiser = state.fundraisers.find(f => f.address === selectedFundraiser.address);
      if (updatedFundraiser) {
        await selectFundraiser(updatedFundraiser);
      }
      
      setState(prevState => ({ ...prevState, isLoading: false }));
    } catch (error) {
      console.error("Error changing beneficiary:", error);
      const errorMessage = error.message ? error.message.substring(0, 100) + '...' : 'Errore sconosciuto';
      showNotification('error', `Errore nel cambio beneficiario: ${errorMessage}`);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
*/
  };
/*
  // Aggiungi questo componente alla tua UI
  const MetaMaskAccountHelper = () => (
    <Alert variant="info" className="mb-4">
      <Alert.Heading>Seleziona un altro account MetaMask</Alert.Heading>
      <p>
        Attualmente stai utilizzando l'account: <strong>{state.accounts[0]}</strong>
      </p>
      <hr />
      <p className="mb-0">
        Per utilizzare un account diverso, segui questi passaggi:
      </p>
      <ol>
        <li>Clicca sull'icona di MetaMask nella barra degli strumenti del browser</li>
        <li>Nella finestra di MetaMask, clicca sul profilo account in alto a destra</li>
        <li>Seleziona l'account che desideri utilizzare</li>
        <li>La pagina si aggiornerà automaticamente con il nuovo account selezionato</li>
      </ol>
      <Button 
        variant="primary" 
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        Ricarica la pagina dopo aver cambiato account
      </Button>
    </Alert>
  );*/

  const fetchAllAccounts = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      // Richiedi l'accesso a MetaMask
      await window.ethereum.enable();
      
      // Ottieni gli account (questo restituirà solo l'account attualmente selezionato)
      const currentAccount = await window.ethereum.request({ method: 'eth_accounts' });
      
      // Mostra informazioni all'utente
      showNotification('info', 
        'MetaMask mostra solo l\'account attualmente selezionato. ' +
        'Per usare un altro account, selezionalo direttamente in MetaMask.'
      );
      
      setState(prevState => ({ 
        ...prevState, 
        accounts: currentAccount,
        isLoading: false 
      }));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      showNotification('error', 'Errore nell\'ottenere gli account: ' + error.message);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };
  // 3. Componente UI da aggiungere sotto le informazioni di rete
  /*
  const AccountInfoSection = () => (
    <div className="text-center mb-4">
      <h5>Account MetaMask</h5>
      {state.accounts.length > 0 ? (
        <div>
          <p>
            Account attivo: <code>{state.accounts[0]}</code>
          </p>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => {
              window.open('', '_blank').focus();
              showNotification('info', 'Apri MetaMask per cambiare account');
            }}
          >
            Cambia Account in MetaMask
          </Button>
        </div>
      ) : (
        <Button 
          variant="primary"
          onClick={fetchAllAccounts}
        >
          Connetti Account MetaMask
        </Button>
      )}
      
      <Alert variant="info" className="mt-3 small">
        <i className="bi bi-info-circle me-2"></i>
        Per utilizzare un account diverso, selezionalo direttamente nell'estensione MetaMask
        e poi ricarica questa pagina.
      </Alert>
    </div>
  );*/
  // Funzione per forzare l'aggiornamento dell'account attuale
  const refreshCurrentAccount = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      // Aggiorna l'accesso agli account
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Ottieni l'account attualmente selezionato
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log("Current MetaMask account:", accounts[0]);
      
      // Aggiorna lo stato con il nuovo account
      setState(prevState => ({ 
        ...prevState, 
        accounts: accounts,
        formData: {
          ...prevState.formData,
          beneficiary: accounts[0] || ''
        },
        isLoading: false
      }));
      
      showNotification('success', 'Account aggiornato con successo!');
      
      // Ricarica i fundraisers con il nuovo account
      if (state.factory && accounts.length > 0) {
        await loadFundraisers(state.web3, state.factory, accounts);
      }
    } catch (error) {
      console.error("Error refreshing account:", error);
      showNotification('error', 'Errore nell\'aggiornamento dell\'account: ' + error.message);
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  // Tabs management
  const setActiveTab = (tab) => {
    setState(prevState => ({
      ...prevState,
      activeTab: tab,
      // Reset selected fundraiser when going back to home
      selectedFundraiser: tab === 'home' ? null : prevState.selectedFundraiser
    }));
  };

  // Network info
  const getNetworkName = (networkId) => {
    switch (networkId) {
      case 1: return 'Ethereum Mainnet';
      case 3: return 'Ropsten Testnet';
      case 4: return 'Rinkeby Testnet';
      case 5: return 'Goerli Testnet';
      case 42: return 'Kovan Testnet';
      case 1337: return 'Localhost 1337';
      case 5777: return 'Ganache Local';
      default: return `Network ID: ${networkId}`;
    }
  };

  if (!state.web3 && state.isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </Spinner>
        <p className="mt-3">Connessione alla blockchain in corso...</p>
      </Container>
    );
  }

  // Funzione di debug per verificare l'account corrente
  const checkCurrentAccount = async () => {
    console.log("=== ACCOUNT DEBUG INFO ===");
    
    // Controlla se MetaMask è disponibile
    console.log("MetaMask available:", typeof window.ethereum !== 'undefined');
    
    if (window.ethereum) {
      try {
        // Metodo eth_accounts (non richiede autorizzazione)
        const ethAccounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log("eth_accounts result:", ethAccounts);
        
        // Metodo eth_requestAccounts (richiede autorizzazione)
        try {
          const requestedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("eth_requestAccounts result:", requestedAccounts);
        } catch (reqError) {
          console.error("eth_requestAccounts error:", reqError);
        }
        
        // Account nello stato dell'app
        console.log("App state accounts:", state.accounts);
        
        // Dettagli dell'account selezionato in MetaMask (se disponibile)
        if (ethAccounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [ethAccounts[0], 'latest']
          });
          console.log("Selected account balance:", Web3.utils.fromWei(balance, 'ether'), "ETH");
        }
      } catch (error) {
        console.error("Error checking accounts:", error);
      }
    }
    
    console.log("========================");
  };

return (
  <Container className="mt-4 mb-5">
    <h1 className="text-center mb-2">Piattaforma di Fundraiser</h1>
    
    {/* Network Info */}
    <div className="text-center mb-4">
      <span className="badge bg-secondary">
        Network: {state.networkId ? getNetworkName(state.networkId) : 'Non connesso'}
      </span>
      {state.accounts.length > 0 && (
        <span className="ms-2 badge bg-success" onClick={refreshCurrentAccount} title="Click to refresh Current Account">
          Account: {state.accounts[0].substring(0, 6)}...{state.accounts[0].substring(38)}
        </span>
      )}
<Button
  variant="outline-secondary"
  size="sm"
  className="ms-2"
  onClick={checkCurrentAccount}
>
  Debug Account
</Button>
    </div>
    { /* <AccountInfoSection></AccountInfoSection> */ }
    
    {/* Connection Warning */}
    {(!state.web3 || !state.factory) && (
      <Alert variant="warning" className="mb-4">
        <Alert.Heading>Attenzione alla connessione!</Alert.Heading>
        <p>
          {!state.web3 ? 
            'Non sei connesso a Web3. Installa MetaMask o un altro provider Web3.' : 
            'Contratto non trovato su questa rete. Assicurati di essere connesso alla rete corretta.'
          }
        </p>
      </Alert>
    )}
    
    {/* Notification */}
    {state.notification.show && (
      <Alert 
        variant={state.notification.type === 'success' ? 'success' : 'danger'}
        onClose={() => setState(prevState => ({
          ...prevState, 
          notification: { ...prevState.notification, show: false }
        }))}
        dismissible
      >
        {state.notification.message}
      </Alert>
    )}

    {/*!state.accounts.length && (
      <div className="text-center mb-4">
        <Alert variant="warning">
          <Alert.Heading>Connessione a MetaMask richiesta</Alert.Heading>
          <p>Per utilizzare tutte le funzionalità dell'app, connetti il tuo wallet MetaMask.</p>
          <Button 
            variant="primary" 
            onClick={async () => {
              try {
                const accounts = await window.ethereum.request({ 
                  method: 'eth_requestAccounts' 
                });
                console.log("Connected accounts:", accounts);
                setState(prevState => ({ 
                  ...prevState, 
                  accounts 
                }));
                showNotification('success', 'MetaMask connesso con successo!');
              } catch (error) {
                console.error("Connection error:", error);
                showNotification('error', 'Errore di connessione a MetaMask. Riprova.');
              }
            }}
          >
            Connetti MetaMask
          </Button>
        </Alert>
      </div>
    )*/}
    
    {/* Loading overlay */}
    {state.isLoading && (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="bg-white p-4 rounded">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </Spinner>
          <p className="mt-2 mb-0">Elaborazione in corso... Attendere prego</p>
        </div>
      </div>
    )}
    
    {/* Navigation */}
    <Tab.Container activeKey={state.activeTab} onSelect={setActiveTab}>
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link eventKey="home">Raccolte Fondi</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="create">Crea Nuova</Nav.Link>
        </Nav.Item>
        {state.selectedFundraiser && (
          <Nav.Item>
            <Nav.Link eventKey="details">Dettagli</Nav.Link>
          </Nav.Item>
        )}
      </Nav>
      
      <Tab.Content>
        {/* Home Tab - List of Fundraisers */}
        <Tab.Pane eventKey="home">
          <h2 className="mb-3">Raccolte Fondi Attive</h2>
          {!state.factory ? (
            <Alert variant="warning">
              Contratto non disponibile. Verifica la connessione alla rete corretta.
            </Alert>
          ) : state.fundraisers.length === 0 ? (
            <p>Nessuna raccolta fondi trovata. Sii il primo a crearne una!</p>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {state.fundraisers.map((fundraiser, idx) => (
                <Col key={idx}>
                  <Card className="h-100 shadow-sm">
                    <Card.Img 
                      variant="top" 
                      src={fundraiser.imageURL} 
                      onError={(e) => {
                        e.target.onerror = null;
                        //e.target.src = 'https://via.placeholder.com/300x200?text=Nessuna+Immagine';
                      }}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body>
                      <Card.Title>{fundraiser.name}</Card.Title>
                      <Card.Text className="text-truncate">{fundraiser.description}</Card.Text>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">
                            Totale: {fundraiser.totalDonations} ETH
                          </small>
                          <br />
                          <small className="text-muted">
                            Donazioni: {fundraiser.donationsCount}
                          </small>
                        </div>
                        <Button 
                          variant="primary" 
                          onClick={() => selectFundraiser(fundraiser)}
                        >
                          Visualizza
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Tab.Pane>
        
        {/* Create New Fundraiser Tab */}
        <Tab.Pane eventKey="create">
          <h2 className="mb-3">Crea Nuova Raccolta Fondi</h2>
          {!state.factory ? (
            <Alert variant="warning">
              Contratto non disponibile. Verifica la connessione alla rete corretta.
            </Alert>
          ) : !state.accounts.length ? (
            <Alert variant="warning">
              Nessun account disponibile. Accedi a MetaMask.
            </Alert>
          ) : (
            <Card className="shadow-sm">
              <Card.Body>
                <Form onSubmit={createFundraiser}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nome</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="name" 
                          value={state.formData.name}
                          onChange={handleInputChange}
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>URL</Form.Label>
                        <Form.Control 
                          type="url" 
                          name="url" 
                          value={state.formData.url}
                          onChange={handleInputChange}
                          required 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>URL Immagine</Form.Label>
                    <Form.Control 
                      type="url" 
                      name="imageURL" 
                      value={state.formData.imageURL}
                      onChange={handleInputChange}
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Descrizione</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      name="description" 
                      value={state.formData.description}
                      onChange={handleInputChange}
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Indirizzo Beneficiario</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="beneficiary" 
                      value={state.formData.beneficiary}
                      onChange={handleInputChange}
                      required 
                    />
                    <Form.Text className="text-muted">
                      Questo è l'indirizzo Ethereum che riceverà i fondi.
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" size="lg">
                      Crea Raccolta Fondi
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Tab.Pane>
        
        {/* Fundraiser Details Tab */}
        <Tab.Pane eventKey="details">
          {!state.selectedFundraiser ? (
            <div className="text-center">
              <p>Nessuna raccolta fondi selezionata. Seleziona una raccolta fondi dall'elenco.</p>
              <Button variant="primary" onClick={() => setActiveTab('home')}>
                Vai all'Elenco delle Raccolte Fondi
              </Button>
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={5}>
                  <img 
                    src={state.selectedFundraiser.imageURL} 
                    alt={state.selectedFundraiser.name}
                    className="img-fluid rounded shadow"
                    onError={(e) => {
                      e.target.onerror = null;
                      //e.target.src = 'https://via.placeholder.com/600x400?text=Nessuna+Immagine';
                    }}
                    style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                  />
                </Col>
                <Col md={7}>
                  <h2>{state.selectedFundraiser.name}</h2>
                  <p className="lead">{state.selectedFundraiser.description}</p>
                  
                  <div className="mb-3">
                    <a 
                      href={state.selectedFundraiser.url.startsWith('http') 
                        ? state.selectedFundraiser.url 
                        : `https://${state.selectedFundraiser.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Visita il Sito
                    </a>
                  </div>
                  
                  <div className="mb-4">
                    <h5>Statistiche</h5>
                    <p className="mb-1">
                      <strong>Donazioni Totali:</strong> {state.selectedFundraiser.totalDonations} ETH
                    </p>
                    <p>
                      <strong>Numero di Donazioni:</strong> {state.selectedFundraiser.donationsCount}
                    </p>
                    <p>
                      <strong>Indirizzo Contratto:</strong> <code className="small">{state.selectedFundraiser.address}</code>
                    </p>
                  </div>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">Effettua una Donazione</h5>
                    </Card.Header>
                    <Card.Body>
                      {!state.accounts.length ? (
                        <Alert variant="warning">
                          Accedi a MetaMask per effettuare una donazione.
                        </Alert>
                      ) : (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Importo (ETH)</Form.Label>
                            <Form.Control 
                              type="number" 
                              min="0.001" 
                              step="0.001" 
                              value={state.donationAmount}
                              onChange={(e) => {
                                const val=e.target.value
                                if (e && e.target) {
                                  setState(prevState => ({
                                    ...prevState,
                                    donationAmount: val || '0.01'
                                  }));
                                }
                              }}
                            />
                          </Form.Group>
                          <div className="d-grid">
                            <Button variant="primary" onClick={donate}>
                              Dona
                            </Button>
                          </div>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h5 className="mb-0">Le Tue Donazioni</h5>
                    </Card.Header>
                    <Card.Body>
                      {!state.accounts.length ? (
                        <Alert variant="warning">
                          Accedi a MetaMask per vedere le tue donazioni.
                        </Alert>
                      ) : state.userDonations.values.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-striped table-sm">
                            <thead>
                              <tr>
                                <th>Importo (ETH)</th>
                                <th>Data</th>
                              </tr>
                            </thead>
                            <tbody>
                              {state.userDonations.values.map((value, idx) => (
                                <tr key={idx}>
                                  <td>{value}</td>
                                  <td>{state.userDonations.dates[idx]}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center mb-0">Non hai ancora effettuato donazioni a questa raccolta fondi.</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-secondary text-white">
                  <h5 className="mb-0">Funzioni Proprietario</h5>
                </Card.Header>
                <Card.Body>
                  {!state.accounts.length ? (
                    <Alert variant="warning">
                      Accedi a MetaMask per gestire la raccolta fondi.
                    </Alert>
                  ) : (
                    <>
                      <p className="text-muted mb-3">Queste funzioni sono accessibili solo al proprietario della raccolta fondi.</p>
                      
                      <Row>
                        <Col md={6}>
                          <Card className="mb-3">
                            <Card.Body>
                              <h6>Preleva Fondi</h6>
                              <p className="small text-muted">Invia tutti i fondi raccolti all'indirizzo beneficiario.</p>
                              <div className="d-grid">
                                <Button variant="warning" onClick={withdraw}>
                                  Preleva
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        
                        <Col md={6}>
                          <Card>
                            <Card.Body>
                              <h6>Cambia Beneficiario</h6>
                              <Form.Group className="mb-3">
                                <Form.Control 
                                  type="text" 
                                  placeholder="Nuovo indirizzo beneficiario" 
                                  id="newBeneficiaryAddress"
                                />
                              </Form.Group>
                              <div className="d-grid">
                                <Button 
                                  variant="info" 
                                  onClick={changeBeneficiary}
                                >
                                  Aggiorna Beneficiario
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
    
    {/* Footer */}
    <footer className="mt-5 text-center text-muted">
      <hr />
      <p>Fundraiser Platform &copy; {new Date().getFullYear()}</p>
      <p className="small">
        Connesso a: {state.networkId ? getNetworkName(state.networkId) : 'Non connesso'} | 
        {state.accounts.length > 0 ? ` Account: ${state.accounts[0].substring(0, 6)}...${state.accounts[0].substring(38)}` : ' Nessun account connesso'}
      </p>
    </footer>
  </Container>
);
};

export default App;