import './App.css';
//import { useState } from 'react';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Greeter from './artifacts/contracts/Lock.sol/Lock.json';

// Aggiorna con l'indirizzo del contratto stampato dalla CLI quando è stato distribuito 
const greeterAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";


function App() {
  const [contract, setContract] = useState(null);
  const [currentValue, setCurrentValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const initializeContract = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          const contractAddress = greeterAddress ;
          
          const contractInstance = new ethers.Contract(contractAddress, Greeter.abi, signer);
          setContract(contractInstance);
          setStatus('Contratto inizializzato');
        } catch (error) {
          console.error('Errore di inizializzazione:', error);
          setStatus('Errore di inizializzazione: ' + error.message);
        }
      } else {
        setStatus('MetaMask non rilevato');
      }
    };

    initializeContract();
  }, []);

  const getValue = async () => {
    if (contract) {
      try {
        // Verifica se la funzione esiste nel contratto
        if (typeof contract.getValue !== 'function') {
          throw new Error('La funzione getValue non esiste nel contratto');
        }

        const value = await contract.getValue()//getValue();
        console.log('Valore ricevuto:', value);

        if (value === undefined || value === null) {
          throw new Error('Il valore restituito è undefined o null');
        }

        setCurrentValue(value.toString());
        setStatus('Valore ottenuto con successo');
      } catch (error) {
        console.error('Errore dettagliato:', error);
        setStatus('Errore nel recupero del valore: ' + error.message);
      }
    } else {
      setStatus('Contratto non inizializzato');
    }
  };

  const setValue = async () => {
    if (contract && newValue) {
      try {
        const tx = await contract.setValue(newValue); //setValue
        setStatus('Transazione inviata: ' + tx.hash);
        await tx.wait();
        setStatus('Valore impostato con successo');
        getValue(); // Aggiorna il valore visualizzato
      } catch (error) {
        console.error('Errore dettagliato:', error);
        setStatus('Errore nell\'impostazione del valore: ' + error.message);
      }
    } else {
      setStatus('Contratto non inizializzato o valore non inserito');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-xl font-bold">Interazione con Smart Contract</h1>
      <div>
        <button 
          onClick={getValue}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ottieni Valore
        </button>
        <p className="mt-2">Valore attuale: {currentValue}</p>
      </div>
      <div>
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="border rounded p-2 mr-2"
          placeholder="Nuovo valore"
        />
        <button 
          onClick={setValue}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Imposta Valore
        </button>
      </div>
      <p className="text-sm text-gray-600">{status}</p>
    </div>
  );

  /*
  // memorizza il saluto nella stato locale
  const [greeting, setGreetingValue] = useState()

  // richiede l'accesso all'account MetaMask dell'utente
  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  // chiama lo smart contract, legge il valore attuale del saluto 
  async function fetchGreeting() {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
//      const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

      const contract = new ethers.Contract(greeterAddress, Greeter.abi, provider)
      try {
        const data = await contract.greet()
        console.log('data: ', data)
      } catch (err) {
        console.log("Error: ", err)
      }
    }    
  }

  // chiama lo smart contract, invia un aggiornamento
  async function setGreeting() {
    if (!greeting) return
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      const contract = new ethers.Contract(greeterAddress, Greeter.abi, signer)
      const transaction = await contract.setGreeting(greeting)
      await transaction.wait()
      fetchGreeting()
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={fetchGreeting}>Fetch Greeting</button>
        <button onClick={setGreeting}>Set Greeting</button>
        <input onChange={e => setGreetingValue(e.target.value)} placeholder="Set greeting" />
      </header>
    </div>
  );
  */
}


export default App;
