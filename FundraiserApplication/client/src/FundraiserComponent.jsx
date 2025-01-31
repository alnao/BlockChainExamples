import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import FundraiserContract from './contracts/Fundraiser.json';

const FundraiserComponent = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [fundraiserData, setFundraiserData] = useState({
    name: '',
    description: '',
    url: '',
    imageURL: '',
    beneficiary: '',
    owner: '',
    totalDonations: '0',
    donationsCount: '0'
  });
  const [donationAmount, setDonationAmount] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [myDonations, setMyDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initWeb3();
  }, []);

  const initWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        await initContract(web3Instance);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect to MetaMask');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const initContract = async (web3Instance) => {
    try {
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = FundraiserContract.networks[networkId];

      if (!deployedNetwork) {
        throw new Error('Contract not deployed on the current network');
      }

      const contractInstance = new web3Instance.eth.Contract(
        FundraiserContract.abi,
        deployedNetwork.address
      );
      
      setContract(contractInstance);
      await loadContractData(contractInstance, web3Instance);
    } catch (error) {
      setError('Failed to load contract');
      console.error('Contract initialization error:', error);
    }
  };

  const loadContractData = async (contractInstance, web3Instance) => {
    if (!contractInstance || !web3Instance) return;

    try {
      const [
        name,
        description,
        url,
        imageURL,
        beneficiary,
        owner,
        totalDonations,
        donationsCount
      ] = await Promise.all([
        contractInstance.methods.name().call(),
        contractInstance.methods.description().call(),
        contractInstance.methods.url().call(),
        contractInstance.methods.imageURL().call(),
        contractInstance.methods.beneficiary().call(),
        contractInstance.methods.owner().call(),
        contractInstance.methods.totalDonations().call(),
        contractInstance.methods.donationsCount().call()
      ]);

      setFundraiserData({
        name,
        description,
        url,
        imageURL,
        beneficiary,
        owner,
        totalDonations: web3Instance.utils.fromWei(totalDonations, 'ether'),
        donationsCount
      });

      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      await loadMyDonations(contractInstance, web3Instance);
    } catch (error) {
      setError('Failed to load fundraiser data');
      console.error('Data loading error:', error);
    }
  };

  const loadMyDonations = async (contractInstance, web3Instance) => {
    if (!contractInstance || !web3Instance || !account) return;

    try {
      const donations = await contractInstance.methods.myDonations().call({ from: account });
      const formattedDonations = donations.values.map((value, index) => ({
        value: web3Instance.utils.fromWei(value, 'ether'),
        date: new Date(donations.dates[index] * 1000).toLocaleDateString()
      }));
      setMyDonations(formattedDonations);
    } catch (error) {
      console.error('Error loading donations:', error);
    }
  };

  const handleDonate = async () => {
    if (!contract || !account || !donationAmount || !web3) return;
    
    try {
      await contract.methods.donate().send({
        from: account,
        value: web3.utils.toWei(donationAmount, 'ether')
      });
      await loadContractData(contract, web3);
      setDonationAmount('');
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !isOwner) return;
    
    try {
      await contract.methods.withdraw().send({ from: account });
      await loadContractData(contract, web3);
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  const handleAdmin = async () => {
    setIsOwner(!isOwner);
  }

  const handleSetBeneficiary = async () => {
    if (!contract || !isOwner || !web3 || !web3.utils.isAddress(newBeneficiary)) return;
    
    try {
      await contract.methods.setBeneficiary(newBeneficiary).send({ from: account });
      await loadContractData(contract, web3);
      setNewBeneficiary('');
    } catch (error) {
      console.error('Set beneficiary error:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b">
          <h1 className="text-2xl font-bold">{fundraiserData.name}</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informazioni Fundraiser */}
          <div>
            <img 
              src={fundraiserData.imageURL} 
              alt={fundraiserData.name}
              className="object-cover rounded-lg mb-4" width={100}
            />
            <p className="text-lg mb-2">{fundraiserData.description}</p>
            <a 
              href={fundraiserData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visita il sito web
            </a>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-600">Donazioni Totali</p>
              <p className="text-2xl font-bold">{fundraiserData.totalDonations} ETH</p>
            </div>
            <div>
              <p className="text-gray-600">Numero Donazioni</p>
              <p className="text-2xl font-bold">{fundraiserData.donationsCount}</p>
            </div>
          </div>

          {/* Form Donazione */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Fai una donazione</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Importo in ETH"
                className="flex-1 p-2 border rounded"
                min="0"
                step="0.01"
              />
              <button
                onClick={handleDonate}
                className="bg-info text-dark px-4 py-2 rounded hover:bg-blue-700"
              >
                Dona
              </button>
            </div>
          </div>

          {/* Le mie donazioni */}
          {myDonations.length > 0 && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Le mie donazioni</h3>
              <div className="space-y-2">
                {myDonations.map((donation, index) => (
                  <div key={index} className="flex justify-between border-b py-2">
                    <span>{donation.value} ETH</span>
                    <span className="text-gray-600">{donation.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sezione Admin */}
          {isOwner && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">Amministrazione</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Cambia Beneficiario</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBeneficiary}
                      onChange={(e) => setNewBeneficiary(e.target.value)}
                      placeholder="Indirizzo nuovo beneficiario"
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={handleSetBeneficiary}
                      className="bg-info text-dark px-4 py-2 rounded hover:bg-green-700"
                    >
                      Aggiorna
                    </button>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleWithdraw}
                    className="bg-info text-dark px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Preleva Fondi
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isOwner && (
              <p><button
                onClick={handleAdmin}
                className="bg-info text-dark px-4 py-2 mb-5 rounded hover:bg-blue-700"
              >
                Passa a sezione amministratore
              </button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundraiserComponent;