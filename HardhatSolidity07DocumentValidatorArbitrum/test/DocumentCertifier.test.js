// test/DocumentCertifier.test.js — ethers v6
// I revert string sono quelli del contratto DocumentCertifier.sol:
//   "Not admin"           → modifier onlyAdmin
//   "Not authorized issuer" → modifier onlyIssuer
//   "Unauthorized"        → revokeDocument (non-issuer, non-admin)
//   "Document not found"  → getDocument / revokeDocument su hash inesistente
//   "Document already issued" → issueDocument duplicato

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentCertifier", function () {
  let certifier, owner, issuer, recipient, nonIssuer, nonAdmin;

  beforeEach(async () => {
    [owner, issuer, recipient, nonIssuer, nonAdmin] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("DocumentCertifier");
    certifier = await Factory.deploy();
    await certifier.waitForDeployment();   // ethers v6: waitForDeployment() al posto di .deployed()

    await certifier.addDocumentType("Certificate");
  });

  // ---- Gestione issuer ---------------------------------------------------

  it("admin può aggiungere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    expect(await certifier.isAuthorizedIssuer(issuer.address)).to.be.true;
  });

  it("non admin non può aggiungere issuer", async () => {
    await expect(certifier.connect(nonAdmin).addIssuer(nonAdmin.address))
      .to.be.revertedWith("Not admin");     // contratto usa "Not admin"
  });

  it("solo admin può rimuovere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    await certifier.removeIssuer(issuer.address);
    expect(await certifier.isAuthorizedIssuer(issuer.address)).to.be.false;
  });

  it("non admin non può rimuovere issuer", async () => {
    await certifier.addIssuer(issuer.address);
    await expect(certifier.connect(nonAdmin).removeIssuer(issuer.address))
      .to.be.revertedWith("Not admin");     // contratto usa "Not admin"
  });

  // ---- Emissione documento -----------------------------------------------

  it("issuer può emettere documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("doc"));  // ethers v6: no .utils

    const tx = await certifier.connect(issuer).issueDocument(
      recipient.address, hash, "uri", "Certificate"
    );
    await expect(tx)
      .to.emit(certifier, "DocumentIssued")
      .withArgs(hash, issuer.address, recipient.address, "Certificate");

    // getDocument ritorna tuple posizionale in ethers v6
    const doc = await certifier.getDocument(hash);
    expect(doc.recipient).to.equal(recipient.address);
    expect(doc.documentType).to.equal("Certificate");
  });

  it("non issuer non può emettere documento", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await expect(
      certifier.connect(nonIssuer).issueDocument(recipient.address, hash, "uri", "Certificate")
    ).to.be.revertedWith("Not authorized issuer");
  });

  it("emissione duplicata fallisce", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("doc_dup"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");
    await expect(
      certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate")
    ).to.be.revertedWith("Document already issued");
  });

  // ---- Lettura documento -------------------------------------------------

  it("getDocument su hash inesistente lancia 'Document not found'", async () => {
    // Il contratto fa require(doc.issuedAt != 0) → non ritorna dati vuoti, lancia eccezione
    const hash = ethers.keccak256(ethers.toUtf8Bytes("not_existing"));
    await expect(certifier.getDocument(hash))
      .to.be.revertedWith("Document not found");
  });

  it("documento emesso è validabile", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("valid_doc"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");

    const doc = await certifier.getDocument(hash);
    expect(doc.issuer).to.equal(issuer.address);
    expect(doc.recipient).to.equal(recipient.address);
    expect(doc.revoked).to.be.false;
    expect(doc.documentType).to.equal("Certificate");
  });

  // ---- Revoca documento --------------------------------------------------

  it("issuer può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("to_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");

    const tx = await certifier.connect(issuer).revokeDocument(hash);
    await expect(tx).to.emit(certifier, "DocumentRevoked").withArgs(hash);

    const doc = await certifier.getDocument(hash);
    expect(doc.revoked).to.be.true;
  });

  it("admin può revocare documento (anche senza essere issuer)", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("admin_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");

    // owner è l'admin
    const tx = await certifier.connect(owner).revokeDocument(hash);
    await expect(tx).to.emit(certifier, "DocumentRevoked").withArgs(hash);
  });

  it("terzo non autorizzato non può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("unauthorized_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri", "Certificate");

    await expect(certifier.connect(nonIssuer).revokeDocument(hash))
      .to.be.revertedWith("Unauthorized");  // contratto usa "Unauthorized" per non-issuer/non-admin
  });

  it("revocare documento inesistente fallisce", async () => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("ghost"));
    await expect(certifier.revokeDocument(hash))
      .to.be.revertedWith("Document not found");
  });

  // ---- Trasferimento admin -----------------------------------------------

  it("admin può trasferire il ruolo", async () => {
    await certifier.transferAdmin(issuer.address);
    expect(await certifier.admin()).to.equal(issuer.address);
  });

  it("non admin non può trasferire il ruolo", async () => {
    await expect(certifier.connect(nonAdmin).transferAdmin(nonAdmin.address))
      .to.be.revertedWith("Not admin");
  });
});
