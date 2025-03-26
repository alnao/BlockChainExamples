// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title AdvancedVotingSystem
 * @dev Un sistema di votazione avanzato che permette:
 * - Una sola votazione attiva alla volta
 * - Iscrizione dei candidati con pagamento di commissione
 * - Amministrazione delle fasi di votazione
 * - Votazione con commissione
 * - Termina quando un candidato raggiunge numero di voti specificato o amministratore chiude
 * - Storico delle votazioni passate
 */
contract AdvancedVotingSystem {
    // Strutture dati
    enum VotingState { Inactive, Registration, Voting, Completed }
    
    struct Candidate {
        address candidateAddress;
        string name;
        string proposal;
        uint256 voteCount;
        bool isRegistered;
    }
    
    struct Voter {
        bool hasVoted;
        uint256 votedFor; // Indice del candidato votato
    }
    
    struct VotingSession {
        uint256 id;
        string title;
        string description;
        uint256 registrationFee; // Commissione C1
        uint256 votingFee; // Commissione C2
        uint256 maxVotesRequired; // Numero massimo di voti M
        uint256 startTimestamp;
        uint256 endTimestamp;
        address[] candidateAddresses;
        address winner;
        string winnerName;
        uint256 totalVotes;
        VotingState state;
    }
    
    // Variabili di stato
    address public admin;
    VotingState public currentState;
    uint256 public currentVotingId;
    uint256 public registrationFee; // Commissione C1
    uint256 public votingFee; // Commissione C2
    uint256 public maxVotesRequired; // Numero massimo di voti M
    
    mapping(uint256 => VotingSession) public votingSessions; // ID => sessione
    mapping(uint256 => mapping(address => Candidate)) public candidates; // ID => address => candidato
    mapping(uint256 => mapping(address => Voter)) public voters; // ID => address => votante
    uint256[] public pastVotingIds; // Elenco di tutti gli ID delle sessioni passate
    
    // Eventi
    event VotingSessionCreated(uint256 indexed votingId, string title, uint256 timestamp);
    event CandidateRegistered(uint256 indexed votingId, address indexed candidate, string name);
    event RegistrationClosed(uint256 indexed votingId, uint256 timestamp);
    event VoteCast(uint256 indexed votingId, address indexed voter, address indexed candidate);
    event VotingCompleted(uint256 indexed votingId, address indexed winner, string winnerName, uint256 voteCount);
    event VotingCancelled(uint256 indexed votingId, uint256 timestamp);
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    // Modificatori
    modifier onlyAdmin() {
        require(msg.sender == admin, "Solo l'amministratore puo' eseguire questa funzione");
        _;
    }
    
    modifier inState(VotingState state) {
        require(currentState == state, "Operazione non valida nello stato corrente");
        _;
    }
    
    /**
     * @dev Costruttore
     */
    constructor() {
        admin = msg.sender;
        currentState = VotingState.Inactive;
        currentVotingId = 0;
    }
    
    /**
     * @dev Crea una nuova sessione di votazione (solo se non ce ne sono altre attive)
     * @param title Titolo della votazione
     * @param description Descrizione della votazione
     * @param _registrationFee Commissione per la registrazione dei candidati
     * @param _votingFee Commissione per votare
     */
    function createVotingSession(
        string memory title,
        string memory description,
        uint256 _registrationFee,
        uint256 _votingFee
    ) 
        external 
        onlyAdmin 
        inState(VotingState.Inactive)
    {
        currentVotingId++;
        registrationFee = _registrationFee;
        votingFee = _votingFee;
        
        votingSessions[currentVotingId] = VotingSession({
            id: currentVotingId,
            title: title,
            description: description,
            registrationFee: _registrationFee,
            votingFee: _votingFee,
            maxVotesRequired: 0, // Sarà impostato quando si chiude la registrazione
            startTimestamp: block.timestamp,
            endTimestamp: 0, // Sarà impostato quando termina la votazione
            candidateAddresses: new address[](0),
            winner: address(0),
            winnerName: "",
            totalVotes: 0,
            state: VotingState.Registration
        });
        
        currentState = VotingState.Registration;
        
        emit VotingSessionCreated(currentVotingId, title, block.timestamp);
    }
    
    /**
     * @dev Registra un candidato (solo durante la fase di registrazione)
     * @param name Nome del candidato
     * @param proposal Proposta del candidato
     */
    function registerCandidate(string memory name, string memory proposal) 
        external 
        payable 
        inState(VotingState.Registration)
    {
        require(msg.value >= registrationFee, "Commissione di registrazione insufficiente");
        require(!candidates[currentVotingId][msg.sender].isRegistered, "Candidato gia' registrato");
        
        // Registra il candidato
        candidates[currentVotingId][msg.sender] = Candidate({
            candidateAddress: msg.sender,
            name: name,
            proposal: proposal,
            voteCount: 0,
            isRegistered: true
        });
        
        // Aggiungi l'indirizzo del candidato all'array nella sessione
        votingSessions[currentVotingId].candidateAddresses.push(msg.sender);
        
        emit CandidateRegistered(currentVotingId, msg.sender, name);
    }
    
    /**
     * @dev Chiude la fase di registrazione e inizia la fase di votazione
     * @param _maxVotesRequired Numero di voti necessari per vincere
     */
    function closeRegistrationAndStartVoting(uint256 _maxVotesRequired) 
        external 
        onlyAdmin 
        inState(VotingState.Registration)
    {
        require(votingSessions[currentVotingId].candidateAddresses.length > 1, "Servono almeno due candidati");
        require(_maxVotesRequired > 0, "Il numero massimo di voti deve essere maggiore di zero");
        
        maxVotesRequired = _maxVotesRequired;
        votingSessions[currentVotingId].maxVotesRequired = _maxVotesRequired;
        currentState = VotingState.Voting;
        
        emit RegistrationClosed(currentVotingId, block.timestamp);
    }
    
    /**
     * @dev Esprime un voto per un candidato
     * @param candidateAddress Indirizzo del candidato
     */
    function vote(address candidateAddress) 
        external 
        payable 
        inState(VotingState.Voting)
    {
        require(msg.value >= votingFee, "Commissione di voto insufficiente");
        require(candidates[currentVotingId][candidateAddress].isRegistered, "Candidato non registrato");
        require(!voters[currentVotingId][msg.sender].hasVoted, "Hai gia' votato");
        
        // Registra il voto
        voters[currentVotingId][msg.sender] = Voter({
            hasVoted: true,
            votedFor: findCandidateIndex(candidateAddress)
        });
        
        // Incrementa il conteggio dei voti
        candidates[currentVotingId][candidateAddress].voteCount++;
        votingSessions[currentVotingId].totalVotes++;
        
        emit VoteCast(currentVotingId, msg.sender, candidateAddress);
        
        // Controlla se il candidato ha raggiunto il numero massimo di voti
        if (candidates[currentVotingId][candidateAddress].voteCount >= maxVotesRequired) {
            completeVoting(candidateAddress);
        }
    }
    
    /**
     * @dev Termina manualmente la votazione (se non è stato raggiunto il massimo)
     */
    function endVoting() 
        external 
        onlyAdmin 
        inState(VotingState.Voting)
    {
        // Trova il candidato con più voti
        address winningCandidate = determineWinner();
        completeVoting(winningCandidate);
    }
    
    /**
     * @dev Determina il vincitore della votazione corrente
     * @return winningCandidate Indirizzo del candidato vincitore
     */
    function determineWinner() 
        private 
        view 
        returns (address winningCandidate)
    {
        uint256 highestVotes = 0;
        winningCandidate = address(0);
        
        for (uint256 i = 0; i < votingSessions[currentVotingId].candidateAddresses.length; i++) {
            address candidateAddress = votingSessions[currentVotingId].candidateAddresses[i];
            uint256 voteCount = candidates[currentVotingId][candidateAddress].voteCount;
            
            if (voteCount > highestVotes) {
                highestVotes = voteCount;
                winningCandidate = candidateAddress;
            }
        }
        
        return winningCandidate;
    }
    
    /**
     * @dev Completa la votazione e registra il vincitore
     * @param winningCandidate Indirizzo del candidato vincitore
     */
    function completeVoting(address winningCandidate) 
        private 
    {
        string memory winnerName = candidates[currentVotingId][winningCandidate].name;
        uint256 voteCount = candidates[currentVotingId][winningCandidate].voteCount;
        
        votingSessions[currentVotingId].winner = winningCandidate;
        votingSessions[currentVotingId].winnerName = winnerName;
        votingSessions[currentVotingId].endTimestamp = block.timestamp;
        votingSessions[currentVotingId].state = VotingState.Completed;
        
        pastVotingIds.push(currentVotingId);
        currentState = VotingState.Inactive;
        
        emit VotingCompleted(currentVotingId, winningCandidate, winnerName, voteCount);
    }
    
    /**
     * @dev Cancella una votazione in corso (solo admin)
     */
    function cancelVoting() 
        external 
        onlyAdmin
    {
        require(currentState != VotingState.Inactive, "Nessuna votazione attiva");
        
        votingSessions[currentVotingId].state = VotingState.Completed;
        votingSessions[currentVotingId].endTimestamp = block.timestamp;
        pastVotingIds.push(currentVotingId);
        
        currentState = VotingState.Inactive;
        
        emit VotingCancelled(currentVotingId, block.timestamp);
    }
    
    /**
     * @dev Prelievo dei fondi (solo admin)
     * @param amount Importo da prelevare
     */
    function withdrawFunds(uint256 amount) 
        external 
        onlyAdmin
    {
        require(amount <= address(this).balance, "Saldo insufficiente");
        
        (bool success, ) = admin.call{value: amount}("");
        require(success, "Trasferimento fallito");
        
        emit FundsWithdrawn(admin, amount);
    }
    
    /**
     * @dev Ottiene i dettagli di un candidato
     * @param votingId ID della sessione di voto
     * @param candidateAddress Indirizzo del candidato
     * @return name Nome del candidato
     * @return proposal Proposta del candidato
     * @return voteCount Numero di voti ricevuti
     */
    function getCandidateDetails(uint256 votingId, address candidateAddress) 
        external 
        view 
        returns (string memory name, string memory proposal, uint256 voteCount)
    {
        require(candidates[votingId][candidateAddress].isRegistered, "Candidato non registrato");
        
        Candidate memory candidate = candidates[votingId][candidateAddress];
        return (candidate.name, candidate.proposal, candidate.voteCount);
    }
    
    /**
     * @dev Ottiene l'elenco dei candidati per una sessione di voto
     * @param votingId ID della sessione di voto
     * @return candidatesList Elenco di indirizzi dei candidati
     */
    function getCandidatesList(uint256 votingId) 
        external 
        view 
        returns (address[] memory candidatesList)
    {
        return votingSessions[votingId].candidateAddresses;
    }
    
    /**
     * @dev Controlla se un votante ha già votato
     * @param votingId ID della sessione di voto
     * @param voterAddress Indirizzo del votante
     * @return hasVotedStatus True se ha già votato, false altrimenti
     */
    function hasVoted(uint256 votingId, address voterAddress) 
        external 
        view 
        returns (bool hasVotedStatus)
    {
        return voters[votingId][voterAddress].hasVoted;
    }
    
    /**
     * @dev Ottiene l'ID della votazione corrente
     * @return currentId ID della votazione corrente o 0 se non ce ne sono
     */
    function getCurrentVotingId() 
        external 
        view 
        returns (uint256 currentId)
    {
        if (currentState == VotingState.Inactive) {
            return 0;
        }
        return currentVotingId;
    }
    
    /**
     * @dev Ottiene lo stato corrente del sistema
     * @return state Stato corrente (inattivo, registrazione, votazione, completato)
     */
    function getCurrentState() 
        external 
        view 
        returns (VotingState state)
    {
        return currentState;
    }
    
    /**
     * @dev Ottiene l'elenco di tutte le votazioni passate
     * @return pastIds Elenco di ID delle votazioni passate
     */
    function getPastVotingSessions() 
        external 
        view 
        returns (uint256[] memory pastIds)
    {
        return pastVotingIds;
    }
    
    /**
     * @dev Ottiene i risultati di una votazione specifica
     * @param votingId ID della sessione di voto
     * @return title Titolo della votazione
     * @return totalVotes Numero totale di voti espressi
     * @return winner Indirizzo del vincitore
     * @return winnerName Nome del vincitore
     * @return voteCount Numero di voti del vincitore
     */
    function getVotingResults(uint256 votingId) 
        external 
        view 
        returns (
            string memory title,
            uint256 totalVotes,
            address winner,
            string memory winnerName,
            uint256 voteCount
        )
    {
        require(votingId > 0 && votingId <= currentVotingId, "ID votazione non valido");
        require(votingSessions[votingId].state == VotingState.Completed, "Votazione non completata");
        
        VotingSession memory session = votingSessions[votingId];
        uint256 winnerVotes = 0;
        
        if (session.winner != address(0)) {
            winnerVotes = candidates[votingId][session.winner].voteCount;
        }
        
        return (
            session.title,
            session.totalVotes,
            session.winner,
            session.winnerName,
            winnerVotes
        );
    }
        
    // Aggiungi questa struct al contratto
    struct VotingSessionDetails {
        uint256 id;
        string title;
        string description;
        uint256 registrationFee;
        uint256 votingFee;
        uint256 maxVotesRequired;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 totalCandidates;
        address winner;
        string winnerName;
        uint256 totalVotes;
        VotingState state;
    }

    // Modifica la funzione per usare la struct
    function getVotingSessionDetails(uint256 votingId) 
        external 
        view 
        returns (VotingSessionDetails memory)
    {
        require(votingId > 0 && votingId <= currentVotingId, "ID votazione non valido");
        
        VotingSession storage session = votingSessions[votingId];
        
        return VotingSessionDetails({
            id: session.id,
            title: session.title,
            description: session.description,
            registrationFee: session.registrationFee,
            votingFee: session.votingFee,
            maxVotesRequired: session.maxVotesRequired,
            startTimestamp: session.startTimestamp,
            endTimestamp: session.endTimestamp,
            totalCandidates: session.candidateAddresses.length,
            winner: session.winner,
            winnerName: session.winnerName,
            totalVotes: session.totalVotes,
            state: session.state
        });
    }
    
    /**
     * @dev Ottiene l'elenco completo delle votazioni passate con i rispettivi risultati
     * @return votingIds Elenco degli ID delle votazioni
     * @return titles Elenco dei titoli delle votazioni
     * @return winners Elenco degli indirizzi dei vincitori
     * @return winnerNames Elenco dei nomi dei vincitori
     * @return voteCounts Elenco dei voti dei vincitori
     */
    function getAllPastVotingResults() 
        external 
        view 
        returns (
            uint256[] memory votingIds,
            string[] memory titles,
            address[] memory winners,
            string[] memory winnerNames,
            uint256[] memory voteCounts
        )
    {
        uint256 count = pastVotingIds.length;
        
        votingIds = new uint256[](count);
        titles = new string[](count);
        winners = new address[](count);
        winnerNames = new string[](count);
        voteCounts = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 votingId = pastVotingIds[i];
            VotingSession memory session = votingSessions[votingId];
            
            votingIds[i] = votingId;
            titles[i] = session.title;
            winners[i] = session.winner;
            winnerNames[i] = session.winnerName;
            
            if (session.winner != address(0)) {
                voteCounts[i] = candidates[votingId][session.winner].voteCount;
            } else {
                voteCounts[i] = 0;
            }
        }
        
        return (votingIds, titles, winners, winnerNames, voteCounts);
    }
    
    /**
     * @dev Trova l'indice di un candidato nell'array candidateAddresses
     * @param candidateAddress Indirizzo del candidato
     * @return candidateIndex Indice del candidato o 0 se non trovato
     */
    function findCandidateIndex(address candidateAddress) 
        private 
        view 
        returns (uint256 candidateIndex)
    {
        address[] memory addresses = votingSessions[currentVotingId].candidateAddresses;
        
        for (uint256 i = 0; i < addresses.length; i++) {
            if (addresses[i] == candidateAddress) {
                return i;
            }
        }
        
        return 0; // Non dovrebbe mai verificarsi se il candidato è registrato
    }
    
    /**
     * @dev Restituisce il saldo del contratto
     * @return balance Saldo corrente in wei
     */
    function getBalance() 
        external 
        view 
        onlyAdmin 
        returns (uint256 balance)
    {
        return address(this).balance;
    }
    
    /**
     * @dev Cambia l'amministratore del contratto
     * @param newAdmin Indirizzo del nuovo amministratore
     */
    function changeAdmin(address newAdmin) 
        external 
        onlyAdmin
    {
        require(newAdmin != address(0), "Indirizzo admin non valido");
        admin = newAdmin;
    }
}