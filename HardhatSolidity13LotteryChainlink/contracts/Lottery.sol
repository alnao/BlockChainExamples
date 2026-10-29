// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lottery is VRFConsumerBaseV2 {
    enum LotteryState {
        OPEN,
        CALCULATING_WINNER,
        CLOSED
    }

    VRFCoordinatorV2Interface internal immutable COORDINATOR;
    address public immutable vrfCoordinator;
    IERC20 public immutable paymentToken;

    // Chainlink VRF Variables
    uint64 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    // Lottery Variables
    address public owner;
    address[] public players;
    uint256 public entryFee;
    uint256 public lotteryId;
    LotteryState public lotteryState;

    // Historical & draw info
    address public recentWinner;
    uint256 public recentPrize;
    uint256 public lastRequestId;

    // Events
    event LotteryStarted(uint256 indexed lotteryId);
    event PlayerEntered(uint256 indexed lotteryId, address indexed player);
    event WinnerPicked(uint256 indexed lotteryId, address indexed winner, uint256 amount);
    event RequestSent(uint256 indexed requestId, uint32 numWords);
    event EntryFeeUpdated(uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        uint64 subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _entryFee,
        address _paymentToken
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        require(_vrfCoordinator != address(0), "Invalid coordinator");
        require(_paymentToken != address(0), "Invalid payment token");
        require(_entryFee > 0, "Entry fee must be > 0");

        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        vrfCoordinator = _vrfCoordinator;
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        entryFee = _entryFee;
        paymentToken = IERC20(_paymentToken);
        owner = msg.sender;
        lotteryState = LotteryState.OPEN;
        lotteryId = 1;

        emit LotteryStarted(lotteryId);
    }

    function enter() public {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(
            paymentToken.transferFrom(msg.sender, address(this), entryFee),
            "Transfer failed"
        );
        players.push(msg.sender);
        emit PlayerEntered(lotteryId, msg.sender);
    }

    function pickWinner() external onlyOwner returns (uint256 requestId) {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(players.length > 0, "No players in lottery");

        lotteryState = LotteryState.CALCULATING_WINNER;

        // Request Randomness from Chainlink VRF Coordinator
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        lastRequestId = requestId;

        emit RequestSent(requestId, numWords);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        if (players.length == 0) {
            lotteryState = LotteryState.OPEN;
            return;
        }

        uint256 indexOfWinner = randomWords[0] % players.length;
        address winner = players[indexOfWinner];

        uint256 prize = paymentToken.balanceOf(address(this));
        require(paymentToken.transfer(winner, prize), "Prize transfer failed");

        recentWinner = winner;
        recentPrize = prize;
        emit WinnerPicked(lotteryId, winner, prize);

        // Reset state for next round
        delete players;
        lotteryId++;
        lotteryState = LotteryState.OPEN;
        emit LotteryStarted(lotteryId);
    }

    // View functions
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }

    function getLotteryBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    // Admin configuration
    function setEntryFee(uint256 _newFee) external onlyOwner {
        require(lotteryState == LotteryState.OPEN, "Lottery is not open");
        require(players.length == 0, "Cannot change fee during active round");
        require(_newFee > 0, "Fee must be greater than 0");
        entryFee = _newFee;
        emit EntryFeeUpdated(_newFee);
    }
}
