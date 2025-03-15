// test/SimpleNFT.test.js
const SimpleNFT = artifacts.require("SimpleNFT");
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

contract("SimpleNFT", function (accounts) {
  const [owner, alice, bob, charlie] = accounts;
  
  // URI esempio per i test
  const tokenURI1 = "https://example.com/metadata/1";
  const tokenURI2 = "https://example.com/metadata/2";
  
  let nftInstance;
  
  beforeEach(async function () {
    // Deploy un nuovo contratto per ogni test
    nftInstance = await SimpleNFT.new("MyAwesomeNFT", "MANFT", { from: owner });
  });
  
  describe("Informazioni di base", function () {
    it("dovrebbe avere il nome e simbolo corretti", async function () {
      const name = await nftInstance.name();
      const symbol = await nftInstance.symbol();
      
      assert.equal(name, "MyAwesomeNFT", "Il nome non corrisponde");
      assert.equal(symbol, "MANFT", "Il simbolo non corrisponde");
    });
  });
  
  describe("Minting", function () {
    it("dovrebbe permettere di coniare un nuovo token", async function () {
      const result = await nftInstance.mint(alice, tokenURI1, { from: owner });
      
      // Verifica l'evento Transfer emesso
      expectEvent(result, 'Transfer', {
        from: ZERO_ADDRESS,
        to: alice,
        tokenId: new BN(0)
      });
      
      // Verifica che il proprietario sia corretto
      const tokenOwner = await nftInstance.ownerOf(0);
      assert.equal(tokenOwner, alice, "Il proprietario del token non è corretto");
      
      // Verifica che l'URI sia corretto
      const uri = await nftInstance.tokenURI(0);
      assert.equal(uri, tokenURI1, "Il token URI non è corretto");
      
      // Verifica che il saldo di Alice sia aumentato
      const balance = await nftInstance.balanceOf(alice);
      assert.equal(balance.toString(), "1", "Il saldo non è corretto");
    });
    
    it("dovrebbe impedire di coniare a indirizzo zero", async function () {
      await expectRevert(
        nftInstance.mint(ZERO_ADDRESS, tokenURI1, { from: owner }),
        "ERC721: mint to the zero address"
      );
    });
  });
  
  describe("Trasferimenti", function () {
    beforeEach(async function () {
      // Conia token per i test di trasferimento
      await nftInstance.mint(alice, tokenURI1, { from: owner });
    });
    
    it("dovrebbe permettere al proprietario di trasferire il token", async function () {
      const result = await nftInstance.transferFrom(alice, bob, 0, { from: alice });
      
      // Verifica l'evento Transfer emesso
      expectEvent(result, 'Transfer', {
        from: alice,
        to: bob,
        tokenId: new BN(0)
      });
      
      // Verifica che il nuovo proprietario sia corretto
      const newOwner = await nftInstance.ownerOf(0);
      assert.equal(newOwner, bob, "Il proprietario del token non è stato aggiornato correttamente");
      
      // Verifica i saldi
      const aliceBalance = await nftInstance.balanceOf(alice);
      const bobBalance = await nftInstance.balanceOf(bob);
      assert.equal(aliceBalance.toString(), "0", "Il saldo di Alice non è corretto");
      assert.equal(bobBalance.toString(), "1", "Il saldo di Bob non è corretto");
    });
    
    it("dovrebbe impedire a non proprietari di trasferire il token", async function () {
      await expectRevert(
        nftInstance.transferFrom(alice, bob, 0, { from: bob }),
        "ERC721: transfer caller is not owner nor approved"
      );
    });
    
    it("dovrebbe impedire il trasferimento a indirizzo zero", async function () {
      await expectRevert(
        nftInstance.transferFrom(alice, ZERO_ADDRESS, 0, { from: alice }),
        "ERC721: transfer to the zero address"
      );
    });
  });
  
  describe("Approvazioni", function () {
    beforeEach(async function () {
      // Conia token per i test di approvazione
      await nftInstance.mint(alice, tokenURI1, { from: owner });
    });
    
    it("dovrebbe permettere al proprietario di approvare un altro indirizzo", async function () {
      const result = await nftInstance.approve(bob, 0, { from: alice });
      
      // Verifica l'evento Approval emesso
      expectEvent(result, 'Approval', {
        owner: alice,
        approved: bob,
        tokenId: new BN(0)
      });
      
      // Verifica che l'approvazione sia memorizzata correttamente
      const approved = await nftInstance.getApproved(0);
      assert.equal(approved, bob, "L'indirizzo approvato non è corretto");
    });
    
    it("dovrebbe permettere all'approvato di trasferire il token", async function () {
      // Alice approva Bob
      await nftInstance.approve(bob, 0, { from: alice });
      
      // Bob trasferisce il token a Charlie
      const result = await nftInstance.transferFrom(alice, charlie, 0, { from: bob });
      
      // Verifica l'evento Transfer emesso
      expectEvent(result, 'Transfer', {
        from: alice,
        to: charlie,
        tokenId: new BN(0)
      });
      
      // Verifica che il nuovo proprietario sia corretto
      const newOwner = await nftInstance.ownerOf(0);
      assert.equal(newOwner, charlie, "Il proprietario del token non è stato aggiornato correttamente");
    });
    
    it("dovrebbe consentire l'approvazione per tutti i token", async function () {
      // Alice approva Bob per tutti i suoi token
      const result = await nftInstance.setApprovalForAll(bob, true, { from: alice });
      
      // Verifica l'evento ApprovalForAll emesso
      expectEvent(result, 'ApprovalForAll', {
        owner: alice,
        operator: bob,
        approved: true
      });
      
      // Verifica che l'approvazione sia memorizzata correttamente
      const isApproved = await nftInstance.isApprovedForAll(alice, bob);
      assert(isApproved, "L'approvazione per tutti non è corretta");
      
      // Conia un secondo token
      await nftInstance.mint(alice, tokenURI2, { from: owner });
      
      // Bob dovrebbe poter trasferire anche il nuovo token
      await nftInstance.transferFrom(alice, charlie, 1, { from: bob });
      const newOwner = await nftInstance.ownerOf(1);
      assert.equal(newOwner, charlie, "Il proprietario del secondo token non è stato aggiornato correttamente");
    });
  });
  
  describe("Funzioni di query", function () {
    beforeEach(async function () {
      // Conia diversi token per i test
      await nftInstance.mint(alice, tokenURI1, { from: owner });
      await nftInstance.mint(bob, tokenURI2, { from: owner });
    });
    
    it("dovrebbe restituire il saldo corretto", async function () {
      const aliceBalance = await nftInstance.balanceOf(alice);
      const bobBalance = await nftInstance.balanceOf(bob);
      const charlieBalance = await nftInstance.balanceOf(charlie);
      
      assert.equal(aliceBalance.toString(), "1", "Il saldo di Alice non è corretto");
      assert.equal(bobBalance.toString(), "1", "Il saldo di Bob non è corretto");
      assert.equal(charlieBalance.toString(), "0", "Il saldo di Charlie non è corretto");
    });
    
    it("dovrebbe verificare correttamente l'esistenza dei token", async function () {
      // Usa una chiamata a _exists attraverso un metodo che lo utilizza
      try {
        await nftInstance.tokenURI(2); // Token ID 2 non dovrebbe esistere
        assert.fail("Dovrebbe lanciare un'eccezione per token inesistente");
      } catch (error) {
        assert(error.message.includes("ERC721: URI query for nonexistent token"), "Messaggio di errore non corretto");
      }
      
      // Token ID 0 e 1 dovrebbero esistere
      const uri0 = await nftInstance.tokenURI(0);
      const uri1 = await nftInstance.tokenURI(1);
      assert.equal(uri0, tokenURI1, "URI del token 0 non corretto");
      assert.equal(uri1, tokenURI2, "URI del token 1 non corretto");
    });
  });
});