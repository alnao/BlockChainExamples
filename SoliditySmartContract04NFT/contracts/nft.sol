// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleNFT
 * @dev Implementazione base di un token non fungibile (NFT) ERC-721
 */
contract SimpleNFT {
    // Variabili di stato
    string public name;
    string public symbol;
    
    // Contatore per ID token
    uint256 private _tokenIdCounter;
    
    // Mapping da token ID a proprietario
    mapping(uint256 => address) private _owners;
    
    // Mapping da proprietario a numero di token posseduti
    mapping(address => uint256) private _balances;
    
    // Mapping da token ID a URI (metadata)
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping da token ID a indirizzi approvati per il trasferimento
    mapping(uint256 => address) private _tokenApprovals;
    
    // Mapping da proprietario a operatore a stato di approvazione (per tutti i token)
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Eventi
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    /**
     * @dev Costruttore
     */
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Restituisce il numero di token posseduti da un indirizzo
     */
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return _balances[owner];
    }
    
    /**
     * @dev Restituisce il proprietario di un token
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
    
    /**
     * @dev Restituisce l'URI dei metadati di un token
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
    
    /**
     * @dev Verifica se un token esiste
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _owners[tokenId] != address(0);
    }
    
    /**
     * @dev Conia un nuovo token
     */
    function mint(address to, string memory uri) public returns (uint256) {
        require(to != address(0), "ERC721: mint to the zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _balances[to]++;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = uri;
        
        emit Transfer(address(0), to, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Trasferisce un token
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        require(to != address(0), "ERC721: transfer to the zero address");
        require(_owners[tokenId] == from, "ERC721: transfer of token that is not owned");
        
        // Cancella le approvazioni precedenti
        _approve(address(0), tokenId);
        
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    /**
     * @dev Approva un indirizzo a trasferire un token specifico
     */
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all");
            
        _approve(to, tokenId);
    }
    
    /**
     * @dev Ottiene l'indirizzo approvato per un token
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "ERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }
    
    /**
     * @dev Imposta o rimuove l'approvazione per un operatore
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC721: approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @dev Verifica se un indirizzo è un operatore approvato per un proprietario
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    
    /**
     * @dev Funzione interna per approvare un indirizzo
     */
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
    
    /**
     * @dev Verifica se il mittente è proprietario o approvato
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "ERC721: operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }
}