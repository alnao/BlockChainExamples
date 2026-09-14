// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // Reward rate: 0.01 reward token (1e16 wei) per secondo per ogni 1 token (1e18 wei) in stake
    uint256 public rewardRate = 1e16; // 1% al secondo per fini dimostrativi

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardsDeposited(address indexed admin, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _stakingToken, address _rewardToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    modifier updateReward(address account) {
        if (account != address(0)) {
            rewards[account] = calculateReward(account);
            lastUpdateTime[account] = block.timestamp;
        }
        _;
    }

    function calculateReward(address account) public view returns (uint256) {
        if (stakedBalance[account] == 0) {
            return rewards[account];
        }
        uint256 timeElapsed = block.timestamp - lastUpdateTime[account];
        // Earned = (stakedBalance * timeElapsed * rewardRate) / 1e18
        uint256 earned = (stakedBalance[account] * timeElapsed * rewardRate) / 1e18;
        return rewards[account] + earned;
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        
        stakedBalance[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward to claim");
        
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward);
    }

    // Prelievo d'emergenza senza maturazione ricompense
    function emergencyWithdraw() external nonReentrant {
        uint256 amount = stakedBalance[msg.sender];
        require(amount > 0, "Nothing staked");
        
        stakedBalance[msg.sender] = 0;
        rewards[msg.sender] = 0;
        lastUpdateTime[msg.sender] = block.timestamp;
        
        stakingToken.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    // Funzione per l'admin per depositare reward token nel contratto
    function depositRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        rewardToken.transferFrom(msg.sender, address(this), amount);
        emit RewardsDeposited(msg.sender, amount);
    }

    // Funzione per l'admin per aggiornare il rate delle ricompense
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }
}

