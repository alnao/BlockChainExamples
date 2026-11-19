/**
 * tests/voting.ts
 *
 * Test suite per il program Anchor "voting".
 * I test Anchor si scrivono in TypeScript, non in Rust.
 *
 * Comandi:
 *   anchor test                 # avvia validator locale, deploya, esegue test
 *   anchor test --skip-local-validator  # se il validator è già in esecuzione
 *
 * Concetti chiave:
 *   - `anchor.web3.Keypair.generate()` crea un account/wallet casuale
 *   - `anchor.web3.PublicKey.findProgramAddressSync(seeds, programId)` calcola un PDA
 *   - `program.methods.nomeIstruzione(args).accounts({...}).signers([...]).rpc()` invia una tx
 *   - `program.account.nomeAccount.fetch(pda)` legge un account
 */

import * as anchor from "@coral-xyz/anchor";
import { Program }  from "@coral-xyz/anchor";
import { Voting }   from "../target/types/voting";
import { expect }   from "chai";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calcola il PDA di ProgramState */
function programStatePDA(programId: anchor.web3.PublicKey) {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("program_state")],
    programId
  );
}

/** Calcola il PDA di una VotingSession */
function sessionPDA(sessionId: bigint, programId: anchor.web3.PublicKey) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(sessionId);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("session"), idBuf],
    programId
  );
}

/** Calcola il PDA di un CandidateAccount */
function candidatePDA(
  sessionId: bigint,
  candidatePubkey: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(sessionId);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), idBuf, candidatePubkey.toBuffer()],
    programId
  );
}

/** Calcola il PDA di un VoteRecord */
function voteRecordPDA(
  sessionId: bigint,
  voterPubkey: anchor.web3.PublicKey,
  programId: anchor.web3.PublicKey
) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(sessionId);
  return anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), idBuf, voterPubkey.toBuffer()],
    programId
  );
}

/** Finanzia un account con SOL dal provider */
async function airdrop(
  provider: anchor.AnchorProvider,
  pubkey: anchor.web3.PublicKey,
  sol: number = 2
) {
  const sig = await provider.connection.requestAirdrop(
    pubkey,
    sol * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(sig, "confirmed");
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("voting — Anchor program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program    = anchor.workspace.Voting as Program<Voting>;
  const programId  = program.programId;
  const admin      = provider.wallet as anchor.Wallet;

  // Keypair per candidati e votanti (account separati dal deployer)
  const alice  = anchor.web3.Keypair.generate();
  const bob    = anchor.web3.Keypair.generate();
  const voter1 = anchor.web3.Keypair.generate();
  const voter2 = anchor.web3.Keypair.generate();
  const voter3 = anchor.web3.Keypair.generate();

  const [programStatePubkey] = programStatePDA(programId);

  // ── Before: finanzia tutti gli account ─────────────────────────────────────
  before(async () => {
    await Promise.all([
      airdrop(provider, alice.publicKey),
      airdrop(provider, bob.publicKey),
      airdrop(provider, voter1.publicKey),
      airdrop(provider, voter2.publicKey),
      airdrop(provider, voter3.publicKey),
    ]);
  });

  // ── 1. initialize_program ─────────────────────────────────────────────────
  it("Inizializza il program state", async () => {
    await program.methods
      .initializeProgram()
      .accounts({
        programState:  programStatePubkey,
        authority:     admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.programState.fetch(programStatePubkey);
    expect(state.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(state.sessionCounter.toNumber()).to.equal(0);
  });

  // ── 2. create_voting_session ──────────────────────────────────────────────
  it("Admin crea una sessione di votazione", async () => {
    // La sessione avrà id = 1 (session_counter + 1)
    const nextId = 1n;
    const [sessionPubkey] = sessionPDA(nextId, programId);

    const REG_FEE  = new anchor.BN(10_000_000);  // 0.01 SOL in lamports
    const VOTE_FEE = new anchor.BN(1_000_000);   // 0.001 SOL

    await program.methods
      .createVotingSession(
        "Elezioni 2025",
        "Scegli il tuo candidato",
        REG_FEE,
        VOTE_FEE
      )
      .accounts({
        programState:  programStatePubkey,
        votingSession: sessionPubkey,
        authority:     admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const session = await program.account.votingSession.fetch(sessionPubkey);
    expect(session.title).to.equal("Elezioni 2025");
    expect(session.registrationFee.toNumber()).to.equal(10_000_000);
    // VotingState::Registration = 1
    expect(Object.keys(session.state)[0]).to.equal("registration");
  });

  // ── 3. register_candidate ─────────────────────────────────────────────────
  it("Alice si registra come candidata", async () => {
    const sessionId = 1n;
    const [sessionPubkey] = sessionPDA(sessionId, programId);
    const [aliceCandidatePDA] = candidatePDA(sessionId, alice.publicKey, programId);

    await program.methods
      .registerCandidate("Alice Rossi", "Piu' investimenti in tecnologia")
      .accounts({
        programState:     programStatePubkey,
        votingSession:    sessionPubkey,
        candidateAccount: aliceCandidatePDA,
        candidateSigner:  alice.publicKey,
        systemProgram:    anchor.web3.SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    const candidate = await program.account.candidateAccount.fetch(aliceCandidatePDA);
    expect(candidate.name).to.equal("Alice Rossi");
    expect(candidate.voteCount.toNumber()).to.equal(0);
    expect(candidate.authority.toBase58()).to.equal(alice.publicKey.toBase58());
  });

  it("Bob si registra come candidato", async () => {
    const sessionId = 1n;
    const [sessionPubkey] = sessionPDA(sessionId, programId);
    const [bobCandidatePDA] = candidatePDA(sessionId, bob.publicKey, programId);

    await program.methods
      .registerCandidate("Bob Verdi", "Piu' investimenti in infrastrutture")
      .accounts({
        programState:     programStatePubkey,
        votingSession:    sessionPubkey,
        candidateAccount: bobCandidatePDA,
        candidateSigner:  bob.publicKey,
        systemProgram:    anchor.web3.SystemProgram.programId,
      })
      .signers([bob])
      .rpc();

    const session = await program.account.votingSession.fetch(sessionPubkey);
    expect(session.candidateCount).to.equal(2);
  });

  // ── 4. close_registration_and_start_voting ────────────────────────────────
  it("Admin apre la votazione con maxVotes = 3", async () => {
    const [sessionPubkey] = sessionPDA(1n, programId);

    await program.methods
      .closeRegistrationAndStartVoting(new anchor.BN(3))
      .accounts({
        programState:  programStatePubkey,
        votingSession: sessionPubkey,
        authority:     admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const session = await program.account.votingSession.fetch(sessionPubkey);
    expect(Object.keys(session.state)[0]).to.equal("voting");
    expect(session.maxVotes.toNumber()).to.equal(3);
  });

  // ── 5. vote ────────────────────────────────────────────────────────────────
  it("voter1, voter2, voter3 votano Alice → vittoria automatica", async () => {
    const sessionId = 1n;
    const [sessionPubkey]      = sessionPDA(sessionId, programId);
    const [aliceCandidatePDA]  = candidatePDA(sessionId, alice.publicKey, programId);
    const [voteRecord1]        = voteRecordPDA(sessionId, voter1.publicKey, programId);
    const [voteRecord2]        = voteRecordPDA(sessionId, voter2.publicKey, programId);
    const [voteRecord3]        = voteRecordPDA(sessionId, voter3.publicKey, programId);

    for (const [voter, voteRecord] of [
      [voter1, voteRecord1],
      [voter2, voteRecord2],
      [voter3, voteRecord3],
    ] as [anchor.web3.Keypair, anchor.web3.PublicKey][]) {
      await program.methods
        .vote()
        .accounts({
          programState:    programStatePubkey,
          votingSession:   sessionPubkey,
          candidateAccount: aliceCandidatePDA,
          voteRecord,
          voter:           voter.publicKey,
          systemProgram:   anchor.web3.SystemProgram.programId,
        })
        .signers([voter])
        .rpc();
    }

    // Dopo 3 voti la sessione deve essere Completed e lo stato Inactive
    const session   = await program.account.votingSession.fetch(sessionPubkey);
    const state     = await program.account.programState.fetch(programStatePubkey);
    const candidate = await program.account.candidateAccount.fetch(aliceCandidatePDA);

    expect(Object.keys(session.state)[0]).to.equal("completed");
    expect(Object.keys(state.currentState)[0]).to.equal("inactive");
    expect(session.winner.toBase58()).to.equal(alice.publicKey.toBase58());
    expect(session.winnerName).to.equal("Alice Rossi");
    expect(candidate.voteCount.toNumber()).to.equal(3);
  });

  // ── 6. Doppio voto → errore ───────────────────────────────────────────────
  it("Il doppio voto viene impedito dal VoteRecord PDA già esistente", async () => {
    // Crea una seconda sessione fresca
    const nextId = 2n;
    const [sessionPubkey2]     = sessionPDA(nextId, programId);
    const [aliceCandidatePDA2] = candidatePDA(nextId, alice.publicKey, programId);
    const [bobCandidatePDA2]   = candidatePDA(nextId, bob.publicKey, programId);
    const [voteRecordV1]       = voteRecordPDA(nextId, voter1.publicKey, programId);

    // Crea sessione 2
    await program.methods.createVotingSession("Sessione 2", "Test", new anchor.BN(0), new anchor.BN(0))
      .accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, authority: admin.publicKey, systemProgram: anchor.web3.SystemProgram.programId })
      .rpc();

    // Registra candidati
    await program.methods.registerCandidate("Alice", "P").accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, candidateAccount: aliceCandidatePDA2, candidateSigner: alice.publicKey, systemProgram: anchor.web3.SystemProgram.programId }).signers([alice]).rpc();
    await program.methods.registerCandidate("Bob",   "P").accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, candidateAccount: bobCandidatePDA2, candidateSigner: bob.publicKey, systemProgram: anchor.web3.SystemProgram.programId }).signers([bob]).rpc();
    await program.methods.closeRegistrationAndStartVoting(new anchor.BN(10)).accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, authority: admin.publicKey, systemProgram: anchor.web3.SystemProgram.programId }).rpc();

    // Primo voto OK
    await program.methods.vote()
      .accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, candidateAccount: aliceCandidatePDA2, voteRecord: voteRecordV1, voter: voter1.publicKey, systemProgram: anchor.web3.SystemProgram.programId })
      .signers([voter1]).rpc();

    // Secondo voto → deve fallire perché il VoteRecord PDA esiste già
    try {
      await program.methods.vote()
        .accounts({ programState: programStatePubkey, votingSession: sessionPubkey2, candidateAccount: aliceCandidatePDA2, voteRecord: voteRecordV1, voter: voter1.publicKey, systemProgram: anchor.web3.SystemProgram.programId })
        .signers([voter1]).rpc();
      expect.fail("Il secondo voto avrebbe dovuto fallire");
    } catch (e: any) {
      // L'errore atteso è "already in use" (account già esistente)
      expect(e.message).to.include("already");
    }
  });
});
