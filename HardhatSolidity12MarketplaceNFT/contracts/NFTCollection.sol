// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTCollection
 * @notice Collezione NFT ERC721 con:
 *  - Royalties ERC2981 (default 5%, configurabile dall'owner)
 *  - Mint riservato all'owner (per collezioni curate)
 *  - Mint pubblico a pagamento in ETH (per collezioni aperte)
 *  - Withdraw degli ETH accumulati dai mint pubblici (solo owner)
 */
contract NFTCollection is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    /// @notice Prezzo per il mint pubblico in ETH (0 = mint pubblico disabilitato).
    uint256 public publicMintPrice;

    /// @notice Supply massima di NFT mintabili (0 = illimitata).
    uint256 public maxSupply;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------
    event PublicMinted(address indexed to, uint256 indexed tokenId, string uri);
    event PublicMintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event RoyaltyUpdated(address indexed receiver, uint96 feeBps);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------
    /**
     * @param _publicMintPrice Prezzo in ETH per il mint pubblico (0 = disabilitato).
     * @param _maxSupply       Supply massima (0 = illimitata).
     */
    constructor(uint256 _publicMintPrice, uint256 _maxSupply)
        ERC721("MyNFTCollection", "MNFT")
        Ownable(msg.sender)
    {
        // Default royalty: 5% (500 basis points) al creator/owner
        _setDefaultRoyalty(msg.sender, 500);
        publicMintPrice = _publicMintPrice;
        maxSupply = _maxSupply;
    }

    // -----------------------------------------------------------------------
    // Owner functions
    // -----------------------------------------------------------------------

    /**
     * @notice Minta un NFT a un destinatario specifico (solo owner, gratuito).
     * Usato per pre-mint, distribuzioni speciali, fund.js, ecc.
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextMint(to, uri);
        return tokenId;
    }

    /// @notice Aggiorna il prezzo del mint pubblico (0 per disabilitarlo).
    function setPublicMintPrice(uint256 _price) external onlyOwner {
        emit PublicMintPriceUpdated(publicMintPrice, _price);
        publicMintPrice = _price;
    }

    /// @notice Aggiorna la royalty di default per tutti gli NFT futuri.
    function setDefaultRoyalty(address receiver, uint96 feeBps) external onlyOwner {
        _setDefaultRoyalty(receiver, feeBps);
        emit RoyaltyUpdated(receiver, feeBps);
    }

    /// @notice Imposta una royalty specifica per un singolo tokenId.
    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeBps) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeBps);
        emit RoyaltyUpdated(receiver, feeBps);
    }

    /// @notice Preleva gli ETH accumulati dai mint pubblici.
    function withdrawFunds(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 amount = address(this).balance;
        require(amount > 0, "Nothing to withdraw");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Withdraw failed");
        emit FundsWithdrawn(to, amount);
    }

    // -----------------------------------------------------------------------
    // Public mint
    // -----------------------------------------------------------------------

    /**
     * @notice Mint pubblico a pagamento in ETH.
     * @param uri URI dei metadati dell'NFT (es. IPFS CID).
     */
    function publicMint(string memory uri) external payable returns (uint256) {
        require(publicMintPrice > 0, "Public mint not enabled");
        require(msg.value >= publicMintPrice, "Insufficient ETH");

        uint256 tokenId = _nextMint(msg.sender, uri);

        // Rimborsa l'eccesso eventuale
        if (msg.value > publicMintPrice) {
            (bool ok, ) = msg.sender.call{value: msg.value - publicMintPrice}("");
            require(ok, "Refund failed");
        }

        emit PublicMinted(msg.sender, tokenId, uri);
        return tokenId;
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    function _nextMint(address to, string memory uri) internal returns (uint256) {
        if (maxSupply > 0) {
            require(_nextTokenId < maxSupply, "Max supply reached");
        }
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    // -----------------------------------------------------------------------
    // View
    // -----------------------------------------------------------------------

    /// @notice Numero totale di NFT mintati finora.
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // -----------------------------------------------------------------------
    // Required overrides
    // -----------------------------------------------------------------------

    function tokenURI(uint256 tokenId)
        public view override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
