// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleVoting
 * @dev Contratto semplice per gestire votazioni on-chain
 */
contract SimpleVoting {
    // Strutture dati
    struct Proposta {
        uint256 id;
        string descrizione;
        uint256 votiTotali;
        bool eseguita;
        mapping(address => bool) haVotato;
    }
    
    struct Elettore {
        bool iscritto;
        uint256 peso;
        uint256[] proposteVotate;
    }
    
    // Variabili di stato
    address public presidente;
    mapping(address => Elettore) public elettori;
    Proposta[] public proposte;
    
    uint256 public inizioVotazioni;
    uint256 public durataVotazioni;
    bool public votoFinito;
    
    // Eventi
    event EletoreRegistrato(address elettore);
    event PropostaAggiunta(uint256 idProposta, string descrizione);
    event VotoEffettuato(address elettore, uint256 idProposta);
    event PropostaEseguita(uint256 idProposta);
    
    // Modificatori
    modifier soloPresidente() {
        require(msg.sender == presidente, "Solo il presidente puo' eseguire questa operazione");
        _;
    }
    
    modifier votazioniAttive() {
        require(block.timestamp >= inizioVotazioni, "Le votazioni non sono ancora iniziate");
        require(block.timestamp < inizioVotazioni + durataVotazioni, "Le votazioni sono terminate");
        require(!votoFinito, "Le votazioni sono state concluse");
        _;
    }
    
    modifier votazioniTerminate() {
        require(block.timestamp >= inizioVotazioni + durataVotazioni || votoFinito, "Le votazioni non sono ancora terminate");
        _;
    }
    
    /**
     * @dev Costruttore
     * @param _durataOre Durata delle votazioni in ore
     */
    constructor(uint256 _durataOre) {
        presidente = msg.sender;
        
        // Registra automaticamente il presidente
        elettori[presidente].iscritto = true;
        elettori[presidente].peso = 1;
        
        // Aggiunge il presidente all'elenco degli elettori
        indirizziElettori.push(presidente);
        
        inizioVotazioni = block.timestamp;
        durataVotazioni = _durataOre * 1 hours;
        votoFinito = false;
        
        emit EletoreRegistrato(presidente);
    }
    
    /**
     * @dev Registra un nuovo elettore
     * @param elettore L'indirizzo dell'elettore da registrare
     */
     /*
    function registraElettore(address elettore) public soloPresidente {
        require(!elettori[elettore].iscritto, "Elettore gia' registrato");
        elettori[elettore].iscritto = true;
        elettori[elettore].peso = 1;
        
        emit EletoreRegistrato(elettore);
    }*/
    
    /**
     * @dev Assegna diritti di delega a un elettore
     * @param delegato L'indirizzo a cui delegare il proprio voto
     */
    function delega(address delegato) public votazioniAttive {
        require(elettori[msg.sender].iscritto, "Non sei registrato come elettore");
        require(elettori[delegato].iscritto, "Il delegato non e' registrato come elettore");
        require(msg.sender != delegato, "Non puoi delegare a te stesso");
        
        // Verifica che l'elettore non abbia già votato
        require(elettori[msg.sender].proposteVotate.length == 0, "Hai gia' votato");
        
        // Aggiunge il peso dell'elettore al delegato
        elettori[delegato].peso += elettori[msg.sender].peso;
        elettori[msg.sender].peso = 0;
    }
    
    /**
     * @dev Aggiunge una nuova proposta
     * @param _descrizione La descrizione della proposta
     */
    function aggiungiProposta(string memory _descrizione) public soloPresidente votazioniAttive {
        uint256 idProposta = proposte.length;
        
        Proposta storage p = proposte.push();
        p.id = idProposta;
        p.descrizione = _descrizione;
        p.votiTotali = 0;
        p.eseguita = false;
        
        emit PropostaAggiunta(idProposta, _descrizione);
    }
    
    /**
     * @dev Permette a un elettore di votare
     * @param idProposta L'ID della proposta da votare
     */
    function vota(uint256 idProposta) public votazioniAttive {
        require(elettori[msg.sender].iscritto, "Non sei registrato come elettore");
        require(elettori[msg.sender].peso > 0, "Non hai diritto di voto (peso = 0)");
        require(idProposta < proposte.length, "Proposta non esistente");
        require(!proposte[idProposta].haVotato[msg.sender], "Hai gia' votato per questa proposta");
        
        proposte[idProposta].haVotato[msg.sender] = true;
        proposte[idProposta].votiTotali += elettori[msg.sender].peso;
        
        elettori[msg.sender].proposteVotate.push(idProposta);
        
        emit VotoEffettuato(msg.sender, idProposta);
    }
    
    /**
     * @dev Conclude le votazioni anticipatamente
     */
    function concludiVotazioni() public soloPresidente {
        require(!votoFinito, "Le votazioni sono gia' concluse");
        votoFinito = true;
    }
    
    /**
     * @dev Esegue una proposta vincente
     * @param idProposta L'ID della proposta da eseguire
     */
    function eseguiProposta(uint256 idProposta) public votazioniTerminate {
        require(idProposta < proposte.length, "Proposta non esistente");
        
        Proposta storage proposta = proposte[idProposta];
        
        require(!proposta.eseguita, "Proposta gia' eseguita");
        
        // Verifica se è la proposta vincente (la più votata)
        bool isVincente = true;
        for (uint256 i = 0; i < proposte.length; i++) {
            if (i != idProposta && proposte[i].votiTotali > proposta.votiTotali) {
                isVincente = false;
                break;
            }
        }
        
        require(isVincente, "Non e' la proposta piu' votata");
        
        proposta.eseguita = true;
        
        emit PropostaEseguita(idProposta);
    }
    
    /**
     * @dev Ottiene il numero totale di proposte
     */
    function getNumeroProposte() public view returns (uint256) {
        return proposte.length;
    }
    
    /**
     * @dev Ottiene i dettagli di una proposta
     */
    function getDettagliProposta(uint256 idProposta) public view returns (
        uint256 id,
        string memory descrizione,
        uint256 votiTotali,
        bool eseguita
    ) {
        require(idProposta < proposte.length, "Proposta non esistente");
        
        Proposta storage proposta = proposte[idProposta];
        return (
            proposta.id,
            proposta.descrizione,
            proposta.votiTotali,
            proposta.eseguita
        );
    }
    
    /**
     * @dev Verifica se un elettore ha votato per una proposta
     */
    function haVotato(address elettore, uint256 idProposta) public view returns (bool) {
        require(idProposta < proposte.length, "Proposta non esistente");
        return proposte[idProposta].haVotato[elettore];
    }
    
    /**
     * @dev Ottiene le proposte votate da un elettore
     */
    function getProposteVotate(address elettore) public view returns (uint256[] memory) {
        return elettori[elettore].proposteVotate;
    }
    
    /**
     * @dev Tiene traccia di tutti gli indirizzi degli elettori registrati
     */
    address[] private indirizziElettori;
    
    /**
     * @dev Ottiene l'elenco di tutti gli elettori registrati
     * @return Array di indirizzi degli elettori
     */
    function getElencoElettori() public view returns (address[] memory) {
        return indirizziElettori;
    }
    
    /**
     * @dev Modifica la funzione registraElettore per tenere traccia degli indirizzi
     */
    function registraElettore(address elettore) public soloPresidente {
        require(!elettori[elettore].iscritto, "Elettore gia' registrato");
        elettori[elettore].iscritto = true;
        elettori[elettore].peso = 1;
        
        // Aggiunge l'indirizzo all'elenco degli elettori
        indirizziElettori.push(elettore);
        
        emit EletoreRegistrato(elettore);
    }



 
    // Aggiungi questo evento per tracciare i cambi di presidente
    event PresidenteCambiato(address vecchioPresidente, address nuovoPresidente);
    
    /**
     * @dev Trasferisce il ruolo di presidente a un nuovo indirizzo
     * @param nuovoPresidente L'indirizzo del nuovo presidente
     */
    function cambiaPresidente(address nuovoPresidente) public soloPresidente {
        require(nuovoPresidente != address(0), "Indirizzo presidente non valido");
        require(nuovoPresidente != presidente, "Il nuovo presidente deve essere diverso dall'attuale");
        
        // Salva il riferimento al vecchio presidente per l'evento
        address vecchioPresidente = presidente;
        
        // Se il nuovo presidente non è già un elettore, registralo
        if (!elettori[nuovoPresidente].iscritto) {
            elettori[nuovoPresidente].iscritto = true;
            elettori[nuovoPresidente].peso = 1;
            indirizziElettori.push(nuovoPresidente);
            emit EletoreRegistrato(nuovoPresidente);
        }
        
        // Trasferisci il ruolo di presidente
        presidente = nuovoPresidente;
        
        // Emetti evento per tracciare il cambio
        emit PresidenteCambiato(vecchioPresidente, nuovoPresidente);
    }
}