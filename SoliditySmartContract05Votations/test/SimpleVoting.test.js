// test/SimpleVoting.test.js
const SimpleVoting = artifacts.require("SimpleVoting");
const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');

contract("SimpleVoting", function (accounts) {
  const [presidente, elettore1, elettore2, elettore3, nonElettore] = accounts;
  
  let votingInstance;
  
  beforeEach(async function () {
    // Deploy un nuovo contratto con durata di 24 ore per ogni test
    votingInstance = await SimpleVoting.new(24, { from: presidente });
  });
  
  describe("Inizializzazione", function () {
    it("dovrebbe impostare il deployer come presidente", async function () {
      const presidenteAddress = await votingInstance.presidente();
      assert.equal(presidenteAddress, presidente, "L'indirizzo del presidente non è corretto");
    });
    
    it("dovrebbe registrare automaticamente il presidente come elettore", async function () {
      const elettore = await votingInstance.elettori(presidente);
      assert.equal(elettore.iscritto, true, "Il presidente dovrebbe essere registrato come elettore");
      assert.equal(elettore.peso.toString(), "1", "Il peso iniziale dovrebbe essere 1");
    });
    
    it("dovrebbe impostare la durata delle votazioni correttamente", async function () {
      const durataVotazioni = await votingInstance.durataVotazioni();
      // 24 ore in secondi
      const durataAttesa = new BN(24 * 60 * 60);
      assert.equal(durataVotazioni.toString(), durataAttesa.toString(), "La durata non è stata impostata correttamente");
    });
  });
  
  describe("Gestione elettori", function () {
    it("dovrebbe permettere al presidente di registrare elettori", async function () {
      const result = await votingInstance.registraElettore(elettore1, { from: presidente });
      
      // Verifica l'evento emesso
      expectEvent(result, 'EletoreRegistrato', {
        elettore: elettore1
      });
      
      // Verifica che l'elettore sia stato registrato correttamente
      const elettoreDati = await votingInstance.elettori(elettore1);
      assert.equal(elettoreDati.iscritto, true, "L'elettore non è stato registrato correttamente");
      assert.equal(elettoreDati.peso.toString(), "1", "Il peso iniziale dovrebbe essere 1");
    });
    
    it("dovrebbe impedire a non presidenti di registrare elettori", async function () {
      await expectRevert(
        votingInstance.registraElettore(elettore2, { from: elettore1 }),
        "Solo il presidente puo' eseguire questa operazione"
      );
    });
    
    it("dovrebbe impedire di registrare un elettore già registrato", async function () {
      // Prima registrazione
      await votingInstance.registraElettore(elettore1, { from: presidente });
      
      // Tentativo di registrare nuovamente
      await expectRevert(
        votingInstance.registraElettore(elettore1, { from: presidente }),
        "Elettore gia' registrato"
      );
    });
    
    it("dovrebbe permettere la delega del voto", async function () {
      // Registra due elettori
      await votingInstance.registraElettore(elettore1, { from: presidente });
      await votingInstance.registraElettore(elettore2, { from: presidente });
      
      // Elettore1 delega a elettore2
      await votingInstance.delega(elettore2, { from: elettore1 });
      
      // Verifica che i pesi siano stati aggiornati
      const elettore1Dati = await votingInstance.elettori(elettore1);
      const elettore2Dati = await votingInstance.elettori(elettore2);
      
      assert.equal(elettore1Dati.peso.toString(), "0", "Il peso dell'elettore1 dovrebbe essere 0 dopo la delega");
      assert.equal(elettore2Dati.peso.toString(), "2", "Il peso dell'elettore2 dovrebbe essere 2 dopo aver ricevuto la delega");
    });
    
    it("dovrebbe impedire la delega a se stessi", async function () {
      await votingInstance.registraElettore(elettore1, { from: presidente });
      
      await expectRevert(
        votingInstance.delega(elettore1, { from: elettore1 }),
        "Non puoi delegare a te stesso"
      );
    });
    
    it("dovrebbe impedire la delega dopo aver votato", async function () {
      // Registra due elettori
      await votingInstance.registraElettore(elettore1, { from: presidente });
      await votingInstance.registraElettore(elettore2, { from: presidente });
      
      // Aggiungi una proposta
      await votingInstance.aggiungiProposta("Proposta 1", { from: presidente });
      
      // Vota
      await votingInstance.vota(0, { from: elettore1 });
      
      // Tentativo di delega dopo aver votato
      await expectRevert(
        votingInstance.delega(elettore2, { from: elettore1 }),
        "Hai gia' votato"
      );
    });
  });
  
  describe("Gestione proposte", function () {
    it("dovrebbe permettere al presidente di aggiungere proposte", async function () {
      const result = await votingInstance.aggiungiProposta("Proposta di test", { from: presidente });
      
      expectEvent(result, 'PropostaAggiunta', {
        idProposta: new BN(0),
        descrizione: "Proposta di test"
      });
      
      // Verifica che la proposta sia stata aggiunta
      const numProposte = await votingInstance.getNumeroProposte();
      assert.equal(numProposte.toString(), "1", "Il numero di proposte dovrebbe essere 1");
      
      const proposta = await votingInstance.getDettagliProposta(0);
      assert.equal(proposta.descrizione, "Proposta di test", "La descrizione della proposta non è corretta");
      assert.equal(proposta.votiTotali.toString(), "0", "I voti iniziali dovrebbero essere 0");
      assert.equal(proposta.eseguita, false, "La proposta non dovrebbe essere eseguita");
    });
    
    it("dovrebbe impedire a non presidenti di aggiungere proposte", async function () {
      await expectRevert(
        votingInstance.aggiungiProposta("Proposta non autorizzata", { from: elettore1 }),
        "Solo il presidente puo' eseguire questa operazione"
      );
    });
  });
  
  describe("Votazione", function () {
    beforeEach(async function () {
      // Registra elettori
      await votingInstance.registraElettore(elettore1, { from: presidente });
      await votingInstance.registraElettore(elettore2, { from: presidente });
      
      // Aggiungi proposte
      await votingInstance.aggiungiProposta("Proposta 1", { from: presidente });
      await votingInstance.aggiungiProposta("Proposta 2", { from: presidente });
    });
    
    it("dovrebbe permettere agli elettori registrati di votare", async function () {
      const result = await votingInstance.vota(0, { from: elettore1 });
      
      expectEvent(result, 'VotoEffettuato', {
        elettore: elettore1,
        idProposta: new BN(0)
      });
      
      // Verifica che il voto sia stato registrato
      const haVotato = await votingInstance.haVotato(elettore1, 0);
      assert.equal(haVotato, true, "L'elettore dovrebbe risultare come votante");
      
      // Verifica che i voti siano stati aggiornati
      const proposta = await votingInstance.getDettagliProposta(0);
      assert.equal(proposta.votiTotali.toString(), "1", "I voti dovrebbero essere aumentati");
      
      // Verifica che la proposta sia stata aggiunta all'elenco delle proposte votate
      const proposteVotate = await votingInstance.getProposteVotate(elettore1);
      assert.equal(proposteVotate.length, 1, "Dovrebbe esserci una proposta votata");
      assert.equal(proposteVotate[0].toString(), "0", "L'ID della proposta votata dovrebbe essere 0");
    });
    
    it("dovrebbe impedire a non elettori di votare", async function () {
      await expectRevert(
        votingInstance.vota(0, { from: nonElettore }),
        "Non sei registrato come elettore"
      );
    });
    
    it("dovrebbe impedire di votare più volte per la stessa proposta", async function () {
      await votingInstance.vota(0, { from: elettore1 });
      
      await expectRevert(
        votingInstance.vota(0, { from: elettore1 }),
        "Hai gia' votato per questa proposta"
      );
    });
    
    it("dovrebbe permettere a un elettore di votare per proposte diverse", async function () {
      await votingInstance.vota(0, { from: elettore1 });
      await votingInstance.vota(1, { from: elettore1 });
      
      const haVotato0 = await votingInstance.haVotato(elettore1, 0);
      const haVotato1 = await votingInstance.haVotato(elettore1, 1);
      
      assert.equal(haVotato0, true, "L'elettore dovrebbe aver votato per la proposta 0");
      assert.equal(haVotato1, true, "L'elettore dovrebbe aver votato per la proposta 1");
      
      const proposteVotate = await votingInstance.getProposteVotate(elettore1);
      assert.equal(proposteVotate.length, 2, "Dovrebbero esserci due proposte votate");
    });
    
    it("dovrebbe considerare il peso dell'elettore nel calcolo dei voti", async function () {
      // Elettore2 delega a elettore1
      await votingInstance.delega(elettore1, { from: elettore2 });
      
      // Elettore1 vota (con peso 2)
      await votingInstance.vota(0, { from: elettore1 });
      
      // Verifica che i voti siano stati aggiornati
      const proposta = await votingInstance.getDettagliProposta(0);
      assert.equal(proposta.votiTotali.toString(), "2", "I voti dovrebbero essere pari al peso dell'elettore");
    });
  });
  
  describe("Conclusione votazioni", function () {
    beforeEach(async function () {
      // Registra elettori
      await votingInstance.registraElettore(elettore1, { from: presidente });
      await votingInstance.registraElettore(elettore2, { from: presidente });
      
      // Aggiungi proposte
      await votingInstance.aggiungiProposta("Proposta 1", { from: presidente });
      await votingInstance.aggiungiProposta("Proposta 2", { from: presidente });
      
      // Vota
      await votingInstance.vota(0, { from: presidente });
      await votingInstance.vota(0, { from: elettore1 });
      await votingInstance.vota(1, { from: elettore2 });
    });
    
    it("dovrebbe permettere al presidente di concludere le votazioni anticipatamente", async function () {
      await votingInstance.concludiVotazioni({ from: presidente });
      
      const votoFinito = await votingInstance.votoFinito();
      assert.equal(votoFinito, true, "Le votazioni dovrebbero essere concluse");
    });
    
    it("dovrebbe impedire a non presidenti di concludere le votazioni", async function () {
      await expectRevert(
        votingInstance.concludiVotazioni({ from: elettore1 }),
        "Solo il presidente puo' eseguire questa operazione"
      );
    });
    
    it("dovrebbe permettere di eseguire la proposta vincente dopo la conclusione", async function () {
      // Conclude le votazioni
      await votingInstance.concludiVotazioni({ from: presidente });
      
      // Esegui la proposta vincente (proposta 0 ha 2 voti vs proposta 1 con 1 voto)
      const result = await votingInstance.eseguiProposta(0, { from: elettore1 });
      
      expectEvent(result, 'PropostaEseguita', {
        idProposta: new BN(0)
      });
      
      // Verifica che la proposta sia stata eseguita
      const proposta = await votingInstance.getDettagliProposta(0);
      assert.equal(proposta.eseguita, true, "La proposta dovrebbe essere stata eseguita");
    });
    
    it("dovrebbe impedire di eseguire una proposta mentre le votazioni sono ancora in corso", async function () {
      await expectRevert(
        votingInstance.eseguiProposta(0, { from: elettore1 }),
        "Le votazioni non sono ancora terminate"
      );
    });
    
    it("dovrebbe impedire di eseguire una proposta già eseguita", async function () {
      // Conclude le votazioni
      await votingInstance.concludiVotazioni({ from: presidente });
      
      // Esegui la proposta
      await votingInstance.eseguiProposta(0, { from: elettore1 });
      
      // Tenta di eseguire nuovamente
      await expectRevert(
        votingInstance.eseguiProposta(0, { from: elettore1 }),
        "Proposta gia' eseguita"
      );
    });
    
    it("dovrebbe impedire di eseguire una proposta che non è la più votata", async function () {
      // Conclude le votazioni
      await votingInstance.concludiVotazioni({ from: presidente });
      
      // Tenta di eseguire la proposta 1 (che ha meno voti)
      await expectRevert(
        votingInstance.eseguiProposta(1, { from: elettore1 }),
        "Non e' la proposta piu' votata"
      );
    });
    
    it("dovrebbe terminare automaticamente le votazioni dopo la durata specificata", async function () {
      // Avanza il tempo di 25 ore (oltre la durata di 24 ore)
      await time.increase(time.duration.hours(25));
      
      // Ora dovrebbe essere possibile eseguire la proposta vincente
      const result = await votingInstance.eseguiProposta(0, { from: elettore1 });
      
      expectEvent(result, 'PropostaEseguita', {
        idProposta: new BN(0)
      });
    });
  });
  
  describe("Funzioni di query", function () {
    beforeEach(async function () {
      // Registra elettori
      await votingInstance.registraElettore(elettore1, { from: presidente });
      
      // Aggiungi proposte
      await votingInstance.aggiungiProposta("Proposta 1", { from: presidente });
      await votingInstance.aggiungiProposta("Proposta 2", { from: presidente });
      
      // Vota
      await votingInstance.vota(0, { from: elettore1 });
    });
    
    it("dovrebbe restituire il numero corretto di proposte", async function () {
      const numProposte = await votingInstance.getNumeroProposte();
      assert.equal(numProposte.toString(), "2", "Il numero di proposte dovrebbe essere 2");
    });
    
    it("dovrebbe restituire i dettagli corretti di una proposta", async function () {
      const proposta = await votingInstance.getDettagliProposta(0);
      
      assert.equal(proposta.id.toString(), "0", "L'ID della proposta non è corretto");
      assert.equal(proposta.descrizione, "Proposta 1", "La descrizione della proposta non è corretta");
      assert.equal(proposta.votiTotali.toString(), "1", "Il numero di voti non è corretto");
      assert.equal(proposta.eseguita, false, "Lo stato di esecuzione non è corretto");
    });
    
    it("dovrebbe verificare correttamente se un elettore ha votato", async function () {
      const haVotato0 = await votingInstance.haVotato(elettore1, 0);
      const haVotato1 = await votingInstance.haVotato(elettore1, 1);
      
      assert.equal(haVotato0, true, "L'elettore dovrebbe aver votato per la proposta 0");
      assert.equal(haVotato1, false, "L'elettore non dovrebbe aver votato per la proposta 1");
    });
    
    it("dovrebbe restituire l'elenco corretto delle proposte votate", async function () {
      const proposteVotate = await votingInstance.getProposteVotate(elettore1);
      
      assert.equal(proposteVotate.length, 1, "Dovrebbe esserci una proposta votata");
      assert.equal(proposteVotate[0].toString(), "0", "L'ID della proposta votata dovrebbe essere 0");
    });
  });
});