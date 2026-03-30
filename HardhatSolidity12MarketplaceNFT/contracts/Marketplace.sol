// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    IERC20 public paymentToken;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // NFT Contract Address -> Token ID -> Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    event ItemListed(address indexed nftAddress, uint256 indexed tokenId, address seller, uint256 price);
    event ItemCanceled(address indexed nftAddress, uint256 indexed tokenId, address seller);
    event ItemBought(address indexed nftAddress, uint256 indexed tokenId, address buyer, uint256 price);

    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }

    function listItem(address nftAddress, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Not approved");

        listings[nftAddress][tokenId] = Listing(msg.sender, price, true);
        emit ItemListed(nftAddress, tokenId, msg.sender, price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[nftAddress][tokenId];
        emit ItemCanceled(nftAddress, tokenId, msg.sender);
    }

    function buyItem(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[nftAddress][tokenId];
        require(listing.active, "Not listed");
        
        // 1. Calculate Royalties
        uint256 royaltyAmount = 0;
        address receiver = address(0);
        
        try IERC2981(nftAddress).royaltyInfo(tokenId, listing.price) returns (address _receiver, uint256 _royaltyAmount) {
            receiver = _receiver;
            royaltyAmount = _royaltyAmount;
        } catch {}

        // 2. Pay Royalty
        if (royaltyAmount > 0 && receiver != address(0)) {
            require(paymentToken.transferFrom(msg.sender, receiver, royaltyAmount), "Royalty transfer failed");
        }

        // 3. Pay Seller (Price - Royalty)
        uint256 sellerAmount = listing.price - royaltyAmount;
        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerAmount), "Seller transfer failed");

        // 4. Transfer NFT
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // 5. Cleanup
        delete listings[nftAddress][tokenId];
        emit ItemBought(nftAddress, tokenId, msg.sender, listing.price);
    }
}
