// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Lottery is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;
    IERC20 public paymentToken;

    // Chainlink VRF Variables
    uint64 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Lottery Variables
    address public owner;
    address payable[] public players;
    uint256 public entryFee;
    uint256 public lotteryId;
    
    // Events
    event LotteryStarted(uint256 lotteryId);
    event PlayerEntered(uint256 lotteryId, address player);
    event WinnerPicked(uint256 lotteryId, address winner, uint256 amount);
    event RequestSent(uint256 requestId, uint32 numWords);

    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 _keyHash,
        uint256 _entryFee,
        address _paymentToken
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = _keyHash;
        entryFee = _entryFee;
        paymentToken = IERC20(_paymentToken);
        owner = msg.sender;
    }

    function enter() public {
        require(paymentToken.transferFrom(msg.sender, address(this), entryFee), "Transfer failed");
        players.push(payable(msg.sender));
        emit PlayerEntered(lotteryId, msg.sender);
    }

    function pickWinner() external {
        require(msg.sender == owner, "Only owner");
        require(players.length > 0, "No players");
        
        // Request Randomness
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        emit RequestSent(requestId, numWords);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % players.length;
        address payable winner = players[indexOfWinner];
        
        uint256 prize = paymentToken.balanceOf(address(this));
        require(paymentToken.transfer(winner, prize), "Prize transfer failed");
        
        emit WinnerPicked(lotteryId, winner, prize);
        
        // Reset
        players = new address payable[](0);
        lotteryId++;
    }
}
