const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocumentCertifier", function () {
  let certifier, owner, issuer, recipient, nonIssuer, nonAdmin;
  beforeEach(async () => {
    [owner, issuer, recipient, nonIssuer, nonAdmin] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DocumentCertifier");
    certifier = await Factory.deploy();
    await certifier.deployed();
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
    const tx = await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri");
    await expect(tx).to.emit(certifier, "DocumentIssued").withArgs(hash, issuer.address, recipient.address);
    const doc = await certifier.getDocument(hash);
    expect(doc.recipient).to.equal(recipient.address);
  });

  it("non issuer non può emettere document", async () => {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc"));
    await expect(certifier.connect(nonIssuer).issueDocument(recipient.address, hash, "uri"))
      .to.be.revertedWith("Not authorized issuer");
  });

  it("emissione duplicata fallisce", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("doc"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri");
    await expect(certifier.connect(issuer).issueDocument(recipient.address, hash, "uri"))
      .to.be.revertedWith("Document already issued");
  });

  it("un documento non emesso non è validato", async () => {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("not_existing"));
    const doc = await certifier.getDocument(hash);
    expect(doc.issuer).to.equal(ethers.constants.AddressZero);
    expect(doc.recipient).to.equal(ethers.constants.AddressZero);
  });

  it("un documento emesso è validabile", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("valid_doc"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri");
    const doc = await certifier.getDocument(hash);
    expect(doc.issuer).to.equal(issuer.address);
    expect(doc.recipient).to.equal(recipient.address);
    expect(doc.revoked).to.be.false;
  });

  it("issuer può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("to_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri");
    const tx = await certifier.connect(issuer).revokeDocument(hash);
    await expect(tx).to.emit(certifier, "DocumentRevoked").withArgs(hash);
    const doc = await certifier.getDocument(hash);
    expect(doc.revoked).to.be.true;
  });

  it("non issuer non può revocare documento", async () => {
    await certifier.addIssuer(issuer.address);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("unauthorized_revoke"));
    await certifier.connect(issuer).issueDocument(recipient.address, hash, "uri");
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