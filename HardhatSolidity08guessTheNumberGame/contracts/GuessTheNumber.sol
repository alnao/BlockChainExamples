// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Guess The Number Game (multi-partita)
/// @notice Ogni utente può avviare la propria partita, gestita separatamente.
contract GuessTheNumberMulti {
	IERC20 public immutable naoToken;
	error NotAdmin();
	error InvalidNumber();
	error GameActive();
	error NoActiveGame();
	error WrongFee();
	error NotSetter();
	error InsufficientBalance();

	event GameStarted(address indexed setter, uint32 numberMasked, uint256 prizePool);
	event NumberUpdated(address indexed setter, uint32 numberMasked, uint256 prizePool);
	event Guessed(address indexed setter, address indexed player, uint256 guess, bool correct, uint256 prizePoolAfter, uint256 adminBalanceAfter);
	event Won(address indexed setter, address indexed winner, uint256 payout);
	event AdminWithdraw(address indexed to, uint256 amount);
	event FeesUpdated(uint256 setFee, uint256 guessFee);

	address public immutable admin;
	uint256 public adminBalance;
	uint256 public setFee;
	uint256 public guessFee;

	struct Game {
		bytes32 target;
		uint256 prizePool;
		bool active;
	}
	// Rate limit: max 4 guessAny ogni 7 ore per address
	struct GuessLimit {
		uint64 windowStart;
		uint8 attempts;
	}
	mapping(address => GuessLimit) public guessLimits;


	mapping(address => Game) public games; // setter => partita
	address[] public activeSettersList;

	uint256 private locked = 1;
	modifier nonReentrant() {
		require(locked == 1, "REENTRANCY");
		locked = 2;
		_;
		locked = 1;
	}

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
        // Deve essere almeno 20 cifre
        if (number < 10**19) revert InvalidNumber();
        // Trasferisci GNG dal setter al contratto
        require(naoToken.transferFrom(msg.sender, address(this), setFee), "GNG transfer failed");
        g.target = keccak256(abi.encodePacked(number));
        g.prizePool = setFee;
        g.active = true;
        activeSettersList.push(msg.sender);
        emit GameStarted(msg.sender, 0, g.prizePool); // mask non più usato
	}


	function updateNumber(uint256 newNumber) external {
        Game storage g = games[msg.sender];
        if (!g.active) revert NoActiveGame();
        if (newNumber < 10**19) revert InvalidNumber();
        require(naoToken.transferFrom(msg.sender, address(this), setFee), "GNG transfer failed");
        g.target = keccak256(abi.encodePacked(newNumber));
        g.prizePool += setFee;
        emit NumberUpdated(msg.sender, 0, g.prizePool);
	}


	function guessAny(uint256 guessNum) external nonReentrant {
		// Rate limit: max 4 tentativi ogni 7 ore
		GuessLimit storage gl = guessLimits[msg.sender];
		uint64 nowTs = uint64(block.timestamp);
		uint64 window = 7 * 3600; // 7 ore
		if (gl.windowStart == 0 || nowTs > gl.windowStart + window) {
			gl.windowStart = nowTs;
			gl.attempts = 0;
		}
		require(gl.attempts < 4, "Too many attempts, wait window");
		gl.attempts++;

		require(guessNum >= 10**19, "InvalidNumber");
		require(naoToken.transferFrom(msg.sender, address(this), guessFee), "GNG transfer failed");
		bool found = false;
		bytes32 guessHash = keccak256(abi.encodePacked(guessNum));
		for (uint256 i = 0; i < activeSettersList.length; i++) {
			address setter = activeSettersList[i];
			Game storage g = games[setter];
			if (g.active && g.target == guessHash) {
				uint256 payout = g.prizePool + guessFee;
				g.prizePool = 0;
				g.active = false;
				g.target = 0;
				require(naoToken.transfer(msg.sender, payout), "GNG payout failed");
				emit Guessed(setter, msg.sender, guessNum, true, g.prizePool, adminBalance);
				emit Won(setter, msg.sender, payout);
				found = true;
				break;
			}
		}
		if (!found) {
			uint256 half = guessFee / 2;
			uint256 adminPart = guessFee - half;
			// Dividi la metà tra tutti i prizePool attivi
			uint256 activeCount = 0;
			for (uint256 i = 0; i < activeSettersList.length; i++) {
				if (games[activeSettersList[i]].active) activeCount++;
			}
			if (activeCount > 0) {
				uint256 perGame = half / activeCount;
				for (uint256 i = 0; i < activeSettersList.length; i++) {
					if (games[activeSettersList[i]].active) {
						games[activeSettersList[i]].prizePool += perGame;
					}
				}
			}
			adminBalance += adminPart;
			emit Guessed(address(0), msg.sender, guessNum, false, 0, adminBalance);
		}
	}


	function adminWithdraw(address to, uint256 amount) external onlyAdmin nonReentrant {
		if (amount > adminBalance) revert InsufficientBalance();
		adminBalance -= amount;
		require(naoToken.transfer(to, amount), "NAO admin withdraw failed");
		emit AdminWithdraw(to, amount);
	}


	function updateFees(uint256 _setFee, uint256 _guessFee) external onlyAdmin {
		setFee = _setFee;
		guessFee = _guessFee;
		emit FeesUpdated(_setFee, _guessFee);
	}


	function mask(uint32 x) internal pure returns (uint32) {
		return x ^ 0xA5A5A5A5;
	}

	receive() external payable {
		revert("NO_DIRECT_ETH");
	}

	fallback() external payable {
		revert("NO_FALLBACK");
	}
}

