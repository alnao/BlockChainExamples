import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleTokenABI from './SimpleTokenABI.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [symbol, setSymbol] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [gasLimit, setGasLimit] = useState('');

  // Inizializza Web3 e il contratto
  /*
  const initWeb3 = async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask non è installato.');
      return;
    }


    try {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Richiedi l'accesso agli account
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Ottieni e stampa il network ID
      const network = await web3Instance.eth.net.getId();
      console.log('Current Network ID:', network);
      
      // Stampa le reti disponibili nel contratto
      console.log('Available networks in contract:', SimpleTokenABI.networks);
      
      setNetworkId(network);
      await initContract(web3Instance, network);

    } catch (err) {
        console.error('Errore durante l\'inizializzazione:', err);
        setError('Errore di connessione: ' + err.message);
    }
  };
  */
  const initWeb3 = async () => {
    try {
      console.log('Iniziando inizializzazione Web3...');
      
      if (!window.ethereum) {
        throw new Error('MetaMask non è installato');
      }
  
      // Configurazione provider
      const providerUrl = 'http://127.0.0.1:7545';
      const provider = new Web3.providers.HttpProvider(providerUrl);
      const web3Instance = new Web3(provider);
      
      console.log('Provider configurato:', providerUrl);
      setWeb3(web3Instance);
  
      // Test connessione base
      const isConnected = await web3Instance.eth.net.isListening();
      console.log('Connessione stabilita:', isConnected);
  
      // Richiedi gli account
      const accounts = await web3Instance.eth.getAccounts();
      console.log('Account disponibili:', accounts);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        console.log('Account selezionato:', accounts[0]);
      }
  
      // Verifica network
      const networkId = await web3Instance.eth.net.getId();
      console.log('Network ID:', networkId);
      setNetworkId(networkId);
  
      // Inizializza il contratto
      await initContract(web3Instance, networkId);
  
      console.log('Inizializzazione Web3 completata con successo');
    } catch (err) {
      console.error('Errore dettagliato durante l\'inizializzazione:', err);
      setError('Errore di inizializzazione: ' + err.message);
    }
  };

  // Gestisce il cambio di account
  const handleAccountChange = async (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      if (contract) {
        await loadBalance(contract, accounts[0]);
      }
    } else {
      setAccount('');
      setBalance('0');
    }
  };

  // Gestisce il cambio di rete
  const handleChainChange = () => {
    window.location.reload();
  };

  const checkContractDetails = async () => {
    try {
      console.log('Verifica dettagli contratto...');
      console.log('Contract address:', contract.options.address);
      console.log('Contract ABI:', contract.options.jsonInterface);
      
      // Verifica owner del contratto
      const totalSupply = await contract.methods.totalSupply().call();
      console.log('Total Supply:', web3.utils.fromWei(totalSupply, 'ether'));
      
      // Verifica il balance dell'owner originale
      const deployerAddress = SimpleTokenABI.networks[networkId].address;
      const deployerBalance = await contract.methods.balanceOf(deployerAddress).call();
      console.log('Deployer address:', deployerAddress);
      console.log('Deployer balance:', web3.utils.fromWei(deployerBalance, 'ether'));
      
    } catch (error) {
      console.error('Errore verifica contratto:', error);
    }
  };


  // Inizializza il contratto
  /*
  const initContract = async (web3Instance, networkId) => {
    try {
        console.log('Network ID:', networkId);
        console.log('Available networks:', SimpleTokenABI.networks);
        
        // Verifica se il contratto è deployato sulla rete corrente
        const deployedNetwork = SimpleTokenABI.networks[networkId];
        if (!deployedNetwork) {
            setError(`Contratto non trovato sulla rete ${networkId}. Assicurati di essere connesso a Ganache (5777)`);
            return;
        }

        const contractAddress = deployedNetwork.address;
        console.log('Contract address:', contractAddress);

        const instance = new web3Instance.eth.Contract(
            SimpleTokenABI.abi,
            contractAddress
        );

        setContract(instance);

        // Carica i dettagli del token
        const tokenSymbol = await instance.methods.symbol().call();
        setSymbol(tokenSymbol);
  
        // Carica il balance iniziale
        if (account) {
          await loadBalance(instance, account);
        }
    } catch (err) {
        console.error('Errore durante l\'inizializzazione del contratto:', err);
        setError('Errore durante l\'inizializzazione del contratto: ' + err.message);
    }
  };*/

  // E modifichiamo initContract
  const initContract = async (web3Instance, networkId) => {
    try {
      console.log('Iniziando inizializzazione contratto...');
      console.log('Network ID per il contratto:', networkId);
      console.log('Networks disponibili:', SimpleTokenABI.networks);

      const networkData = SimpleTokenABI.networks[networkId];
      if (!networkData) {
        throw new Error(`Contratto non trovato sulla rete ${networkId}`);
      }

      console.log('Indirizzo contratto:', networkData.address);

      const instance = new web3Instance.eth.Contract(
        SimpleTokenABI.abi,
        networkData.address
      );

      setContract(instance);
      console.log('Contratto inizializzato con successo');

      // Test chiamata al contratto
      const symbol = await instance.methods.symbol().call();
      const name = await instance.methods.name().call();
      console.log('Dettagli token:', { symbol, name });

    } catch (err) {
      console.error('Errore dettagliato inizializzazione contratto:', err);
      throw new Error(`Errore inizializzazione contratto: ${err.message}`);
    }
  };



  // Carica il balance dell'account
  /*
  const loadBalance = async (contractInstance, accountAddress) => {
    try {
      const balance = await contractInstance.methods.balanceOf(accountAddress).call();
      const decimals = await contractInstance.methods.decimals().call();
      const formattedBalance = balance / Math.pow(10, decimals);
      setBalance(formattedBalance.toString());
      console.log('Balance raw:', balance);
      console.log('Decimals:', decimals);
      console.log('Formatted balance:', formattedBalance);
    } catch (err) {
      console.error('Errore durante il caricamento del balance:', err);
      setBalance('Errore');
    }
  };
  */
  const loadBalance = async (contractInstance, accountAddress) => {
    try {
      if (!contractInstance || !accountAddress) return;
  
      const balance = await contractInstance.methods.balanceOf(accountAddress).call();
      const formattedBalance = web3.utils.fromWei(balance, 'ether');
      const symbol = await contractInstance.methods.symbol().call();
      
      setBalance(formattedBalance);
      setSymbol(symbol);
      
      console.log('Balance raw:', balance);
      console.log('Balance in ether:', formattedBalance);
      console.log('Symbol:', symbol);
    } catch (err) {
      console.error('Errore durante il caricamento del balance:', err);
      setBalance('Errore');
    }
  };

  const formatBalance = (balance, decimals = 18) => {
    try {
      return web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Errore nella formattazione del balance:', error);
      return '0';
    }
  };

  // Gestisce il trasferimento di token
  /*
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validazione input
    if (!web3.utils.isAddress(recipient)) {
      setError('Indirizzo del destinatario non valido');
      setLoading(false);
      return;
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Importo non valido');
      setLoading(false);
      return;
    }

    try {
      const amountWei = web3.utils.toWei(amount, 'ether');
      const gasPriceWei = web3.utils.toWei(gasPrice || '5', 'gwei');
      const gasLimitNumber = parseInt(gasLimit || '100000');

      await contract.methods.transfer(recipient, amountWei).send({
        from: account,
        gasPrice: gasPriceWei,
        gas: gasLimitNumber
      });

      // Aggiorna il balance dopo il trasferimento
      await loadBalance(contract, account);
      
      // Reset form
      setAmount('');
      setRecipient('');
      setGasPrice('');
      setGasLimit('');

    } catch (err) {
      console.error('Errore durante il trasferimento:', err);
      setError('Errore durante il trasferimento. Controlla la console per i dettagli.');
    } finally {
      setLoading(false);
    }
  };*/
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      // Verifiche preliminari
      if (!contract || !account) {
        throw new Error('Contratto o account non inizializzati');
      }
  
      if (!recipient || !web3.utils.isAddress(recipient)) {
        throw new Error('Indirizzo destinatario non valido');
      }
  
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error('Importo non valido');
      }
  
      // Ottieni i decimali del token
      const decimals = await contract.methods.decimals().call();
      console.log('Decimali token:', decimals);
  
      // Converti l'importo in wei
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      console.log('Importo da inviare:', amountInWei);
  
      // Verifica balance
      const currentBalance = await contract.methods.balanceOf(account).call();
      console.log('Balance corrente:', currentBalance);
  
      // Confronto usando numeri normali
      const currentBalanceNumber = parseFloat(web3.utils.fromWei(currentBalance, 'ether'));
      const amountNumber = parseFloat(amount);
  
      console.log('Balance corrente in ether:', currentBalanceNumber);
      console.log('Importo da inviare in ether:', amountNumber);
  
      if (currentBalanceNumber < amountNumber) {
        throw new Error(`Balance insufficiente. Hai ${currentBalanceNumber} token`);
      }
  
      // Stima gas
      const gasEstimate = await contract.methods.transfer(recipient, amountInWei).estimateGas({
        from: account
      });
      console.log('Stima gas:', gasEstimate);
  
      // Imposta gas price e limit di default se non specificati
      const defaultGasPrice = '20'; // 20 gwei
      const defaultGasLimit = '100000'; // 100k gas
  
      // Usa i valori inseriti o i default
      const gasPriceToUse = web3.utils.toWei(gasPrice || defaultGasPrice, 'gwei');
      const gasLimitToUse = gasLimit || defaultGasLimit;
  
      console.log('Parametri transazione:', {
        from: account,
        to: recipient,
        value: amountInWei,
        gasPrice: gasPriceToUse,
        gas: gasLimitToUse
      });
  
      // Esegui transazione
      const tx = await contract.methods.transfer(recipient, amountInWei).send({
        from: account,
        gasPrice: gasPriceToUse,
        gas: gasLimitToUse
      });
  
      console.log('Transazione completata:', tx);
  
      // Aggiorna bilanci
      const newBalance = await contract.methods.balanceOf(account).call();
      const recipientBalance = await contract.methods.balanceOf(recipient).call();
      
      console.log('Nuovo balance mittente:', web3.utils.fromWei(newBalance, 'ether'));
      console.log('Nuovo balance destinatario:', web3.utils.fromWei(recipientBalance, 'ether'));
  
      // Reset form
      setAmount('');
      setRecipient('');
      setGasPrice('');
      setGasLimit('');
  
      alert('Trasferimento completato con successo!');
      await loadBalance(contract, account);
  
    } catch (error) {
      console.error('Errore dettagliato:', error);
      setError('Errore durante il trasferimento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnership = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      console.log('Account disponibili:', accounts);
      
      // Verifica il balance per ogni account
      for (let acc of accounts) {
        const balance = await contract.methods.balanceOf(acc).call();
        console.log(`Balance di ${acc}: ${web3.utils.fromWei(balance, 'ether')} tokens`);
      }
    } catch (error) {
      console.error('Errore verifica ownership:', error);
    }
  };

  const verifyContract = async () => {
    try {
      console.log('Verifica contratto...');
      
      // Verifica che il contratto sia inizializzato
      if (!contract || !contract.options.address) {
        throw new Error('Contratto non inizializzato correttamente');
      }
      
      // Verifica indirizzo contratto
      console.log('Indirizzo contratto:', contract.options.address);
      
      // Verifica account corrente
      if (!account) {
        throw new Error('Nessun account connesso');
      }
      console.log('Account corrente:', account);
      
      // Verifica balance dell'account
      const balance = await contract.methods.balanceOf(account).call();
      console.log('Balance account:', web3.utils.fromWei(balance, 'ether'));
      
      // Verifica total supply
      const totalSupply = await contract.methods.totalSupply().call();
      console.log('Total supply:', totalSupply.toString());
      
      // Verifica simbolo e nome
      const symbol = await contract.methods.symbol().call();
      const name = await contract.methods.name().call();
      console.log('Token details:', { symbol, name });
      
      // Verifica decimals
      const decimals = await contract.methods.decimals().call();
      console.log('Decimals:', decimals);
  
      alert(`Verifica contratto completata:
      - Nome: ${name}
      - Simbolo: ${symbol}
      - Decimali: ${decimals}
      - Balance: ${web3.utils.fromWei(balance, 'ether')} ${symbol}
      - Total Supply: ${totalSupply} (raw)
      `);
    } catch (error) {
      console.error('Errore verifica contratto:', error);
      setError('Errore verifica contratto: ' + error.message);
    }
  };

  // Effect iniziale
  useEffect(() => {
    initWeb3();

    // Cleanup listener al dismount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', handleChainChange);
      }
    };
  }, []);
  const connectWallet = async () => {
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
        await loadBalance(contract, accounts[0]);
        console.log("Connected account:", accounts[0]);
    } catch (error) {
        console.error("Errore durante la connessione del wallet:", error);
        setError("Errore durante la connessione del wallet: " + error.message);
    }
  };

  const switchToGanache = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x539' }], // 1337 in hex
        });
        
        // Attendiamo un momento per permettere a MetaMask di aggiornare lo stato
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Riconnettiamo il wallet
        await connectWallet();
        
        // Reinizializziamo Web3 e il contratto
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const network = await web3Instance.eth.net.getId();
        console.log('Current Network ID after switch:', network);
        setNetworkId(network);
        
        await initContract(web3Instance, network);

    } catch (error) {
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x539',
                        chainName: 'Ganache',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['http://127.0.0.1:7545']
                    }]
                });
                // Dopo aver aggiunto la rete, proviamo a connetterci
                await connectWallet();
            } catch (addError) {
                console.error('Errore durante l\'aggiunta della rete:', addError);
                setError('Errore durante l\'aggiunta della rete: ' + addError.message);
            }
        }
        console.error('Errore durante il cambio di rete:', error);
        setError('Errore durante il cambio di rete: ' + error.message);
    }
  };

  // Aggiungi questa funzione nel tuo componente App
  const sendTestEth = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      // Prendi il primo account di Ganache (che ha 100 ETH)
      const ganacheAccount = accounts[0];
      
      // Invia 1 ETH all'account MetaMask
      await web3.eth.sendTransaction({
        from: ganacheAccount,
        to: account,  // il tuo account MetaMask
        value: web3.utils.toWei('1', 'ether')
      });
      
      console.log('Test ETH inviati con successo');
    } catch (error) {
      console.error('Errore nell\'invio di test ETH:', error);
    }
  };
  const sendTestEth2 = async () => {
    try {
      // Prima verifica la connessione
      console.log('Verifico la connessione...');
      const networkId = await web3.eth.net.getId();
      console.log('Network ID:', networkId);
  
      // Ottieni tutti gli account di Ganache
      const ganacheAccounts = await web3.eth.getAccounts();
      console.log('Account disponibili:', ganacheAccounts);
  
      // Verifica i bilanci
      for (let acc of ganacheAccounts) {
        const balance = await web3.eth.getBalance(acc);
        console.log(`Balance di ${acc}: ${web3.utils.fromWei(balance, 'ether')} ETH`);
      }
  
      // Tenta l'invio da un account specifico di Ganache
      const ganacheAccount = ganacheAccounts[0]; // primo account di Ganache
      
      console.log('Invio ETH da:', ganacheAccount);
      console.log('A:', account);
      
      const tx = await web3.eth.sendTransaction({
        from: ganacheAccount,
        to: account,
        value: web3.utils.toWei('1', 'ether'),
        gas: '21000',  // gas limit esplicito
        gasPrice: await web3.eth.getGasPrice() // gas price corrente
      });
      
      console.log('Transazione completata:', tx);
    } catch (error) {
      console.error('Errore dettagliato:', error);
      setError('Errore nell\'invio di ETH: ' + error.message);
    }
  };

  const checkSetup = async () => {
    try {
      // Verifica il network
      const networkId = await web3.eth.net.getId();
      console.log('Network ID:', networkId);
  
      // Verifica il balance
      const balance = await web3.eth.getBalance(account);
      console.log('Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
  
      // Verifica il gas price
      const gasPrice = await web3.eth.getGasPrice();
      console.log('Gas Price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
  
      // Verifica che il contratto sia deployato
      console.log('Contract address:', contract.options.address);
    } catch (error) {
      console.error('Error checking setup:', error);
    }
  };
  const testConnection = async () => {
    try {
      setError('');
      console.log('Inizio test connessione...');
      
      // Verifica che web3 sia inizializzato
      if (!web3) {
        throw new Error('Web3 non è inizializzato');
      }
      console.log('Versione Web3:', web3.version);
      
      // Test connessione base
      const isConnected = await web3.eth.net.isListening();
      console.log('Web3 connesso:', isConnected);
      
      // Ottieni network ID
      const networkId = await web3.eth.net.getId();
      console.log('Network ID:', networkId);
      
      // Ottieni chainId
      const chainId = await web3.eth.getChainId();
      console.log('Chain ID:', chainId);
      
      // Ottieni accounts
      const accounts = await web3.eth.getAccounts();
      console.log('Account disponibili:', accounts);
      
      // Ottieni il balance dell'account corrente
      if (account) {
        const balance = await web3.eth.getBalance(account);
        console.log('Balance dell\'account corrente:', web3.utils.fromWei(balance, 'ether'), 'ETH');
      }
      
      // Ottieni gas price
      const gasPrice = await web3.eth.getGasPrice();
      console.log('Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'gwei');
  
      // Verifica il contratto
      if (contract) {
        console.log('Indirizzo del contratto:', contract.options.address);
        try {
          const symbol = await contract.methods.symbol().call();
          const name = await contract.methods.name().call();
          const totalSupply = await contract.methods.totalSupply().call();
          console.log('Dettagli token:', { symbol, name, totalSupply });
        } catch (err) {
          console.error('Errore nella lettura dei dettagli del token:', err);
        }
      } else {
        console.log('Contratto non inizializzato');
      }
  
      alert('Test connessione completato. Controlla la console per i dettagli.');
    } catch (error) {
      console.error('Test connessione fallito:', error);
      setError('Test connessione fallito: ' + error.message);
    }
  };
  const checkGanacheConnection = async () => {
    try {
      setError('');
      console.log('Iniziando verifica connessione Ganache...');
  
      // 1. Verifica Web3
      if (!web3) {
        throw new Error('Web3 non è inizializzato');
      }
      console.log('Web3 inizializzato correttamente');
  
      // 2. Verifica Provider
      const provider = web3.currentProvider;
      console.log('Provider corrente:', provider);
  
      // 3. Verifica Network
      const networkId = await web3.eth.net.getId();
      console.log('Network ID attuale:', networkId);
  
      // 4. Verifica Chain ID
      const chainId = await web3.eth.getChainId();
      console.log('Chain ID attuale:', chainId);
  
      // 5. Verifica connessione
      const isConnected = await web3.eth.net.isListening();
      console.log('Connessione attiva:', isConnected);
  
      // 6. Verifica account
      const accounts = await web3.eth.getAccounts();
      console.log('Account disponibili:', accounts);
  
      // 7. Verifica bilanci
      if (accounts.length > 0) {
        for (let acc of accounts) {
          const balance = await web3.eth.getBalance(acc);
          console.log(`Balance di ${acc}: ${web3.utils.fromWei(balance, 'ether')} ETH`);
        }
      }
  
      // 8. Verifica blocco corrente
      const block = await web3.eth.getBlock('latest');
      console.log('Ultimo blocco:', block.number);
  
      alert('Verifica completata con successo! Controlla la console per i dettagli.');
    } catch (error) {
      console.error('Errore dettagliato:', error);
      setError('Errore di verifica: ' + error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">SimpleToken Interface</h1>

      {/*<div className="mb-4">
            <button 
                onClick={switchToGanache}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
                Passa a Ganache
            </button>
            
            <button 
                onClick={connectWallet}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Connetti Wallet
            </button>

            <button 
              onClick={sendTestEth}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              Ottieni Test ETH
            </button>

            <button 
              onClick={checkSetup}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Verifica Setup
            </button>

            <button 
              onClick={testConnection}
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              Test Connessione
            </button>
            
            <button 
              onClick={checkGanacheConnection}
              className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
            >
              Verifica Ganache
            </button>
      </div> */}


      <div className="flex flex-wrap gap-2 mb-4">

        <button 
          onClick={verifyOwnership}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Verifica Account
        </button>

        <button 
          onClick={checkContractDetails}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Verifica Contratto
        </button>

        <button 
          onClick={checkGanacheConnection}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Verifica Ganache
        </button>

        <button 
          onClick={async () => {
            const accounts = await web3.eth.getAccounts();
            console.log('Account disponibili:', accounts);
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Mostra Account
        </button>

        <button 
          onClick={async () => {
            const networkId = await web3.eth.net.getId();
            console.log('Network ID:', networkId);
          }}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          Mostra Network
        </button>

        <button 
          onClick={async () => {
            try {
              const deployedNetwork = SimpleTokenABI.networks[networkId];
              console.log('Network data:', deployedNetwork);
            } catch (err) {
              console.error('Errore:', err);
            }
          }}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Verifica Deploy
        </button>

        <button 
          onClick={verifyContract}
          className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
        >
          Verifica Contratto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="mb-2">
          <strong>Account:</strong> {account || 'Non connesso'}
        </p>
        <p className="mb-2">
          <strong>Network ID:</strong> {networkId || 'Sconosciuto'}
        </p>
        <p>
          <strong>Balance:</strong>{' '}
          {balance !== 'Errore' 
            ? `${parseFloat(balance).toLocaleString()} ${symbol}`
            : 'Errore'
          }
        </p>
      </div>
{/*
      <form onSubmit={handleTransfer} className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Trasferisci Token</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Indirizzo Destinatario:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0x..."
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Importo:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0.0"
            step="0.000000000000000001"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Gas Price (Gwei):</label>
          <input
            type="number"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="5"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Gas Limit:</label>
          <input
            type="number"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="100000"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className={`w-full p-2 rounded text-white ${loading || !contract
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'}`}
          disabled={loading || !contract}
        >
          {loading ? 'Trasferimento in corso...' : 'Trasferisci'}
        </button>
      </form>
*/}
<form onSubmit={handleTransfer} className="bg-white p-4 rounded shadow">
  <h2 className="text-xl font-bold mb-4">Trasferisci Token</h2>
  
  <div className="mb-4">
    <label className="block mb-2">Destinatario:</label>
    <input
      type="text"
      value={recipient}
      onChange={(e) => setRecipient(e.target.value)}
      className="w-full p-2 border rounded"
      placeholder="0x..."
      disabled={loading}
    />
    {recipient && !web3.utils.isAddress(recipient) && (
      <p className="text-red-500 text-sm mt-1">Indirizzo non valido</p>
    )}
  </div>

  <div className="mb-4">
    <label className="block mb-2">Importo:</label>
    <input
      type="number"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      className="w-full p-2 border rounded"
      placeholder="0.0"
      step="0.000000000000000001"
      disabled={loading}
    />
    {amount && (isNaN(amount) || parseFloat(amount) <= 0) && (
      <p className="text-red-500 text-sm mt-1">Importo non valido</p>
    )}
  </div>

  <div className="mb-4">
    <label className="block mb-2">Gas Price (Gwei):</label>
    <input
      type="number"
      value={gasPrice}
      onChange={(e) => setGasPrice(e.target.value)}
      className="w-full p-2 border rounded"
      placeholder="5"
      disabled={loading}
    />
  </div>

  <div className="mb-4">
    <label className="block mb-2">Gas Limit:</label>
    <input
      type="number"
      value={gasLimit}
      onChange={(e) => setGasLimit(e.target.value)}
      className="w-full p-2 border rounded"
      placeholder="100000"
      disabled={loading}
    />
  </div>

  <button
    type="submit"
    className={`w-full p-2 rounded text-white ${
      loading || !contract
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-500 hover:bg-blue-600'
    }`}
    disabled={loading || !contract}
  >
    {loading ? 'Trasferimento in corso...' : 'Trasferisci'}
  </button>
</form>

    </div>
  );
}

export default App;