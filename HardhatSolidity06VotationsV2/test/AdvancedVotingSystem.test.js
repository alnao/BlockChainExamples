// test/AdvancedVotingSystem.test.js  (ESM — Hardhat v3 + viem node:test)
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther } from "viem";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Connette alla rete simulata e deploya un contratto fresco per ogni test.
 */
async function deployFreshContract() {
  const { viem } = await network.connect();

  const [admin, candidate1, candidate2, voter1, voter2, voter3, other] =
    await viem.getWalletClients();

  const contract = await viem.deployContract("AdvancedVotingSystem");

  return { viem, contract, admin, candidate1, candidate2, voter1, voter2, voter3, other };
}

const REGISTRATION_FEE = parseEther("0.1");
const VOTING_FEE = parseEther("0.01");

const VotingState = {
  Inactive: 0,
  Registration: 1,
  Voting: 2,
  Completed: 3,
};

// ---------------------------------------------------------------------------
// Helper per deployare + setup base (sessione + 2 candidati registrati)
// ---------------------------------------------------------------------------
async function deployWithTwoCandidates() {
  const ctx = await deployFreshContract();
  const { contract, admin, candidate1, candidate2 } = ctx;

  await contract.write.createVotingSession(
    ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
    { account: admin.account }
  );
  await contract.write.registerCandidate(["Candidate 1", "Proposal 1"], {
    account: candidate1.account,
    value: REGISTRATION_FEE,
  });
  await contract.write.registerCandidate(["Candidate 2", "Proposal 2"], {
    account: candidate2.account,
    value: REGISTRATION_FEE,
  });
  return ctx;
}

async function deployWithVotingOpen(maxVotes = 3n) {
  const ctx = await deployWithTwoCandidates();
  await ctx.contract.write.closeRegistrationAndStartVoting([maxVotes], {
    account: ctx.admin.account,
  });
  return { ...ctx, maxVotes };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("AdvancedVotingSystem", () => {

  // ---- 1. Inizializzazione ------------------------------------------------
  describe("Inizializzazione", () => {
    it("imposta il deployer come admin", async () => {
      const { contract, admin } = await deployFreshContract();
      const contractAdmin = await contract.read.admin();
      assert.equal(contractAdmin.toLowerCase(), admin.account.address.toLowerCase());
    });

    it("inizia nello stato Inactive", async () => {
      const { contract } = await deployFreshContract();
      const state = await contract.read.getCurrentState();
      assert.equal(state, VotingState.Inactive);  // number 0
    });
  });

  // ---- 2. Creazione sessione ----------------------------------------------
  describe("Creazione sessione di voto", () => {
    it("l'admin può creare una nuova sessione", async () => {
      const { viem, contract, admin } = await deployFreshContract();

      const hash = await contract.write.createVotingSession(
        ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
        { account: admin.account }
      );
      const publicClient = await viem.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.equal(receipt.status, "success");

      const state = await contract.read.getCurrentState();
      assert.equal(state, VotingState.Registration);

      const votingId = await contract.read.getCurrentVotingId();
      assert.equal(votingId, 1n);    });

    it("rifiuta la creazione da account non-admin", async () => {
      const { contract, candidate1 } = await deployFreshContract();
      await assert.rejects(
        () => contract.write.createVotingSession(
          ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
          { account: candidate1.account }
        ),
        /Solo l.amministratore/
      );
    });
  });

  // ---- 3. Registrazione candidati ----------------------------------------
  describe("Registrazione candidati", () => {
    it("permette la registrazione con commissione corretta", async () => {
      const { viem, contract, admin, candidate1 } = await deployFreshContract();
      await contract.write.createVotingSession(
        ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
        { account: admin.account }
      );

      const hash = await contract.write.registerCandidate(
        ["Candidate 1", "My Proposal"],
        { account: candidate1.account, value: REGISTRATION_FEE }
      );
      const publicClient = await viem.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.equal(receipt.status, "success");

      const details = await contract.read.getCandidateDetails([1n, candidate1.account.address]);
      assert.equal(details[0], "Candidate 1");
      assert.equal(details[1], "My Proposal");
    });

    it("rifiuta la registrazione con commissione insufficiente", async () => {
      const { contract, admin, candidate1 } = await deployFreshContract();
      await contract.write.createVotingSession(
        ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
        { account: admin.account }
      );
      await assert.rejects(
        () => contract.write.registerCandidate(["Candidate 1", "My Proposal"], {
          account: candidate1.account,
          value: parseEther("0.05"),
        }),
        /Commissione di registrazione insufficiente/
      );
    });

    it("impedisce la doppia registrazione dello stesso candidato", async () => {
      const { contract, admin, candidate1 } = await deployFreshContract();
      await contract.write.createVotingSession(
        ["Test Election", "Test Description", REGISTRATION_FEE, VOTING_FEE],
        { account: admin.account }
      );
      await contract.write.registerCandidate(["Candidate 1", "My Proposal"], {
        account: candidate1.account,
        value: REGISTRATION_FEE,
      });
      await assert.rejects(
        () => contract.write.registerCandidate(["Candidate 1 Again", "Another Proposal"], {
          account: candidate1.account,
          value: REGISTRATION_FEE,
        }),
        /Candidato gia. registrato/
      );
    });
  });

  // ---- 4. Gestione fasi --------------------------------------------------
  describe("Gestione fasi di votazione", () => {
    it("l'admin può chiudere la registrazione e avviare la votazione", async () => {
      const { contract, admin } = await deployWithTwoCandidates();
      await contract.write.closeRegistrationAndStartVoting([5n], { account: admin.account });

      const state = await contract.read.getCurrentState();
      assert.equal(state, VotingState.Voting);

      const details = await contract.read.getVotingSessionDetails([1n]);
      assert.equal(details.maxVotesRequired, 5n);    });

    it("richiede almeno 2 candidati per avviare la votazione", async () => {
      const { contract, admin, candidate1 } = await deployFreshContract();
      await contract.write.createVotingSession(
        ["Election", "Desc", REGISTRATION_FEE, VOTING_FEE],
        { account: admin.account }
      );
      await contract.write.registerCandidate(["Only Candidate", "Proposal"], {
        account: candidate1.account,
        value: REGISTRATION_FEE,
      });
      await assert.rejects(
        () => contract.write.closeRegistrationAndStartVoting([5n], { account: admin.account }),
        /Servono almeno due candidati/
      );
    });
  });

  // ---- 5. Votazione e completamento --------------------------------------
  describe("Votazione e completamento", () => {
    it("permette di votare pagando la commissione", async () => {
      const { viem, contract, candidate1, voter1 } = await deployWithVotingOpen();

      const hash = await contract.write.vote([candidate1.account.address], {
        account: voter1.account,
        value: VOTING_FEE,
      });
      const publicClient = await viem.getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.equal(receipt.status, "success");

      const details = await contract.read.getCandidateDetails([1n, candidate1.account.address]);
      assert.equal(details[2], 1n);

      const hasVoted = await contract.read.hasVoted([1n, voter1.account.address]);
      assert.equal(hasVoted, true);
    });

    it("rifiuta il voto con commissione insufficiente", async () => {
      const { contract, candidate1, voter1 } = await deployWithVotingOpen();
      await assert.rejects(
        () => contract.write.vote([candidate1.account.address], {
          account: voter1.account,
          value: parseEther("0.001"),
        }),
        /Commissione di voto insufficiente/
      );
    });

    it("impedisce il doppio voto", async () => {
      const { contract, candidate1, voter1 } = await deployWithVotingOpen();
      await contract.write.vote([candidate1.account.address], {
        account: voter1.account,
        value: VOTING_FEE,
      });
      await assert.rejects(
        () => contract.write.vote([candidate1.account.address], {
          account: voter1.account,
          value: VOTING_FEE,
        }),
        /Hai gia. votato/
      );
    });

    it("completa automaticamente al raggiungimento del massimo di voti", async () => {
      const { contract, candidate1, voter1, voter2, voter3, maxVotes } = await deployWithVotingOpen(3n);
      await contract.write.vote([candidate1.account.address], { account: voter1.account, value: VOTING_FEE });
      await contract.write.vote([candidate1.account.address], { account: voter2.account, value: VOTING_FEE });
      await contract.write.vote([candidate1.account.address], { account: voter3.account, value: VOTING_FEE });

      const state = await contract.read.getCurrentState();
      assert.equal(state, VotingState.Inactive);

      const results = await contract.read.getVotingResults([1n]);
      assert.equal(results[2].toLowerCase(), candidate1.account.address.toLowerCase());
      assert.equal(results[4], maxVotes);
    });

    it("l'admin può completare manualmente la votazione", async () => {
      const { contract, admin, candidate1, voter1, voter2 } = await deployWithVotingOpen();
      await contract.write.vote([candidate1.account.address], { account: voter1.account, value: VOTING_FEE });
      await contract.write.vote([candidate1.account.address], { account: voter2.account, value: VOTING_FEE });

      await contract.write.endVoting({ account: admin.account });

      const state = await contract.read.getCurrentState();
      assert.equal(state, VotingState.Inactive);
    });

    it("determina correttamente il vincitore per maggioranza", async () => {
      const { contract, admin, candidate1, candidate2, voter1, voter2, voter3 } = await deployWithVotingOpen();
      await contract.write.vote([candidate1.account.address], { account: voter1.account, value: VOTING_FEE });
      await contract.write.vote([candidate1.account.address], { account: voter2.account, value: VOTING_FEE });
      await contract.write.vote([candidate2.account.address], { account: voter3.account, value: VOTING_FEE });

      await contract.write.endVoting({ account: admin.account });

      const results = await contract.read.getVotingResults([1n]);
      assert.equal(results[2].toLowerCase(), candidate1.account.address.toLowerCase());
      assert.equal(results[4], 2n);
    });
  });

  // ---- 6. Storico --------------------------------------------------------
  describe("Storico e risultati", () => {
    let ctx;

    before(async () => {
      ctx = await deployFreshContract();
      const { contract, admin, candidate1, candidate2, voter1, voter2, voter3 } = ctx;

      // Prima votazione
      await contract.write.createVotingSession(["Election 1", "First", REGISTRATION_FEE, VOTING_FEE], { account: admin.account });
      await contract.write.registerCandidate(["C1", "P1"], { account: candidate1.account, value: REGISTRATION_FEE });
      await contract.write.registerCandidate(["C2", "P2"], { account: candidate2.account, value: REGISTRATION_FEE });
      await contract.write.closeRegistrationAndStartVoting([5n], { account: admin.account });
      await contract.write.vote([candidate1.account.address], { account: voter1.account, value: VOTING_FEE });
      await contract.write.vote([candidate1.account.address], { account: voter2.account, value: VOTING_FEE });
      await contract.write.endVoting({ account: admin.account });

      // Seconda votazione
      await contract.write.createVotingSession(["Election 2", "Second", REGISTRATION_FEE, VOTING_FEE], { account: admin.account });
      await contract.write.registerCandidate(["CA", "PA"], { account: candidate1.account, value: REGISTRATION_FEE });
      await contract.write.registerCandidate(["CB", "PB"], { account: candidate2.account, value: REGISTRATION_FEE });
      await contract.write.closeRegistrationAndStartVoting([5n], { account: admin.account });
      await contract.write.vote([candidate2.account.address], { account: voter1.account, value: VOTING_FEE });
      await contract.write.vote([candidate2.account.address], { account: voter2.account, value: VOTING_FEE });
      await contract.write.vote([candidate2.account.address], { account: voter3.account, value: VOTING_FEE });
      await contract.write.endVoting({ account: admin.account });
    });

    it("mantiene l'elenco di tutte le votazioni passate", async () => {
      const pastIds = await ctx.contract.read.getPastVotingSessions();
      assert.equal(pastIds.length, 2);
      assert.equal(pastIds[0], 1n);
      assert.equal(pastIds[1], 2n);
    });

    it("restituisce i risultati di una votazione specifica", async () => {
      // getVotingResults ritorna array posizionale: [title, totalVotes, winner, winnerName, voteCount]
      const r1 = await ctx.contract.read.getVotingResults([1n]);
      assert.equal(r1[0], "Election 1");
      assert.equal(r1[2].toLowerCase(), ctx.candidate1.account.address.toLowerCase());
      assert.equal(r1[4], 2n);

      const r2 = await ctx.contract.read.getVotingResults([2n]);
      assert.equal(r2[0], "Election 2");
      assert.equal(r2[2].toLowerCase(), ctx.candidate2.account.address.toLowerCase());
      assert.equal(r2[4], 3n);
    });

    it("restituisce tutti i risultati con getAllPastVotingResults", async () => {
      // getAllPastVotingResults ritorna tuple: [votingIds[], titles[], winners[], winnerNames[], voteCounts[]]
      const all = await ctx.contract.read.getAllPastVotingResults();
      assert.equal(all[0].length, 2);            // votingIds
      assert.equal(all[1][0], "Election 1");     // titles
      assert.equal(all[1][1], "Election 2");
      assert.equal(all[2][0].toLowerCase(), ctx.candidate1.account.address.toLowerCase()); // winners
      assert.equal(all[2][1].toLowerCase(), ctx.candidate2.account.address.toLowerCase());
      assert.equal(all[4][0], 2n);               // voteCounts
      assert.equal(all[4][1], 3n);
    });
  });

  // ---- 7. Gestione fondi -------------------------------------------------
  describe("Gestione fondi", () => {
    it("l'admin può prelevare i fondi raccolti", async () => {
      const { viem, contract, admin, candidate1, candidate2 } = await deployFreshContract();
      const publicClient = await viem.getPublicClient();

      await contract.write.createVotingSession(
        ["Test", "Desc", REGISTRATION_FEE, VOTING_FEE], { account: admin.account }
      );
      await contract.write.registerCandidate(["C1", "P1"], { account: candidate1.account, value: REGISTRATION_FEE });
      await contract.write.registerCandidate(["C2", "P2"], { account: candidate2.account, value: REGISTRATION_FEE });

      const totalFee = REGISTRATION_FEE * 2n;
      const balanceBefore = await publicClient.getBalance({ address: admin.account.address });

      const hash = await contract.write.withdrawFunds([totalFee], { account: admin.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      assert.equal(receipt.status, "success");

      const balanceAfter = await publicClient.getBalance({ address: admin.account.address });
      const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
      // Netto ricevuto (escludendo gas) deve essere uguale a totalFee
      const net = balanceAfter - balanceBefore + gasCost;
      assert.equal(net, totalFee);
    });

    it("rifiuta il prelievo di un importo superiore al saldo", async () => {
      const { contract, admin } = await deployFreshContract();
      await assert.rejects(
        () => contract.write.withdrawFunds([parseEther("10")], { account: admin.account }),
        /Saldo insufficiente/
      );
    });
  });

  // ---- 8. Cambio admin ---------------------------------------------------
  describe("Cambio amministratore", () => {
    it("l'admin può trasferire il ruolo a un altro account", async () => {
      const { contract, admin, other } = await deployFreshContract();
      await contract.write.changeAdmin([other.account.address], { account: admin.account });
      const newAdmin = await contract.read.admin();
      assert.equal(newAdmin.toLowerCase(), other.account.address.toLowerCase());
    });

    it("rifiuta il cambio da un account non-admin", async () => {
      const { contract, candidate1, other } = await deployFreshContract();
      await assert.rejects(
        () => contract.write.changeAdmin([other.account.address], { account: candidate1.account }),
        /Solo l.amministratore/
      );
    });

    it("rifiuta l'indirizzo zero come nuovo admin", async () => {
      const { contract, admin } = await deployFreshContract();
      await assert.rejects(
        () => contract.write.changeAdmin(
          ["0x0000000000000000000000000000000000000000"],
          { account: admin.account }
        ),
        /Indirizzo admin non valido/
      );
    });
  });
});
