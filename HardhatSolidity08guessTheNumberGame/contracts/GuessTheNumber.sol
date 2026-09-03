// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title Guess The Number Game (multi-partita)
/// @notice Ogni utente può avviare la propria partita, gestita separatamente.
contract GuessTheNumberMulti is ReentrancyGuard {
	using EnumerableSet for EnumerableSet.AddressSet;

	IERC20 public immutable naoToken;
	address public immutable admin;

	uint256 public adminBalance;
	uint256 public setFee;
	uint256 public guessFee;
	uint256 public constant GAME_TIMEOUT = 30 days;

	error NotAdmin();
	error InvalidNumber();
	error GameActive();
	error NoActiveGame();
	error InsufficientBalance();
	error TooManyAttempts();
	error TransferFailed();
	error CommitmentNotFound();
	error AlreadyRevealed();
	error CommitmentTooEarly();
	error InvalidCommitment();
	error GameNotExpired();

	event GameStarted(address indexed setter, uint32 numberMasked, uint256 prizePool);
	event NumberUpdated(address indexed setter, uint32 numberMasked, uint256 prizePool);
	event Guessed(address indexed setter, address indexed player, uint256 guess, bool correct, uint256 prizePoolAfter, uint256 adminBalanceAfter);
	event Won(address indexed setter, address indexed winner, uint256 payout);
	event AdminWithdraw(address indexed to, uint256 amount);
	event FeesUpdated(uint256 setFee, uint256 guessFee);
	event GameCancelled(address indexed setter, uint256 refundAmount);
	event GuessCommitted(address indexed player, bytes32 indexed commitment);

	struct Game {
		bytes32 target;
		uint256 prizePool;
		bool active;
		uint256 createdAt;
	}

	struct GuessLimit {
		uint64 windowStart;
		uint8 attempts;
	}

	struct Commitment {
		bytes32 hash;
		uint64 commitBlock;
		bool revealed;
	}

	mapping(address => Game) public games; // setter => partita
	mapping(address => GuessLimit) public guessLimits;
	mapping(address => Commitment) public commitments;

	EnumerableSet.AddressSet private activeSetters;

	modifier onlyAdmin() {
		if (msg.sender != admin) revert NotAdmin();
		_;
	}

	constructor(address _naoToken, uint256 _setFee, uint256 _guessFee) {
		admin = msg.sender;
		naoToken = IERC20(_naoToken);
		setFee = _setFee;
		guessFee = _guessFee;
		emit FeesUpdated(_setFee, _guessFee);
	}

	function startGame(uint256 number) external {
		Game storage g = games[msg.sender];
		if (g.active) revert GameActive();
		if (number < 10**19) revert InvalidNumber();

		if (!naoToken.transferFrom(msg.sender, address(this), setFee)) revert TransferFailed();

		g.target = keccak256(abi.encodePacked(number));
		g.prizePool = setFee;
		g.active = true;
		g.createdAt = block.timestamp;

		activeSetters.add(msg.sender);
		emit GameStarted(msg.sender, 0, g.prizePool);
	}

	function updateNumber(uint256 newNumber) external {
		Game storage g = games[msg.sender];
		if (!g.active) revert NoActiveGame();
		if (newNumber < 10**19) revert InvalidNumber();

		if (!naoToken.transferFrom(msg.sender, address(this), setFee)) revert TransferFailed();

		g.target = keccak256(abi.encodePacked(newNumber));
		g.prizePool += setFee;
		g.createdAt = block.timestamp;

		emit NumberUpdated(msg.sender, 0, g.prizePool);
	}

	function cancelGame() external nonReentrant {
		Game storage g = games[msg.sender];
		if (!g.active) revert NoActiveGame();
		if (block.timestamp < g.createdAt + GAME_TIMEOUT) revert GameNotExpired();

		uint256 refund = g.prizePool;
		g.prizePool = 0;
		g.active = false;

		activeSetters.remove(msg.sender);

		if (!naoToken.transfer(msg.sender, refund)) revert TransferFailed();
		emit GameCancelled(msg.sender, refund);
	}

	function _applyRateLimit(address player) internal {
		GuessLimit storage gl = guessLimits[player];
		uint64 nowTs = uint64(block.timestamp);
		uint64 window = 7 * 3600; // 7 ore
		if (gl.windowStart == 0 || nowTs > gl.windowStart + window) {
			gl.windowStart = nowTs;
			gl.attempts = 0;
		}
		if (gl.attempts >= 4) revert TooManyAttempts();
		gl.attempts++;
	}

	function commitGuess(bytes32 commitmentHash) external nonReentrant {
		_applyRateLimit(msg.sender);

		if (!naoToken.transferFrom(msg.sender, address(this), guessFee)) revert TransferFailed();

		commitments[msg.sender] = Commitment({
			hash: commitmentHash,
			commitBlock: uint64(block.number),
			revealed: false
		});

		emit GuessCommitted(msg.sender, commitmentHash);
	}

	function revealGuess(uint256 guessNum, bytes32 salt) external nonReentrant {
		Commitment storage c = commitments[msg.sender];
		if (c.hash == bytes32(0)) revert CommitmentNotFound();
		if (c.revealed) revert AlreadyRevealed();
		if (block.number <= c.commitBlock) revert CommitmentTooEarly();

		bytes32 computedCommitment = keccak256(abi.encodePacked(msg.sender, guessNum, salt));
		if (computedCommitment != c.hash) revert InvalidCommitment();

		c.revealed = true;

		_processGuess(guessNum);
	}

	function guessAny(uint256 guessNum) external nonReentrant {
		_applyRateLimit(msg.sender);

		if (guessNum < 10**19) revert InvalidNumber();
		if (!naoToken.transferFrom(msg.sender, address(this), guessFee)) revert TransferFailed();

		_processGuess(guessNum);
	}

	function _processGuess(uint256 guessNum) internal {
		bool found = false;
		bytes32 guessHash = keccak256(abi.encodePacked(guessNum));
		uint256 activeCount = activeSetters.length();

		for (uint256 i = 0; i < activeCount; i++) {
			address setter = activeSetters.at(i);
			Game storage g = games[setter];
			if (g.active && g.target == guessHash) {
				uint256 payout = g.prizePool + guessFee;
				g.prizePool = 0;
				g.active = false;
				g.target = 0;

				activeSetters.remove(setter);

				if (!naoToken.transfer(msg.sender, payout)) revert TransferFailed();
				emit Guessed(setter, msg.sender, guessNum, true, 0, adminBalance);
				emit Won(setter, msg.sender, payout);
				found = true;
				break;
			}
		}

		if (!found) {
			uint256 half = guessFee / 2;
			uint256 adminPart = guessFee - half;

			uint256 currentActiveCount = activeSetters.length();
			uint256 remainder = 0;

			if (currentActiveCount > 0) {
				uint256 perGame = half / currentActiveCount;
				remainder = half - (perGame * currentActiveCount);

				for (uint256 i = 0; i < currentActiveCount; i++) {
					address setter = activeSetters.at(i);
					games[setter].prizePool += perGame;
				}
			} else {
                remainder = half;
            }

			adminBalance += (adminPart + remainder);
			emit Guessed(address(0), msg.sender, guessNum, false, 0, adminBalance);
		}
	}

	function adminWithdraw(address to, uint256 amount) external onlyAdmin nonReentrant {
		if (amount > adminBalance) revert InsufficientBalance();
		adminBalance -= amount;
		if (!naoToken.transfer(to, amount)) revert TransferFailed();
		emit AdminWithdraw(to, amount);
	}

	function updateFees(uint256 _setFee, uint256 _guessFee) external onlyAdmin {
		setFee = _setFee;
		guessFee = _guessFee;
		emit FeesUpdated(_setFee, _guessFee);
	}

	function getActiveSettersCount() external view returns (uint256) {
		return activeSetters.length();
	}

	function getActiveSetterAt(uint256 index) external view returns (address) {
		return activeSetters.at(index);
	}

	receive() external payable {
		revert("NO_DIRECT_ETH");
	}

	fallback() external payable {
		revert("NO_FALLBACK");
	}
}
