// test/AdvancedVotingSystem.test.js
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");
const truffleAssert = require('truffle-assertions');
const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');

contract("AdvancedVotingSystem", function (accounts) {
  const [admin, candidate1, candidate2, voter1, voter2, voter3] = accounts;
  
  // Commissioni per i test
  const registrationFee = web3.utils.toWei("0.1", "ether");
  const votingFee = web3.utils.toWei("0.01", "ether");
  
  // Stati del sistema
  const VotingState = {
    Inactive: "0",
    Registration: "1",
    Voting: "2",
    Completed: "3"
  };
  
  let votingInstance;
  
  beforeEach(async function () {
    // Deploy di un nuovo contratto per ogni test
    votingInstance = await AdvancedVotingSystem.new({ from: admin });
  });
  
  describe("Inizializzazione", function () {
    it("dovrebbe impostare il deployer come admin", async function () {
      const contractAdmin = await votingInstance.admin();
      assert.equal(contractAdmin, admin, "L'admin non è stato impostato correttamente");
    });
    
    it("dovrebbe iniziare nello stato inattivo", async function () {
      const state = await votingInstance.currentState();
      assert.equal(state, VotingState.Inactive, "Lo stato iniziale dovrebbe essere inattivo");
    });
  });
  
  describe("Creazione sessione di voto", function () {
    it("dovrebbe permettere all'admin di creare una nuova sessione", async function () {
      const result = await votingInstance.createVotingSession(
        "Test Election", 
        "Test Description", 
        registrationFee, 
        votingFee, 
        { from: admin }
      );
      
      // Verifica evento emesso
      truffleAssert.eventEmitted(result, 'VotingSessionCreated', (ev) => {
        return ev.votingId.toString() === "1" && ev.title === "Test Election";
      });
      
      // Verifica stato aggiornato
      const state = await votingInstance.currentState();
      assert.equal(state, VotingState.Registration, "Lo stato dovrebbe essere Registration");
      
      // Verifica ID votazione
      const votingId = await votingInstance.getCurrentVotingId();
      assert.equal(votingId, 1, "L'ID della votazione dovrebbe essere 1");
    });
    
    it("dovrebbe impedire a non admin di creare una sessione", async function () {
      await expectRevert(
        votingInstance.createVotingSession(
          "Test Election", 
          "Test Description", 
          registrationFee, 
          votingFee, 
          { from: candidate1 }
        ),
        "Solo l'amministratore puo' eseguire questa funzione"
      );
    });
  });
  
  describe("Registrazione candidati", function () {
    beforeEach(async function () {
      // Crea una sessione di voto
      await votingInstance.createVotingSession(
        "Test Election", 
        "Test Description", 
        registrationFee, 
        votingFee, 
        { from: admin }
      );
    });
    
    it("dovrebbe permettere la registrazione pagando la commissione", async function () {
      const result = await votingInstance.registerCandidate(
        "Candidate 1", 
        "My Proposal", 
        { from: candidate1, value: registrationFee }
      );
      
      // Verifica evento emesso
      truffleAssert.eventEmitted(result, 'CandidateRegistered', (ev) => {
        return ev.candidate === candidate1 && ev.name === "Candidate 1";
      });
      
      // Verifica registrazione
      const candidateDetails = await votingInstance.getCandidateDetails(1, candidate1);
      assert.equal(candidateDetails.name, "Candidate 1", "Il nome del candidato non corrisponde");
      assert.equal(candidateDetails.proposal, "My Proposal", "La proposta non corrisponde");
    });
    
    it("dovrebbe impedire la registrazione con commissione insufficiente", async function () {
      const lowFee = web3.utils.toWei("0.05", "ether");
      
      await expectRevert(
        votingInstance.registerCandidate(
          "Candidate 1", 
          "My Proposal", 
          { from: candidate1, value: lowFee }
        ),
        "Commissione di registrazione insufficiente"
      );
    });
    
    it("dovrebbe impedire a un candidato di registrarsi due volte", async function () {
      await votingInstance.registerCandidate(
        "Candidate 1", 
        "My Proposal", 
        { from: candidate1, value: registrationFee }
      );
      
      await expectRevert(
        votingInstance.registerCandidate(
          "Candidate 1 Again", 
          "Another Proposal", 
          { from: candidate1, value: registrationFee }
        ),
        "Candidato gia' registrato"
      );
    });
  });
  
  describe("Gestione fasi di votazione", function () {
    beforeEach(async function () {
      // Crea una sessione di voto
      await votingInstance.createVotingSession(
        "Test Election", 
        "Test Description", 
        registrationFee, 
        votingFee, 
        { from: admin }
      );
      
      // Registra due candidati
      await votingInstance.registerCandidate(
        "Candidate 1", 
        "Proposal 1", 
        { from: candidate1, value: registrationFee }
      );
      
      await votingInstance.registerCandidate(
        "Candidate 2", 
        "Proposal 2", 
        { from: candidate2, value: registrationFee }
      );
    });
    
    it("dovrebbe permettere all'admin di chiudere la registrazione e iniziare la votazione", async function () {
      const maxVotes = 5;
      
      const result = await votingInstance.closeRegistrationAndStartVoting(maxVotes, { from: admin });
      
      // Verifica evento emesso
      truffleAssert.eventEmitted(result, 'RegistrationClosed');
      
      // Verifica stato aggiornato
      const state = await votingInstance.currentState();
      assert.equal(state, VotingState.Voting, "Lo stato dovrebbe essere Voting");
      
      // Verifica maxVotesRequired
      const sessionDetails = await votingInstance.getVotingSessionDetails(1);
      assert.equal(sessionDetails.maxVotesRequired, maxVotes, "Il numero massimo di voti non è stato impostato correttamente");
    });
    
    it("dovrebbe richiedere almeno due candidati per iniziare la votazione", async function () {
      // Crea una nuova sessione
      await votingInstance.cancelVoting({ from: admin });
      await votingInstance.createVotingSession(
        "Test Election 2", 
        "Test Description", 
        registrationFee, 
        votingFee, 
        { from: admin }
      );
      
      // Registra un solo candidato
      await votingInstance.registerCandidate(
        "Only Candidate", 
        "My Proposal", 
        { from: candidate1, value: registrationFee }
      );
      
      // Tenta di iniziare la votazione
      await expectRevert(
        votingInstance.closeRegistrationAndStartVoting(5, { from: admin }),
        "Servono almeno due candidati"
      );
    });
  });
  
  describe("Votazione e completamento", function () {
    const maxVotes = 3;
    
    beforeEach(async function () {
      // Crea una sessione di voto
      await votingInstance.createVotingSession(
        "Test Election", 
        "Test Description", 
        registrationFee, 
        votingFee, 
        { from: admin }
      );
      
      // Registra due candidati
      await votingInstance.registerCandidate(
        "Candidate 1", 
        "Proposal 1", 
        { from: candidate1, value: registrationFee }
      );
      
      await votingInstance.registerCandidate(
        "Candidate 2", 
        "Proposal 2", 
        { from: candidate2, value: registrationFee }
      );
      
      // Inizia la votazione
      await votingInstance.closeRegistrationAndStartVoting(maxVotes, { from: admin });
    });
    
    it("dovrebbe permettere agli utenti di votare pagando la commissione", async function () {
      const result = await votingInstance.vote(candidate1, { from: voter1, value: votingFee });
      
      // Verifica evento emesso
      truffleAssert.eventEmitted(result, 'VoteCast', (ev) => {
        return ev.voter === voter1 && ev.candidate === candidate1;
      });
      
      // Verifica conteggio voti
      const candidateDetails = await votingInstance.getCandidateDetails(1, candidate1);
      assert.equal(candidateDetails.voteCount, 1, "Il conteggio dei voti non è corretto");
      
      // Verifica che il votante risulti aver votato
      const hasVoted = await votingInstance.hasVoted(1, voter1);
      assert.equal(hasVoted, true, "Il votante dovrebbe risultare come votante");
    });
    
    it("dovrebbe completare automaticamente la votazione quando un candidato raggiunge il numero massimo di voti", async function () {
      // Il candidato1 riceve maxVotes voti
      await votingInstance.vote(candidate1, { from: voter1, value: votingFee });
      await votingInstance.vote(candidate1, { from: voter2, value: votingFee });
      const result = await votingInstance.vote(candidate1, { from: voter3, value: votingFee });
      
      // Verifica evento VotingCompleted
      truffleAssert.eventEmitted(result, 'VotingCompleted', (ev) => {
        return ev.winner === candidate1 && ev.voteCount.toString() === maxVotes.toString();
      });
      
      // Verifica stato aggiornato
      const state = await votingInstance.currentState();
      assert.equal(state, VotingState.Inactive, "Lo stato dovrebbe essere tornato a Inactive");
      
      // Verifica risultati
      const votingResults = await votingInstance.getVotingResults(1);
      assert.equal(votingResults.winner, candidate1, "Il vincitore non è corretto");
      assert.equal(votingResults.voteCount, maxVotes, "Il conteggio dei voti del vincitore non è corretto");
    });
    
    it("dovrebbe permettere all'admin di completare manualmente la votazione", async function () {
      // Candidato1 riceve 2 voti (meno di maxVotes)
      await votingInstance.vote(candidate1, { from: voter1, value: votingFee });
      await votingInstance.vote(candidate1, { from: voter2, value: votingFee });
      
      // Admin completa manualmente
      const result = await votingInstance.endVoting({ from: admin });
      
      // Verifica evento
      truffleAssert.eventEmitted(result, 'VotingCompleted');
      
      // Verifica stato
      const state = await votingInstance.currentState();
      assert.equal(state, VotingState.Inactive, "Lo stato dovrebbe essere Inactive");
    });
    
    it("dovrebbe determinare correttamente il vincitore tra più candidati", async function () {
      // Candidato1 riceve 2 voti
      await votingInstance.vote(candidate1, { from: voter1, value: votingFee });
      await votingInstance.vote(candidate1, { from: voter2, value: votingFee });
      
      // Candidato2 riceve 1 voto
      await votingInstance.vote(candidate2, { from: voter3, value: votingFee });
      
      // Admin completa
      await votingInstance.endVoting({ from: admin });
      
      // Verifica risultati
      const votingResults = await votingInstance.getVotingResults(1);
      assert.equal(votingResults.winner, candidate1, "Il vincitore dovrebbe essere candidate1");
      assert.equal(votingResults.voteCount, 2, "Il conteggio dei voti del vincitore dovrebbe essere 2");
    });
  });
  
  describe("Gestione storico e risultati", function () {
    beforeEach(async function () {
      // Crea e completa una prima votazione
      await votingInstance.createVotingSession("Election 1", "First election", registrationFee, votingFee, { from: admin });
      await votingInstance.registerCandidate("Candidate 1", "Proposal 1", { from: candidate1, value: registrationFee });
      await votingInstance.registerCandidate("Candidate 2", "Proposal 2", { from: candidate2, value: registrationFee });
      await votingInstance.closeRegistrationAndStartVoting(5, { from: admin });
      await votingInstance.vote(candidate1, { from: voter1, value: votingFee });
      await votingInstance.vote(candidate1, { from: voter2, value: votingFee });
      await votingInstance.endVoting({ from: admin });
      
      // Crea e completa una seconda votazione
      await votingInstance.createVotingSession("Election 2", "Second election", registrationFee, votingFee, { from: admin });
      await votingInstance.registerCandidate("Candidate A", "Proposal A", { from: candidate1, value: registrationFee });
      await votingInstance.registerCandidate("Candidate B", "Proposal B", { from: candidate2, value: registrationFee });
      await votingInstance.closeRegistrationAndStartVoting(5, { from: admin });
      await votingInstance.vote(candidate2, { from: voter1, value: votingFee });
      await votingInstance.vote(candidate2, { from: voter2, value: votingFee });
      await votingInstance.vote(candidate2, { from: voter3, value: votingFee });
      await votingInstance.endVoting({ from: admin });
    });
    
    it("dovrebbe mantenere un elenco di tutte le votazioni passate", async function () {
      const pastVotingIds = await votingInstance.getPastVotingSessions();
      
      assert.equal(pastVotingIds.length, 2, "Dovrebbero esserci 2 votazioni passate");
      assert.equal(pastVotingIds[0], 1, "Il primo ID dovrebbe essere 1");
      assert.equal(pastVotingIds[1], 2, "Il secondo ID dovrebbe essere 2");
    });
    
    it("dovrebbe permettere di ottenere i risultati di una votazione specifica", async function () {
      const results1 = await votingInstance.getVotingResults(1);
      const results2 = await votingInstance.getVotingResults(2);
      
      // Verifica prima votazione
      assert.equal(results1.title, "Election 1", "Il titolo della prima votazione non è corretto");
      assert.equal(results1.winner, candidate1, "Il vincitore della prima votazione non è corretto");
      assert.equal(results1.voteCount, 2, "Il conteggio dei voti della prima votazione non è corretto");
      
      // Verifica seconda votazione
      assert.equal(results2.title, "Election 2", "Il titolo della seconda votazione non è corretto");
      assert.equal(results2.winner, candidate2, "Il vincitore della seconda votazione non è corretto");
      assert.equal(results2.voteCount, 3, "Il conteggio dei voti della seconda votazione non è corretto");
    });
    
    it("dovrebbe permettere di ottenere tutti i risultati delle votazioni passate", async function () {
      const allResults = await votingInstance.getAllPastVotingResults();
      
      // Verifica IDs
      assert.equal(allResults.votingIds.length, 2, "Dovrebbero esserci 2 votazioni");
      assert.equal(allResults.votingIds[0], 1, "Il primo ID dovrebbe essere 1");
      assert.equal(allResults.votingIds[1], 2, "Il secondo ID dovrebbe essere 2");
      
      // Verifica titoli
      assert.equal(allResults.titles[0], "Election 1", "Il titolo della prima votazione non è corretto");
      assert.equal(allResults.titles[1], "Election 2", "Il titolo della seconda votazione non è corretto");
      
      // Verifica vincitori
      assert.equal(allResults.winners[0], candidate1, "Il vincitore della prima votazione non è corretto");
      assert.equal(allResults.winners[1], candidate2, "Il vincitore della seconda votazione non è corretto");
      
      // Verifica conteggio voti
      assert.equal(allResults.voteCounts[0], 2, "Il conteggio voti della prima votazione non è corretto");
      assert.equal(allResults.voteCounts[1], 3, "Il conteggio voti della seconda votazione non è corretto");
    });
  });
  
  describe("Gestione fondi", function () {
    it("dovrebbe permettere all'admin di prelevare i fondi", async function () {
      // Crea una sessione e raccoglie commissioni
      await votingInstance.createVotingSession("Test Election", "Description", registrationFee, votingFee, { from: admin });
      await votingInstance.registerCandidate("Candidate 1", "Proposal", { from: candidate1, value: registrationFee });
      await votingInstance.registerCandidate("Candidate 2", "Proposal", { from: candidate2, value: registrationFee });
      
      const initialBalance = new BN(await web3.eth.getBalance(admin));
      
      // Preleva i fondi
      const totalFee = new BN(registrationFee).mul(new BN(2)); // 2 candidati
      const tx = await votingInstance.withdrawFunds(totalFee, { from: admin });
      
      // Calcola il gas usato
      const gasUsed = new BN(tx.receipt.gasUsed);
      const txInfo = await web3.eth.getTransaction(tx.tx);
      const gasPrice = new BN(txInfo.gasPrice);
      const gasCost = gasUsed.mul(gasPrice);
      
      // Verifica il saldo aggiornato
      const finalBalance = new BN(await web3.eth.getBalance(admin));
      const expectedBalance = initialBalance.add(totalFee).sub(gasCost);
      
      // Tolleriamo una piccola differenza per le approssimazioni
      const difference = expectedBalance.sub(finalBalance).abs();
      assert(difference.lt(new BN(web3.utils.toWei("0.001", "ether"))), "Il saldo finale non corrisponde a quanto atteso");
    });
    
    it("dovrebbe impedire il prelievo di fondi superiori al saldo", async function () {
      // Tenta di prelevare più fondi di quanti ce ne siano
      const tooMuch = web3.utils.toWei("10", "ether");
      
      await expectRevert(
        votingInstance.withdrawFunds(tooMuch, { from: admin }),
        "Saldo insufficiente"
      );
    });
  });
});