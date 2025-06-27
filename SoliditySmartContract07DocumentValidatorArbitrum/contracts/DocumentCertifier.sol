// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentCertifier {
    address public admin;

    struct Document {
        address issuer;
        address recipient;
        string metadataURI;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(bytes32 => Document) public documents;
    mapping(address => bool) public isAuthorizedIssuer;

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed recipient);
    event DocumentRevoked(bytes32 indexed hash);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyIssuer() {
        require(isAuthorizedIssuer[msg.sender], "Not authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Admin adds an authorized issuer
    function addIssuer(address issuer) external onlyAdmin {
        require(!isAuthorizedIssuer[issuer], "Already authorized");
        isAuthorizedIssuer[issuer] = true;
        emit IssuerAdded(issuer);
    }

    // Admin removes an authorized issuer
    function removeIssuer(address issuer) external onlyAdmin {
        require(isAuthorizedIssuer[issuer], "Not an issuer");
        isAuthorizedIssuer[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // Issuer issues a document to a recipient
    function issueDocument(address recipient, bytes32 docHash, string calldata metadataURI) external onlyIssuer {
        require(documents[docHash].issuedAt == 0, "Document already issued");

        documents[docHash] = Document({
            issuer: msg.sender,
            recipient: recipient,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit DocumentIssued(docHash, msg.sender, recipient);
    }

    // Issuer or admin revokes a document
    function revokeDocument(bytes32 docHash) external {
        Document storage doc = documents[docHash];
        require(doc.issuedAt != 0, "Document not found");
        require(msg.sender == doc.issuer || msg.sender == admin, "Unauthorized");

        require(!doc.revoked, "Already revoked");
        doc.revoked = true;

        emit DocumentRevoked(docHash);
    }

    // Public function to retrieve document data
    function getDocument(bytes32 docHash) external view returns (
        address issuer,
        address recipient,
        string memory metadataURI,
        uint256 issuedAt,
        bool revoked
    ) {
        Document memory doc = documents[docHash];
        require(doc.issuedAt != 0, "Document not found");

        return (
            doc.issuer,
            doc.recipient,
            doc.metadataURI,
            doc.issuedAt,
            doc.revoked
        );
    }

    // Transfer admin role
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }
}