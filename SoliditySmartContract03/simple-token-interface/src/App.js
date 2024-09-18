import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleTokenABI from './SimpleTokenABI.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [networkId, setNetworkId] = useState(null);
  const [gasPrice, setGasPrice] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  
  const initWeb3 = async () => {
console.log( "ethereum" , window.ethereum );
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
const chains = await window.ethereum.request({
  method: 'wallet_getPermissions'
});
console.log("chains",chains);
      setWeb3(web3Instance);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
console.log("accounts",accounts);
        let ac=accounts[0]
//ac="0xB2a0F7E996dF8adFe99089502C79fB7DEd57dC8e"
        setAccount(ac);
console.log ( web3Instance );
        const network = await web3Instance.eth.net.getId();
console.log("network",network);
let ne=network
//ne="5777"
        setNetworkId(ne);
        initContract(web3Instance, ne);
      } catch (error) {
        console.error("User denied account access or error occurred:", error);
      }
    } else {
      console.log('Please install MetaMask!');
    }
  };

  const initContract = async (web3Instance, network) => {
    
//console.log("network",network);
    console.log("Initializing contract for network ID:", network);
    console.log("Available networks in ABI:", Object.keys(SimpleTokenABI.networks));
network = Object.keys(SimpleTokenABI.networks)
//console.log("networkNew",network);
    const deployedNetwork = SimpleTokenABI.networks[network];
//console.log("deployedNetwork",SimpleTokenABI.networks);
console.log ("deployedNetwork.address", deployedNetwork.address );
    if (deployedNetwork) {
      console.log("Found deployed network. Contract address:", deployedNetwork.address);
      try {
        const instance = new web3Instance.eth.Contract(
          SimpleTokenABI.abi,
          deployedNetwork.address,
        );
        console.log("Contract instance created successfully",instance);
        setContract(instance);
//console.log("contract",instance);
      } catch (error) {
        console.error("Error creating contract instance:", error);
        setContract(null);
      }
    } else {
      console.log('Contract not deployed on the current network');
      setContract(null);
    }
  };

  useEffect(() => {
    initWeb3();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
//accounts[0]="0xB2a0F7E996dF8adFe99089502C79fB7DEd57dC8e"
        setAccount(accounts[0]);
        loadBalance(contract, accounts[0]);
      });

      window.ethereum.on('chainChanged', (_chainId) => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  useEffect(() => {
    if (contract && account) {
      loadBalance(contract, account);
    }
  }, [contract, account]);

  const loadBalance = async (contract, account) => {
    if (contract && account) {
      try {
        console.log("Attempting to load balance for account:", account);
        console.log("Contract address:", contract.options.address);

        console.log("loadBalance contract",contract);
        console.log("loadBalance account",account);

const name = await contract.methods.name().call();
console.log("nameee" , name);

        const balance = await contract.methods.balanceOf(account).call();
        console.log("Raw balance:", balance);
        //setBalance(web3.utils.fromWei(balance, 'ether'));
      } catch (error) {
        console.error('Error loading balance:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setBalance('Error');
      }
    }
  };
  const handleTransfer = async () => {
    if (contract && account) {
      try {
        const gasPriceWei = web3.utils.toWei(gasPrice, 'gwei');
        const gasLimitNumber = parseInt(gasLimit);

        await contract.methods.transfer(recipient, web3.utils.toWei(amount, 'ether')).send({
          from: account,
          gasPrice: gasPriceWei,
          gas: gasLimitNumber
        });
        
        alert('Transfer successful!');
        loadBalance(contract, account);
      } catch (error) {
        console.error('Error transferring tokens:', error);
        alert('Transfer failed. Check console for details.');
      }
    }
  };
  /*
  async function getMetaMaskNetworks() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Richiedi l'accesso agli account (questo è necessario per accedere alle reti)
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        // Ottieni l'elenco delle catene
        const chains = await window.ethereum.request({
          method: 'wallet_getPermissions'
        });
  
        // Estrai le informazioni sulle reti dalle autorizzazioni
        const networks = chains[0].caveats[0].value;
  
        // Ottieni i dettagli di ogni rete
        const networkDetails = await Promise.all(networks.map(async (chainId) => {
          try {
            const details = await window.ethereum.request({
              method: 'eth_getChainInfo',
              params: [chainId]
            });
            return {
              chainId: chainId,
              name: details.name,
              networkId: details.networkId,
              rpcUrl: details.rpcUrl
            };
          } catch (error) {
            console.error(`Errore nel recupero dei dettagli per la catena ${chainId}:`, error);
            return {
              chainId: chainId,
              name: `Rete sconosciuta (${chainId})`,
              error: error.message
            };
          }
        }));
  
        return networkDetails;
      } catch (error) {
        console.error('Errore nel recupero delle reti di MetaMask:', error);
        return [];
      }
    } else {
      console.error('MetaMask non è installato');
      return [];
    }
  }
  async function displayNetworks() {
    const networks = await getMetaMaskNetworks();
    console.log('Reti configurate in MetaMask:', networks);
  }
//    <a onClick={(e) => displayNetworks()} >load network</a>
*/
  const displayNetworkInfo = async () => {
    if (web3) {
      try {
        const networkId = await web3.eth.net.getId();
        console.log("Current Network ID:", networkId);
        const networkType = await web3.eth.net.getNetworkType();
        console.log("Current Network Type:", networkType);
      } catch (error) {
        console.error("Error fetching network info:", error);
      }
    }
  };

  // Chiama questa funzione in useEffect o quando necessario
  useEffect(() => {
    displayNetworkInfo();
  }, [web3]);

  return (
    <div className="App">
      
      <h1>SimpleToken Interface</h1>
      <p>Your Account: {account}</p>
      <p>Your Balance: {balance} </p>
      <p>Current Network ID: {networkId}</p>
      {!contract && <p>Contract not deployed on this network. Please switch to a supported network.</p>}
      
      <h2>Transfer Tokens</h2>
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Gas Price (Gwei)"
        value={gasPrice}
        onChange={(e) => setGasPrice(e.target.value)}
      />
      <input
        type="text"
        placeholder="Gas Limit"
        value={gasLimit}
        onChange={(e) => setGasLimit(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={!contract}>Transfer</button>
    </div>
  );
}

export default App;

/*
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import SimpleTokenABI from './SimpleTokenABI.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        
        try {
          await window.ethereum.enable();
          setWeb3(web3Instance);
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
console.log(accounts);
          const networkId = await web3Instance.eth.net.getId();
console.log(web3Instance.eth.net);
          const deployedNetwork = SimpleTokenABI.networks[networkId];
          
console.log('NetworkID:', networkId);
console.log('DeployedNetwork:', deployedNetwork);
console.log('Contract Address:', deployedNetwork && deployedNetwork.address);

          const instance = new web3Instance.eth.Contract(
            SimpleTokenABI.abi,
            deployedNetwork && deployedNetwork.address,
          );
          setContract(instance);
        } catch (error) {
          console.error("User denied account access");
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };
    initWeb3();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      if (contract && account) {
        const balance = await contract.methods.balanceOf(account).call();
        setBalance(web3.utils.fromWei(balance, 'ether'));
      }
    };
    loadBalance();
  }, [contract, account, web3]);

  const handleTransfer = async () => {
    if (contract && account) {
      try {
        await contract.methods.transfer(recipient, web3.utils.toWei(amount, 'ether')).send({ from: account });
        alert('Transfer successful!');
        // Refresh balance
        const newBalance = await contract.methods.balanceOf(account).call();
        setBalance(web3.utils.fromWei(newBalance, 'ether'));
      } catch (error) {
        console.error('Error transferring tokens:', error);
        alert('Transfer failed. Check console for details.');
      }
    }
  };

  return (
    <div className="App">
      <h1>SimpleToken Interface</h1>
      <p>Your Account: {account}</p>
      <p>Your Balance: {balance} STK</p>
      <h2>Transfer Tokens</h2>
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer}>Transfer</button>
    </div>
  );
}

export default App;

/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/