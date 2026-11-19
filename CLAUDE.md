# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rules (set by the repository owner)
- Never run commands outside the workspace: no reading, writing or executing anything in other paths    (the only exception is the session scratchpad provided by Claude Code for temporary files).
- Cloud commands only after explicit confirmation: before running aws, az, cdk, sam, serverless (and any other tool that acts on a cloud account, e.g. gcloud), show the exact command, say what it does (and whether it costs money or changes resources) and wait for the user's confirmation. Each command needs its own confirmation: a previous "yes" does not cover the next one. The same applies to running scripts or apps from this repo that call real cloud APIs through an SDK (boto3, Azure SDK), e.g. starting a Manager that queries AWS.
- Never run git commands, read-only ones included (git status, git diff, git log, ...). To know what changed, read the files; commits are made by the user.
- Every README.md must have two last sections:
    - changelog : add a row every time I ask you change code inside folder, the description must be max 10 worlds
    - "alnao footer" is always the same and never change it if there are not into readme file.
    - Format: `## Changelog` table `| Data | Descrizione |` (rows in chronological order) placed right before the footer; the footer is the block from `# &lt; AlNao /&gt;` to the end of the file (including `## License`) and must be byte-identical to the one in the root `README.md` (copy it from there when missing).
    - Scope: project READMEs and the root README only; the standard Vite / Create React App template READMEs inside sub-apps (`client/`, `admin-app/`, `voter-app/`, `simple-token-interface/`) are excluded.


## Repository shape

A collection of **independent, self-contained educational blockchain projects** — there is no root package, workspace or shared build. Every command runs from inside a project folder, and each project has its own `package.json`/`node_modules` (or Cargo/Foundry/Python setup) and its own `README.md` with step-by-step "Fasi". The root `README.md` is the catalogue of projects; `ROADMAP.md` describes planned ones (Forge0x, Anchor0x, Vyper0x — each is a re-implementation of an existing Hardhat use case in another toolchain).

All docs, code comments, UI strings and commit messages are in **Italian**; keep new content consistent. Commit messages follow the pattern `Progetto <NomeCartella> revisionato e testato`.

Project families:
- `HardhatSolidityNN*` — current main line (Hardhat 2 + Solidity + ethers v6, React/Vite client). `06` is the odd one out: TypeScript config, Hardhat Ignition deploy, `client-vite/`.
- `Forge01*` (Foundry), `Vyper01*` (Hardhat + `@nomiclabs/hardhat-vyper`), `Anchor01*` (Solana, Rust + Anchor) — newer, in development.
- `Truffle*`, `Web3ProjectsExample1` — **deprecated** (Truffle/Ganache), kept for reference only.
- `PythonBlockChain`, `TypescriptBlockChain` — toy blockchains (Flask / Express), not smart contracts.

## Hardhat projects (09–14 and Vyper01 share this layout)

```bash
npm install && npm run client:install
npx hardhat compile
npx hardhat test                                  # all tests
npx hardhat test test/Lottery.test.js             # single file
npx hardhat test --grep "nome del test"           # single test by name
npx hardhat node                                  # local chain on :8545 (terminal 1)
npm run deploy:local                              # scripts/deploy.js --network localhost
npm run fund:local / interact:local               # helper scripts
npm run client:dev                                # React+Vite frontend (each project uses a different port)
```

The cross-file flow to know: **`scripts/deploy.js` is the bridge between chain and frontend.** After deploying it writes `deployed-contract.json` (addresses) and regenerates `client/src/contracts/config.js` + `*_abi.json` from the Hardhat artifacts. The client imports only those files, so after any contract change you must recompile **and redeploy** for the frontend to see new ABIs/addresses. `scripts/generate-keys.js` dumps the deterministic Hardhat node accounts into `local-keys.json` (gitignored) for importing into MetaMask. Project 06 does the same via `ignition deploy` + `scripts/post-deploy.js`/`copy-abi.js`. Sepolia deploys read `SEPOLIA_RPC_URL`/`PRIVATE_KEY` from `.env` (gitignored).

## Forge01VotationsFoundry

`bash install_all.sh` sets everything up (Foundry via foundryup, forge-std, client deps, build + test). `lib/` is gitignored: install forge-std with `forge install foundry-rs/forge-std --no-git` (`--no-commit` no longer exists in Foundry 1.x, and without `--no-git` it would add a submodule to the parent repo). Then `forge build`, `forge test`, single suite with `forge test --match-contract VotingFuzzTest` (or `--match-test <name>`), `-vvv` for traces, `--gas-report`. Local node is `anvil`; `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` deploys (falls back to anvil key #0 without `.env`) and exports `config.js` + the artifact/ABI to `client/src/contracts/` — this needs the `fs_permissions` entry in `foundry.toml`. `foundry.toml` uses flat keys (`optimizer = true`, `optimizer_runs`), not an `[optimizer]` table. Invariant tests use a handler with `targetSelector` and ghost variables. Solidity string literals must be ASCII (no `—`), or use `unicode"..."`.

## Anchor01VotationsSolana (Solana)

```bash
anchor build                          # → target/deploy/voting.so, target/idl/voting.json, target/types/voting.ts
anchor test                           # spins up its own validator, runs tests/voting.ts (mocha via npx, not yarn)
solana-test-validator --reset         # manual validator (terminal 1), then:
anchor test --skip-local-validator    # deploys to it and runs tests
npm run app:dev                       # frontend in app/ (port 5178)
```
Single test: `npx ts-mocha -p ./tsconfig.json -t 1000000 tests/voting.ts -g "<nome test>"` against a running validator with the program deployed.

Non-obvious constraints (all were real breakages):
- `anchor build` compiles with the Solana platform-tools Rust (**1.75**, Solana CLI 1.18.26, Anchor 0.30.1), not the system cargo. `Cargo.lock` must stay **lockfile `version = 3`** with crates that don't require edition 2024. Pinned on purpose: `blake3 1.5.5`, `zeroize_derive 1.4.3`, `proc-macro2 1.0.94` (≥1.0.95 breaks Anchor 0.30 IDL generation). Never run a plain `cargo update`; if needed use `CARGO_RESOLVER_INCOMPATIBLE_RUST_VERSIONS=fallback cargo update -p <crate>` and reset the lockfile header to `version = 3`.
- Program ID lives in three places that must match `target/deploy/voting-keypair.json`: `declare_id!` in `programs/voting/src/lib.rs`, `Anchor.toml`, `app/src/contracts/config.js`. After a new keypair: `anchor keys sync`, rebuild, update `config.js`. Mismatch shows up as `DeclaredProgramIdMismatch`.
- After every `anchor build`, copy `target/idl/voting.json` to `app/src/contracts/voting.json` (the frontend loads the IDL from there).
- Account model: state is spread across PDAs — `ProgramState [b"program_state"]`, `VotingSession [b"session", id u64 LE]`, `CandidateAccount [b"candidate", id, pubkey]`, `VoteRecord [b"vote", id, pubkey]` (its existence is the anti-double-vote check). The program cannot iterate candidates: the client lists them with `program.account.candidateAccount.all()` + `memcmp` on `session_id` at offset 8, and passes the winner account to `end_voting`. `withdraw_funds` only acts on the current session and must leave the rent-exempt minimum.
- Frontend: `app/src/polyfills.js` (global `Buffer`) must remain the first import in `main.jsx`. Phantom only signs; transactions are sent by the app to `RPC_URL`, so Phantom must be in Testnet Mode → Localnet to show balances and simulate correctly.

## Other projects

- `PythonBlockChain`: `pip install -r requirements.txt`; tests `python3 -m pytest test_blockchain.py -v` (single: `-k <name>`).
- `TypescriptBlockChain`: `npm run dev` (ts-node `server.ts`), `npm run build` / `npm start`; API calls in `postman_collection.json`.
- `Vyper01VotationsVyper`: same Hardhat layout/commands as above (`bash install_all.sh` does npm install + compile + test). No manual Vyper install: `@nomiclabs/hardhat-vyper` downloads the 0.4.0 compiler into the Hardhat cache; `hardhat-toolbox` provides ethers + chai matchers. Vyper 0.4 gotchas: `enum` became `flag` (a bitmask 1,2,4,8), so the voting state is `uint8` constants 0–3 to match the Solidity ABI; internal helpers called from `@view` functions must be `@view`; NatSpec text must not start with `@` after a tag. Functions are snake_case in tests and frontend.
