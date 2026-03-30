import React, { useState, useEffect } from "react";
import FundraiserFactoryContract from "./contracts/FundraiserFactory.json";
import FundraiserContract from "./contracts/Fundraiser.json";
import getWeb3 from "./alternativeVersion_utils/getWeb3";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap';

const App = () => {
  const [state, setState] = useState({
    web3: null,
    accounts: null,
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
    }
  });

  useEffect(() => {
    const init = async () => {
      try {
        // Get network provider and web3 instance
        const web3 = await getWeb3();
        
        // Use web3 to get the user's accounts
        const accounts = await web3.eth.getAccounts();
        
        // Get the contract instance
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = FundraiserFactoryContract.networks[networkId];
        
        if (!deployedNetwork) {
          showNotification('error', 'Contract not deployed to this network. Please check your connection.');
          setState(prevState => ({ 
            ...prevState, 
            isLoading: false 
          }));
          return;
        }
        
        const factory = new web3.eth.Contract(
          FundraiserFactoryContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        setState(prevState => ({ 
          ...prevState, 
          web3, 
          accounts, 
          factory,
          formData: {
            ...prevState.formData,
            beneficiary: accounts[0]
          },
          isLoading: false
        }));

        // Load initial fundraisers after we've set the state
        loadFundraisers(web3, factory, accounts);
      } catch (error) {
        console.error("Failed to load web3, accounts, or contract:", error);
        showNotification('error', 'Failed to connect. Please check if MetaMask is installed and connected.');
        setState(prevState => ({ ...prevState, isLoading: false }));
      }
    };
    
    init();
  }, []);

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

  const loadFundraisers = async (web3Instance, factoryInstance, accountsArray) => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      // Use passed instances or state instances
      const web3 = web3Instance || state.web3;
      const factory = factoryInstance || state.factory;
      const accounts = accountsArray || state.accounts;
      
      if (!factory || !web3 || !accounts) {
        console.error("Required instances not available");
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      const count = await factory.methods.fundraisersCount().call();
      const fundraisers = [];
      
      if (parseInt(count) > 0) {
        const batchSize = 10;
        const maxFundraisersToShow = Math.min(parseInt(count), 30);
        
        for (let i = 0; i < maxFundraisersToShow; i += batchSize) {
          const limit = Math.min(batchSize, maxFundraisersToShow - i);
          const fundraisersAddresses = await factory.methods.fundraisers(limit, i).call();
          
          for (let j = 0; j < fundraisersAddresses.length; j++) {
            const fundraiserInstance = new web3.eth.Contract(
              FundraiserContract.abi,
              fundraisersAddresses[j]
            );
            
            const name = await fundraiserInstance.methods.name().call();
            const url = await fundraiserInstance.methods.url().call();
            const imageURL = await fundraiserInstance.methods.imageURL().call();
            const description = await fundraiserInstance.methods.description().call();
            const totalDonations = await fundraiserInstance.methods.totalDonations().call();
            const donationsCount = await fundraiserInstance.methods.donationsCount().call();
            
            fundraisers.push({
              address: fundraisersAddresses[j],
              name,
              url,
              imageURL,
              description,
              totalDonations: web3.utils.fromWei(totalDonations, 'ether'),
              donationsCount,
              contract: fundraiserInstance
            });
          }
        }
      }
      
      setState(prevState => ({ 
        ...prevState, 
        fundraisers, 
        isLoading: false 
      }));
    } catch (error) {
      console.error("Error loading fundraisers:", error);
      showNotification('error', 'Failed to load fundraisers. Please try again later.');
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
    if (e && e.target && e.target.value !== undefined) {
      const val = e.target.value;
      setState(prevState => ({
        ...prevState,
        donationAmount: val
      }));
    } else {
      console.error("Evento non valido in handleDonationAmountChange:", e);
    }
  };

  const selectFundraiser = async (fundraiser) => {
    try {
      setState(prevState => ({ 
        ...prevState, 
        selectedFundraiser: fundraiser,
        activeTab: 'details',
        isLoading: true
      }));
      
      // Get user donations for this fundraiser if any
      if (fundraiser.contract && state.accounts) {
        try {
          const myDonationsCount = await fundraiser.contract.methods.myDonationsCount().call({ from: state.accounts[0] });
          
          if (parseInt(myDonationsCount) > 0) {
            const { values, dates } = await fundraiser.contract.methods.myDonations().call({ from: state.accounts[0] });
            
            setState(prevState => ({
              ...prevState,
              userDonations: {
                values: values.map(val => state.web3.utils.fromWei(val, 'ether')),
                dates: dates.map(date => new Date(date * 1000).toLocaleString())
              }
            }));
          } else {
            // Reset user donations if none found
            setState(prevState => ({
              ...prevState,
              userDonations: {
                values: [],
                dates: []
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
      showNotification('error', 'Failed to load fundraiser details.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const createFundraiser = async (e) => {
    e.preventDefault();
    
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { factory, accounts, formData } = state;
      const { name, url, imageURL, description, beneficiary } = formData;
      
      // Validate input
      if (!name || !url || !imageURL || !description || !beneficiary) {
        showNotification('error', 'Please fill all required fields.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate beneficiary address
      if (!state.web3.utils.isAddress(beneficiary)) {
        showNotification('error', 'Invalid beneficiary address.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      await factory.methods.createFundraiser(
        name,
        url,
        imageURL,
        description,
        beneficiary
      ).send({ from: accounts[0] });
      
      // Reset form
      setState(prevState => ({
        ...prevState,
        formData: {
          name: '',
          url: '',
          imageURL: '',
          description: '',
          beneficiary: accounts[0]
        }
      }));
      
      showNotification('success', 'Fundraiser created successfully!');
      
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
      showNotification('error', 'Failed to create fundraiser. Please try again.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const donate = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts, web3, donationAmount } = state;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'No fundraiser selected.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      const amountInWei = web3.utils.toWei(donationAmount, 'ether');
      
      await selectedFundraiser.contract.methods.donate().send({
        from: accounts[0],
        value: amountInWei
      });
      
      showNotification('success', 'Donation sent successfully!');
      
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
      showNotification('error', 'Failed to process donation. Please try again.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const withdraw = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts } = state;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'No fundraiser selected.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      await selectedFundraiser.contract.methods.withdraw().send({
        from: accounts[0]
      });
      
      showNotification('success', 'Funds withdrawn successfully!');
      
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
      showNotification('error', 'Failed to withdraw funds. Make sure you are the owner.');
      setState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  const changeBeneficiary = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));
      
      const { selectedFundraiser, accounts, web3 } = state;
      const newBeneficiary = document.getElementById('newBeneficiaryAddress').value;
      
      if (!selectedFundraiser || !selectedFundraiser.contract) {
        showNotification('error', 'No fundraiser selected.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      // Validate beneficiary address
      if (!web3.utils.isAddress(newBeneficiary)) {
        showNotification('error', 'Invalid beneficiary address.');
        setState(prevState => ({ ...prevState, isLoading: false }));
        return;
      }
      
      await selectedFundraiser.contract.methods.setBeneficiary(newBeneficiary).send({
        from: accounts[0]
      });
      
      showNotification('success', 'Beneficiary changed successfully!');
      
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
      showNotification('error', 'Failed to change beneficiary. Make sure you are the owner.');
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

  if (!state.web3 && state.isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Connecting to blockchain...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <h1 className="text-center mb-4">Piattaforma di Fundraiser</h1>
      
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
      
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white p-4 rounded">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
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
            {state.fundraisers.length === 0 ? (
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
                          e.target.src = 'https://via.placeholder.com/300x200?text=Nessuna+Immagine';
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
          </Tab.Pane>
          
          {/* Fundraiser Details Tab */}
          <Tab.Pane eventKey="details">
            {state.selectedFundraiser ? (
              <>
                <Row className="mb-4">
                  <Col md={5}>
                    <img 
                      src={state.selectedFundraiser.imageURL} 
                      alt={state.selectedFundraiser.name}
                      className="img-fluid rounded shadow"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/600x400?text=Nessuna+Immagine';
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
                    <Card className="shadow-sm">
                      <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">Effettua una Donazione</h5>
                      </Card.Header>
                      <Card.Body>
                        <Form.Group className="mb-3">
                          <Form.Label>Importo (ETH)</Form.Label>
                          <Form.Control 
                            type="number" 
                            min="0.001" 
                            step="0.001" 
                            value={state.donationAmount}
                            onChange={handleDonationAmountChange}
                          />
                        </Form.Group>
                        <div className="d-grid">
                          <Button variant="primary" onClick={donate}>
                            Dona
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Header className="bg-info text-white">
                        <h5 className="mb-0">Le Tue Donazioni</h5>
                      </Card.Header>
                      <Card.Body>
                        {state.userDonations.values.length > 0 ? (
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
                  </Card.Body>
                </Card>
              </>
            ) : (
              <div className="text-center">
                <p>Nessuna raccolta fondi selezionata. Seleziona una raccolta fondi dall'elenco.</p>
                <Button variant="primary" onClick={() => setActiveTab('home')}>
                  Vai all'Elenco delle Raccolte Fondi
                </Button>
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default App;