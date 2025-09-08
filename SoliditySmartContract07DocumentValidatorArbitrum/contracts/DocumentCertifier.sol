// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentCertifier {
    address public admin;

    // Lista dei tipi di documento gestita da admin
    string[] public documentTypes;
    mapping(string => bool) public isValidDocumentType;

    struct Document {
        address issuer;
        address recipient;
        string metadataURI;
        uint256 issuedAt;
        bool revoked;
        string documentType;
    }

    mapping(bytes32 => Document) public documents;
    mapping(address => bool) public isAuthorizedIssuer;

    event DocumentTypeAdded(string documentType);
    event DocumentTypeRemoved(string documentType);

    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event DocumentIssued(bytes32 indexed hash, address indexed issuer, address indexed recipient, string documentType);
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

    // Admin aggiunge un tipo di documento
    function addDocumentType(string calldata documentType) external onlyAdmin {
        require(!isValidDocumentType[documentType], "Type already exists");
        documentTypes.push(documentType);
        isValidDocumentType[documentType] = true;
        emit DocumentTypeAdded(documentType);
    }

    // Admin rimuove un tipo di documento
    function removeDocumentType(string calldata documentType) external onlyAdmin {
        require(isValidDocumentType[documentType], "Type not found");
        isValidDocumentType[documentType] = false;
        // Remove from array (not efficient, only for few types)
        for (uint i = 0; i < documentTypes.length; i++) {
            if (keccak256(bytes(documentTypes[i])) == keccak256(bytes(documentType))) {
                documentTypes[i] = documentTypes[documentTypes.length - 1];
                documentTypes.pop();
                break;
            }
        }
        emit DocumentTypeRemoved(documentType);
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
    function issueDocument(address recipient, bytes32 docHash, string calldata metadataURI, string calldata documentType) external onlyIssuer {
        require(documents[docHash].issuedAt == 0, "Document already issued");
        require(isValidDocumentType[documentType], "Invalid document type");

        documents[docHash] = Document({
            issuer: msg.sender,
            recipient: recipient,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            revoked: false,
            documentType: documentType
        });

        emit DocumentIssued(docHash, msg.sender, recipient, documentType);
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
        bool revoked,
        string memory documentType
    ) {
        Document memory doc = documents[docHash];
        require(doc.issuedAt != 0, "Document not found");

        return (
            doc.issuer,
            doc.recipient,
            doc.metadataURI,
            doc.issuedAt,
            doc.revoked,
            doc.documentType
        );
    }

    // Transfer admin role
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }
}