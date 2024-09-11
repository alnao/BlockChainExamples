// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Lock {
    uint256 private value;
    address payable public owner; //address public owner;
    uint public unlockTime;
    event Withdrawal(uint amount, uint when);

    constructor(uint256 _newValue) {
        //owner = msg.sender;
        owner = payable(msg.sender);
        value = _newValue;
    }
    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    function setValue(uint256 _newValue) public onlyOwner {
        value = _newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}