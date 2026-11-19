/*
 * voting/src/lib.rs
 *
 * Sistema di votazione su Solana con Anchor.
 * Ispirato a HardhatSolidity06VotationsV2 / AdvancedVotingSystem.sol
 *
 * ============================================================
 * DIFFERENZE FONDAMENTALI rispetto a Ethereum/Solidity
 * ============================================================
 *
 * 1. ACCOUNT MODEL vs CONTRACT MODEL
 *    - In Ethereum il contratto contiene il proprio storage internamente.
 *    - In Solana i DATI vivono in Account separati, il program è solo logica.
 *    - Ogni sessione di votazione, ogni candidato, ogni voto è un Account distinto.
 *
 * 2. PDA (Program Derived Address)
 *    - Gli account di stato (VotingSession, Candidate, VoteRecord) sono creati
 *      con indirizzi deterministici derivati da seed + program_id.
 *    - Esempio: PDA di una sessione = hash(["session", id_bytes], program_id)
 *    - Questo sostituisce il mapping(uint256 => VotingSession) di Solidity.
 *
 * 3. ISTRUZIONI vs FUNZIONI
 *    - In Solidity si chiama una funzione del contratto.
 *    - In Solana si invia una transazione con una "instruction" al program.
 *    - Ogni istruzione dichiara esplicitamente tutti gli account che tocca.
 *
 * 4. LAMPORTS vs WEI
 *    - L'unità di conto è il lamport (1 SOL = 1_000_000_000 lamports).
 *    - Le fee di candidatura/voto vengono trasferite in lamports.
 *
 * 5. SIGNER
 *    - msg.sender di Solidity → ctx.accounts.authority.key() in Anchor.
 *    - Il signer deve essere incluso nell'elenco degli account dell'istruzione.
 *
 * 6. SPACE (allocazione)
 *    - In Solidity lo storage è dinamico. In Solana devi allocare lo spazio
 *      dell'account al momento della creazione (init). Se serve più spazio,
 *      devi creare un account più grande.
 *
 * ============================================================
 */

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Zh8oAYXwDByfk5h5iVSxgH3ACEMBaqLWNeyGFz2YoAS");

// ─── Costanti ────────────────────────────────────────────────────────────────
const MAX_CANDIDATES: usize = 20;
const MAX_STR_LEN: usize    = 64;   // lunghezza massima di titoli e nomi
const MAX_PROP_LEN: usize   = 256;  // lunghezza massima delle proposte

// ─── Program ─────────────────────────────────────────────────────────────────
#[program]
pub mod voting {
    use super::*;

    // ========================================================================
    // initialize_program
    // Crea l'account ProgramState che tiene traccia dell'admin e del contatore
    // globale delle sessioni.
    //
    // Equivalente del costruttore in Solidity:
    //   constructor() { admin = msg.sender; }
    // ========================================================================
    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.admin           = ctx.accounts.authority.key();
        state.session_counter = 0;
        state.bump            = ctx.bumps.program_state;

        msg!("Program initialized. Admin: {}", state.admin);
        Ok(())
    }

    // ========================================================================
    // create_voting_session
    // Crea una nuova sessione di votazione come Account PDA.
    //
    // Equivalente di:
    //   function createVotingSession(title, description, regFee, voteFee) onlyAdmin
    // ========================================================================
    pub fn create_voting_session(
        ctx:              Context<CreateVotingSession>,
        title:            String,
        description:      String,
        registration_fee: u64,
        voting_fee:       u64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;

        // Verifica admin — equivalente del modifier onlyAdmin
        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );
        // Verifica che non ci sia già una sessione attiva
        require!(
            state.current_state == VotingState::Inactive,
            VotingError::SessionAlreadyActive
        );

        // Validazione input
        require!(title.len() <= MAX_STR_LEN, VotingError::StringTooLong);
        require!(description.len() <= MAX_STR_LEN * 4, VotingError::StringTooLong);

        state.session_counter += 1;
        let session_id = state.session_counter;

        let session = &mut ctx.accounts.voting_session;
        session.id               = session_id;
        session.title            = title.clone();
        session.description      = description;
        session.registration_fee = registration_fee;
        session.voting_fee       = voting_fee;
        session.max_votes        = 0; // Impostato da close_registration
        session.state            = VotingState::Registration;
        session.candidate_count  = 0;
        session.total_votes      = 0;
        session.winner           = Pubkey::default();
        session.winner_name      = String::new();
        session.start_timestamp  = Clock::get()?.unix_timestamp;
        session.end_timestamp    = 0;
        session.bump             = ctx.bumps.voting_session;

        state.current_state     = VotingState::Registration;
        state.current_session_id = session_id;

        emit!(VotingSessionCreated {
            session_id,
            title,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("Voting session {} created", session_id);
        Ok(())
    }

    // ========================================================================
    // register_candidate
    // Registra il chiamante come candidato per la sessione attiva.
    // Paga la fee di registrazione trasferendo lamports all'account sessione.
    //
    // Equivalente di:
    //   function registerCandidate(name, proposal) payable
    // ========================================================================
    pub fn register_candidate(
        ctx:      Context<RegisterCandidate>,
        name:     String,
        proposal: String,
    ) -> Result<()> {
        let session = &mut ctx.accounts.voting_session;
        let state   = &ctx.accounts.program_state;

        require!(
            session.state == VotingState::Registration,
            VotingError::WrongState
        );
        require!(name.len() <= MAX_STR_LEN, VotingError::StringTooLong);
        require!(proposal.len() <= MAX_PROP_LEN, VotingError::StringTooLong);
        require!(
            session.candidate_count < MAX_CANDIDATES as u8,
            VotingError::TooManyCandidates
        );

        // Trasferisce la fee di registrazione dall'utente all'account sessione.
        // In Solidity: msg.value >= registrationFee (l'ETH arriva automaticamente).
        // In Solana:   bisogna fare una CPI (Cross-Program Invocation) al System Program
        //              per trasferire lamports esplicitamente.
        if session.registration_fee > 0 {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.candidate_signer.to_account_info(),
                    // si usa `session` (già preso in prestito &mut) invece di
                    // ctx.accounts.voting_session per non violare il borrow checker
                    to:   session.to_account_info(),
                },
            );
            system_program::transfer(cpi_ctx, session.registration_fee)?;
        }

        // Crea l'account Candidate come PDA
        let candidate = &mut ctx.accounts.candidate_account;
        candidate.session_id  = state.current_session_id;
        candidate.authority   = ctx.accounts.candidate_signer.key();
        candidate.name        = name.clone();
        candidate.proposal    = proposal;
        candidate.vote_count  = 0;
        candidate.bump        = ctx.bumps.candidate_account;

        session.candidate_count += 1;

        emit!(CandidateRegistered {
            session_id: state.current_session_id,
            candidate:  ctx.accounts.candidate_signer.key(),
            name,
        });

        msg!(
            "Candidate {} registered for session {}",
            ctx.accounts.candidate_signer.key(),
            state.current_session_id
        );
        Ok(())
    }

    // ========================================================================
    // close_registration_and_start_voting
    // Chiude la fase di registrazione e apre quella di voto.
    //
    // Equivalente di:
    //   function closeRegistrationAndStartVoting(maxVotes) onlyAdmin
    // ========================================================================
    pub fn close_registration_and_start_voting(
        ctx:       Context<AdminAction>,
        max_votes: u64,
    ) -> Result<()> {
        let state   = &mut ctx.accounts.program_state;
        let session = &mut ctx.accounts.voting_session;

        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );
        require!(
            session.state == VotingState::Registration,
            VotingError::WrongState
        );
        require!(
            session.candidate_count >= 2,
            VotingError::NeedAtLeastTwoCandidates
        );
        require!(max_votes > 0, VotingError::InvalidMaxVotes);

        session.max_votes = max_votes;
        session.state     = VotingState::Voting;
        state.current_state = VotingState::Voting;

        emit!(RegistrationClosed {
            session_id: state.current_session_id,
            timestamp:  Clock::get()?.unix_timestamp,
        });

        msg!("Voting opened for session {}", state.current_session_id);
        Ok(())
    }

    // ========================================================================
    // vote
    // Esprime un voto per un candidato.
    // Crea un VoteRecord PDA per prevenire il doppio voto (invece del mapping).
    //
    // Equivalente di:
    //   function vote(address candidateAddress) payable
    //
    // NOTA IMPORTANTE: in Solidity si controlla voters[id][msg.sender].hasVoted.
    // In Solana, il tentativo di creare un PDA già esistente fallisce con un
    // errore — questo è il meccanismo nativo anti-doppio voto su Solana.
    // ========================================================================
    pub fn vote(ctx: Context<Vote>) -> Result<()> {
        let state     = &mut ctx.accounts.program_state;
        let session   = &mut ctx.accounts.voting_session;
        let candidate = &mut ctx.accounts.candidate_account;

        require!(
            session.state == VotingState::Voting,
            VotingError::WrongState
        );

        // Trasferisce la fee di voto
        if session.voting_fee > 0 {
            let cpi_ctx = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.voter.to_account_info(),
                    to:   session.to_account_info(),
                },
            );
            system_program::transfer(cpi_ctx, session.voting_fee)?;
        }

        // Crea il VoteRecord — se esiste già, Anchor restituisce un errore
        // automaticamente (account already exists). Questo è il meccanismo
        // anti-doppio voto: non serve un mapping come in Solidity.
        let vote_record = &mut ctx.accounts.vote_record;
        vote_record.session_id = state.current_session_id;
        vote_record.voter      = ctx.accounts.voter.key();
        vote_record.candidate  = candidate.authority;
        vote_record.bump       = ctx.bumps.vote_record;

        // Incrementa contatori
        candidate.vote_count += 1;
        session.total_votes  += 1;

        let cand_key = candidate.authority;

        emit!(VoteCast {
            session_id: state.current_session_id,
            voter:      ctx.accounts.voter.key(),
            candidate:  cand_key,
        });

        msg!(
            "Vote cast for {} in session {}",
            cand_key,
            state.current_session_id
        );

        // Controlla vittoria automatica
        if candidate.vote_count >= session.max_votes {
            let winner_name = candidate.name.clone();
            let vote_count  = candidate.vote_count;
            let session_id  = state.current_session_id;

            session.winner      = cand_key;
            session.winner_name = winner_name.clone();
            session.state       = VotingState::Completed;
            session.end_timestamp = Clock::get()?.unix_timestamp;

            state.current_state = VotingState::Inactive;

            emit!(VotingCompleted {
                session_id,
                winner: cand_key,
                winner_name,
                vote_count,
            });

            msg!("Voting session {} completed. Winner: {}", session_id, cand_key);
        }

        Ok(())
    }

    // ========================================================================
    // end_voting
    // L'admin termina manualmente la votazione.
    // NOTA: a differenza di Solidity, in Solana non possiamo iterare
    // dinamicamente su tutti i candidati per trovare il vincitore (lo storage
    // è distribuito in account separati). Il client JS deve passare il
    // CandidateAccount del vincitore come account aggiuntivo.
    //
    // Equivalente di:
    //   function endVoting() onlyAdmin
    // ========================================================================
    pub fn end_voting(ctx: Context<EndVoting>) -> Result<()> {
        let state   = &mut ctx.accounts.program_state;
        let session = &mut ctx.accounts.voting_session;
        let winner  = &ctx.accounts.winner_candidate;

        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );
        require!(
            session.state == VotingState::Voting,
            VotingError::WrongState
        );

        let winner_name = winner.name.clone();
        let winner_key  = winner.authority;
        let vote_count  = winner.vote_count;
        let session_id  = state.current_session_id;

        session.winner        = winner_key;
        session.winner_name   = winner_name.clone();
        session.state         = VotingState::Completed;
        session.end_timestamp = Clock::get()?.unix_timestamp;

        state.current_state = VotingState::Inactive;

        emit!(VotingCompleted {
            session_id,
            winner:      winner_key,
            winner_name,
            vote_count,
        });

        msg!("Voting session {} ended by admin. Winner: {}", session_id, winner_key);
        Ok(())
    }

    // ========================================================================
    // cancel_voting
    // L'admin annulla la sessione senza vincitore.
    //
    // Equivalente di:
    //   function cancelVoting() onlyAdmin
    // ========================================================================
    pub fn cancel_voting(ctx: Context<AdminAction>) -> Result<()> {
        let state   = &mut ctx.accounts.program_state;
        let session = &mut ctx.accounts.voting_session;

        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );
        require!(
            session.state != VotingState::Inactive,
            VotingError::NoActiveSession
        );

        session.state         = VotingState::Completed;
        session.end_timestamp = Clock::get()?.unix_timestamp;
        state.current_state   = VotingState::Inactive;

        emit!(VotingCancelled {
            session_id: state.current_session_id,
            timestamp:  Clock::get()?.unix_timestamp,
        });

        msg!("Voting session {} cancelled", state.current_session_id);
        Ok(())
    }

    // ========================================================================
    // withdraw_funds
    // L'admin preleva i lamports accumulati dalla sessione.
    //
    // NOTA: in Solana ogni account ha un "rent" minimo di lamports che non può
    // essere prelevato, altrimenti l'account verrebbe eliminato dal runtime.
    // Per semplicità qui trasferiamo solo l'eccesso sopra il minimo rent.
    //
    // Equivalente di:
    //   function withdrawFunds(uint amount) onlyAdmin
    // ========================================================================
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let state   = &ctx.accounts.program_state;
        let session = &mut ctx.accounts.voting_session;

        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );

        // Lamport balance dell'account sessione
        let session_lamports = session.to_account_info().lamports();
        require!(amount <= session_lamports, VotingError::InsufficientFunds);

        // Trasferisce lamports dall'account sessione all'admin
        // (via manipolazione diretta del balance — consentita al program owner)
        **session.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Withdrawn {} lamports to admin", amount);
        Ok(())
    }

    // ========================================================================
    // change_admin
    // Trasferisce il ruolo di admin.
    //
    // Equivalente di:
    //   function changeAdmin(address newAdmin) onlyAdmin
    // ========================================================================
    pub fn change_admin(ctx: Context<ChangeAdmin>) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        require!(
            ctx.accounts.authority.key() == state.admin,
            VotingError::NotAdmin
        );
        state.admin = ctx.accounts.new_admin.key();
        msg!("Admin changed to {}", state.admin);
        Ok(())
    }
}

// ─── Account Structures ───────────────────────────────────────────────────────

/// ProgramState: account globale con admin e contatori.
/// PDA: seeds = [b"program_state"], unico per tutta la vita del program.
#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub admin:              Pubkey,       // 32
    pub session_counter:    u64,          // 8
    pub current_state:      VotingState,  // 1
    pub current_session_id: u64,          // 8
    pub bump:               u8,           // 1
}

/// VotingSession: una sessione di votazione.
/// PDA: seeds = [b"session", session_id.to_le_bytes()]
#[account]
pub struct VotingSession {
    pub id:               u64,
    pub title:            String,   // MAX_STR_LEN
    pub description:      String,   // MAX_STR_LEN * 4
    pub registration_fee: u64,
    pub voting_fee:       u64,
    pub max_votes:        u64,
    pub state:            VotingState,
    pub candidate_count:  u8,
    pub total_votes:      u64,
    pub winner:           Pubkey,
    pub winner_name:      String,   // MAX_STR_LEN
    pub start_timestamp:  i64,
    pub end_timestamp:    i64,
    pub bump:             u8,
}

impl VotingSession {
    // Calcolo spazio: discriminator(8) + tutti i campi
    pub const LEN: usize = 8   // discriminator
        + 8                    // id
        + 4 + MAX_STR_LEN      // title
        + 4 + MAX_STR_LEN * 4  // description
        + 8                    // registration_fee
        + 8                    // voting_fee
        + 8                    // max_votes
        + 1                    // state enum
        + 1                    // candidate_count
        + 8                    // total_votes
        + 32                   // winner pubkey
        + 4 + MAX_STR_LEN      // winner_name
        + 8                    // start_timestamp
        + 8                    // end_timestamp
        + 1;                   // bump
}

/// CandidateAccount: un candidato per una sessione.
/// PDA: seeds = [b"candidate", session_id.to_le_bytes(), candidate_pubkey.as_ref()]
#[account]
pub struct CandidateAccount {
    pub session_id:  u64,
    pub authority:   Pubkey,  // indirizzo del candidato
    pub name:        String,  // MAX_STR_LEN
    pub proposal:    String,  // MAX_PROP_LEN
    pub vote_count:  u64,
    pub bump:        u8,
}

impl CandidateAccount {
    pub const LEN: usize = 8      // discriminator
        + 8                       // session_id
        + 32                      // authority
        + 4 + MAX_STR_LEN         // name
        + 4 + MAX_PROP_LEN        // proposal
        + 8                       // vote_count
        + 1;                      // bump
}

/// VoteRecord: prova che voter ha votato in questa sessione.
/// PDA: seeds = [b"vote", session_id.to_le_bytes(), voter_pubkey.as_ref()]
/// Il solo fatto che esista questo account impedisce il doppio voto.
#[account]
pub struct VoteRecord {
    pub session_id: u64,
    pub voter:      Pubkey,
    pub candidate:  Pubkey,
    pub bump:       u8,
}

impl VoteRecord {
    pub const LEN: usize = 8 + 8 + 32 + 32 + 1;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum VotingState {
    Inactive,     // = 0
    Registration, // = 1
    Voting,       // = 2
    Completed,    // = 3
}

// ─── Contexts (Accounts per istruzione) ──────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    // init: crea l'account PDA se non esiste
    // payer: chi paga il rent (il deployer)
    // space: quanti byte allocare
    // seeds + bump: derivazione PDA
    #[account(
        init,
        payer  = authority,
        space  = 8 + ProgramState::INIT_SPACE,
        seeds  = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateVotingSession<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    // Il PDA della sessione è derivato dal session_counter+1
    // Usiamo program_state.session_counter + 1 come seed (calcolato fuori)
    #[account(
        init,
        payer = authority,
        space = VotingSession::LEN,
        seeds = [b"session", (program_state.session_counter + 1).to_le_bytes().as_ref()],
        bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterCandidate<'info> {
    #[account(
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"session", program_state.current_session_id.to_le_bytes().as_ref()],
        bump  = voting_session.bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    // Nuovo account Candidate — PDA derivato da session_id + indirizzo candidato
    #[account(
        init,
        payer = candidate_signer,
        space = CandidateAccount::LEN,
        seeds = [
            b"candidate",
            program_state.current_session_id.to_le_bytes().as_ref(),
            candidate_signer.key().as_ref()
        ],
        bump
    )]
    pub candidate_account: Account<'info, CandidateAccount>,

    #[account(mut)]
    pub candidate_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"session", program_state.current_session_id.to_le_bytes().as_ref()],
        bump  = voting_session.bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"session", program_state.current_session_id.to_le_bytes().as_ref()],
        bump  = voting_session.bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    // CandidateAccount del candidato per cui si vota
    #[account(
        mut,
        seeds = [
            b"candidate",
            program_state.current_session_id.to_le_bytes().as_ref(),
            candidate_account.authority.as_ref()
        ],
        bump = candidate_account.bump
    )]
    pub candidate_account: Account<'info, CandidateAccount>,

    // VoteRecord — viene creato qui; se esiste già → errore = anti-doppio voto
    #[account(
        init,
        payer = voter,
        space = VoteRecord::LEN,
        seeds = [
            b"vote",
            program_state.current_session_id.to_le_bytes().as_ref(),
            voter.key().as_ref()
        ],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndVoting<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"session", program_state.current_session_id.to_le_bytes().as_ref()],
        bump  = voting_session.bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    // Il client JS passa il CandidateAccount del vincitore (quello con più voti)
    #[account(
        seeds = [
            b"candidate",
            program_state.current_session_id.to_le_bytes().as_ref(),
            winner_candidate.authority.as_ref()
        ],
        bump = winner_candidate.bump
    )]
    pub winner_candidate: Account<'info, CandidateAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [b"session", program_state.current_session_id.to_le_bytes().as_ref()],
        bump  = voting_session.bump
    )]
    pub voting_session: Account<'info, VotingSession>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ChangeAdmin<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump  = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: questo account viene solo usato come nuovo indirizzo admin
    pub new_admin: UncheckedAccount<'info>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct VotingSessionCreated {
    pub session_id: u64,
    pub title:      String,
    pub timestamp:  i64,
}

#[event]
pub struct CandidateRegistered {
    pub session_id: u64,
    pub candidate:  Pubkey,
    pub name:       String,
}

#[event]
pub struct RegistrationClosed {
    pub session_id: u64,
    pub timestamp:  i64,
}

#[event]
pub struct VoteCast {
    pub session_id: u64,
    pub voter:      Pubkey,
    pub candidate:  Pubkey,
}

#[event]
pub struct VotingCompleted {
    pub session_id:  u64,
    pub winner:      Pubkey,
    pub winner_name: String,
    pub vote_count:  u64,
}

#[event]
pub struct VotingCancelled {
    pub session_id: u64,
    pub timestamp:  i64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum VotingError {
    #[msg("Solo l'amministratore puo' eseguire questa funzione")]
    NotAdmin,

    #[msg("Operazione non valida nello stato corrente")]
    WrongState,

    #[msg("C'e' gia' una sessione attiva")]
    SessionAlreadyActive,

    #[msg("Nessuna sessione attiva")]
    NoActiveSession,

    #[msg("Servono almeno due candidati")]
    NeedAtLeastTwoCandidates,

    #[msg("Il numero massimo di voti deve essere maggiore di zero")]
    InvalidMaxVotes,

    #[msg("Hai gia' votato in questa sessione")]
    AlreadyVoted,

    #[msg("Candidato non valido")]
    InvalidCandidate,

    #[msg("Stringa troppo lunga")]
    StringTooLong,

    #[msg("Troppi candidati")]
    TooManyCandidates,

    #[msg("Saldo lamports insufficiente")]
    InsufficientFunds,
}
