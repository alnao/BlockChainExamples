// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Marketplace
 * @notice Marketplace decentralizzato per NFT ERC721 con:
 *  - Pagamento in token ERC20 (NAO)
 *  - Supporto royalties ERC2981
 *  - Commissione del marketplace (feeBps, default 250 = 2.5%)
 *  - Ownable: solo il proprietario può cambiare fee e prelevare proventi
 *  - Pausable: il proprietario può sospendere il marketplace in emergenza
 */
contract Marketplace is ReentrancyGuard, Ownable, Pausable {
    IERC20 public paymentToken;

    /// @notice Fee del marketplace in basis points (1 bps = 0.01%). Max 1000 (10%).
    uint256 public feeBps;

    /// @notice Proventi accumulati dal marketplace (fee) pronti per il withdraw.
    uint256 public accumulatedFees;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // NFT Contract Address -> Token ID -> Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------
    event ItemListed(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemCanceled(address indexed nftAddress, uint256 indexed tokenId, address indexed seller);
    event ItemPriceUpdated(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 newPrice);
    event ItemBought(address indexed nftAddress, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeesWithdrawn(address indexed to, uint256 amount);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------
    constructor(address _paymentToken, uint256 _feeBps) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_feeBps <= 1000, "Fee cannot exceed 10%");
        paymentToken = IERC20(_paymentToken);
        feeBps = _feeBps;
    }

    // -----------------------------------------------------------------------
    // Admin functions
    // -----------------------------------------------------------------------

    /// @notice Aggiorna la fee del marketplace (solo owner).
    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee cannot exceed 10%");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    /// @notice Preleva i proventi delle fee accumulati (solo owner).
    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees to withdraw");
        accumulatedFees = 0;
        require(paymentToken.transfer(to, amount), "Withdraw failed");
        emit FeesWithdrawn(to, amount);
    }

    /// @notice Mette in pausa tutte le operazioni (solo owner).
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Rimuove la pausa (solo owner).
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------------------------------------------------------
    // Marketplace functions
    // -----------------------------------------------------------------------

    /**
     * @notice Lista un NFT a prezzo fisso in NAO token.
     * @param nftAddress Indirizzo del contratto ERC721.
     * @param tokenId    ID del token.
     * @param price      Prezzo in NAO (wei), deve essere > 0.
     */
    function listItem(address nftAddress, uint256 tokenId, uint256 price)
        external
        nonReentrant
        whenNotPaused
    {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Not approved"
        );

        listings[nftAddress][tokenId] = Listing(msg.sender, price, true);
        emit ItemListed(nftAddress, tokenId, msg.sender, price);
    }

    /**
     * @notice Aggiorna il prezzo di un listing esistente.
     */
    function updateListingPrice(address nftAddress, uint256 tokenId, uint256 newPrice)
        external
        nonReentrant
        whenNotPaused
    {
        require(newPrice > 0, "Price must be > 0");
        Listing storage listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        listing.price = newPrice;
        emit ItemPriceUpdated(nftAddress, tokenId, msg.sender, newPrice);
    }

    /**
     * @notice Cancella un listing. Può essere chiamato anche quando il marketplace è in pausa.
     */
    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[nftAddress][tokenId];
        emit ItemCanceled(nftAddress, tokenId, msg.sender);
    }

    /**
     * @notice Acquista un NFT listato.
     *
     * Distribuzione del prezzo (es. 20 NAO, fee=2.5%, royalty=5%):
     *   - Royalty al creator originale : 1 NAO  (5%)
     *   - Fee al marketplace           : 0.5 NAO (2.5%)
     *   - Proventi netti al seller     : 18.5 NAO
     *
     * @param nftAddress Indirizzo del contratto ERC721.
     * @param tokenId    ID del token.
     */
    function buyItem(address nftAddress, uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
    {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");
        require(IERC721(nftAddress).ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");
        require(listing.seller != msg.sender, "Seller cannot buy own NFT");

        uint256 price = listing.price;

        // 1. Calcola royalties ERC2981 (opzionale, con try/catch per NFT senza supporto)
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);
        try IERC2981(nftAddress).royaltyInfo(tokenId, price) returns (
            address _receiver, uint256 _royaltyAmount
        ) {
            royaltyReceiver = _receiver;
            royaltyAmount   = _royaltyAmount;
        } catch {}

        // 2. Calcola fee del marketplace
        uint256 feeAmount = (price * feeBps) / 10_000;

        // 3. Sanity check: royalty + fee non superano il 100% del prezzo
        require(royaltyAmount + feeAmount <= price, "Fees exceed price");

        // 4. Pagamento royalty al creator
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            require(
                paymentToken.transferFrom(msg.sender, royaltyReceiver, royaltyAmount),
                "Royalty transfer failed"
            );
        }

        // 5. Accumula fee del marketplace
        if (feeAmount > 0) {
            require(
                paymentToken.transferFrom(msg.sender, address(this), feeAmount),
                "Fee transfer failed"
            );
            accumulatedFees += feeAmount;
        }

        // 6. Paga il seller (residuo netto)
        uint256 sellerAmount = price - royaltyAmount - feeAmount;
        require(
            paymentToken.transferFrom(msg.sender, listing.seller, sellerAmount),
            "Seller transfer failed"
        );

        // 7. Trasferisci NFT al buyer
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // 8. Rimuovi listing
        delete listings[nftAddress][tokenId];

        emit ItemBought(nftAddress, tokenId, msg.sender, price);
    }

    // -----------------------------------------------------------------------
    // View helpers
    // -----------------------------------------------------------------------

    /// @notice Restituisce i dettagli di un listing.
    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (address seller, uint256 price, bool active)
    {
        Listing memory l = listings[nftAddress][tokenId];
        return (l.seller, l.price, l.active);
    }

    /**
     * @notice Simula la distribuzione del pagamento per un NFT listato.
     * @return royaltyAmount Importo royalty al creator.
     * @return feeAmount     Importo fee al marketplace.
     * @return sellerAmount  Importo netto al seller.
     */
    function getPaymentBreakdown(address nftAddress, uint256 tokenId)
        external
        view
        returns (uint256 royaltyAmount, uint256 feeAmount, uint256 sellerAmount)
    {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");

        uint256 price = listing.price;

        // Royalty (view call: non reverterà)
        try IERC2981(nftAddress).royaltyInfo(tokenId, price) returns (
            address, uint256 _royaltyAmount
        ) {
            royaltyAmount = _royaltyAmount;
        } catch {}

        feeAmount    = (price * feeBps) / 10_000;
        sellerAmount = price - royaltyAmount - feeAmount;
    }
}
