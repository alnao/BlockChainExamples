const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentCertifier", function () {
  let certifier, owner, issuer, recipient, nonIssuer, nonAdmin;
  beforeEach(async () => {
    [owner, issuer, recipient, nonIssuer, nonAdmin] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocumentCertifier");
    certifier = await Factory.deploy();
    await certifier.deployed();
    // Aggiungi almeno un tipo di documento
    await certifier.addDocumentType("Certificate");
  });

  it("admin può aggiungere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    expect(await certifier.isAuthorizedIssuer(issuer.address)).to.be.true;
  });

  it("non admin non può aggiungere issuer", async () => {
    await expect(certifier.connect(nonAdmin).addIssuer(nonAdmin.address))
      .to.be.revertedWith("Only admin");
  });

  it("issuer può emettere document", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc"));
    const tx = await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    await expect(tx).to.emit(certifier, "DocumentIssued").withArgs(hash, issuer.address, recipient.address, "Certificate");
    const doc = await certifier.getDocument(hash);
    expect(doc.recipient).to.equal(recipient.address);
    expect(doc.documentType).to.equal("Certificate");
  });

  it("non issuer non può emettere document", async () => {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc"));
    await expect(certifier.connect(nonIssuer).issueDocument(recipient.address, hash, "uri", "Certificate"))
      .to.be.revertedWith("Not authorized issuer");
  });

  it("emissione duplicata fallisce", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    await expect(certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate"))
      .to.be.revertedWith("Document already issued");
  });

  it("un documento non emesso non è validato", async () => {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("not_existing"));
    const doc = await certifier.getDocument(hash);
    expect(doc.issuer).to.equal(ethers.constants.AddressZero);
    expect(doc.recipient).to.equal(ethers.constants.AddressZero);
    expect(doc.documentType).to.equal("");
  });

  it("un documento emesso è validabile", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("valid_doc"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    const doc = await certifier.getDocument(hash);
    expect(doc.issuer).to.equal(issuer.address);
    expect(doc.recipient).to.equal(recipient.address);
    expect(doc.revoked).to.be.false;
    expect(doc.documentType).to.equal("Certificate");
  });

  it("issuer può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("to_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    const tx = await certifier.connect(issuer).revokeDocument(hash);
    await expect(tx).to.emit(certifier, "DocumentRevoked").withArgs(hash);
    const doc = await certifier.getDocument(hash);
    expect(doc.revoked).to.be.true;
    expect(doc.documentType).to.equal("Certificate");
  });

  it("non issuer non può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("unauthorized_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    await expect(certifier.connect(nonIssuer).revokeDocument(hash))
      .to.be.revertedWith("Not authorized issuer");
  });

  it("solo admin può rimuovere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    await certifier.removeIssuer(issuer.address);
    expect(await certifier.isAuthorizedIssuer(issuer.address)).to.be.false;
  });

  it("non admin non può rimuovere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    await expect(certifier.connect(nonAdmin).removeIssuer(issuer.address))
      .to.be.revertedWith("Only admin");
  });
});