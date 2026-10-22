// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleNFTNoRoyalty
 * @dev Contratto ERC721 minimale senza supporto ERC2981.
 *      Usato esclusivamente nei test per verificare che il Marketplace
 *      gestisca correttamente NFT che non implementano le royalties.
 */
contract SimpleNFTNoRoyalty is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("SimpleNFT", "SNFT") Ownable(msg.sender) {}

    function mint(address to, string memory /* uri */) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }
}
