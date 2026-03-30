pragma solidity >0.4.23 <0.7.0;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Fundraiser is Ownable { //contract Fundraiser {
    string public name;
    string public url;
    string public imageURL;
    string public description;
    address payable public beneficiary;
    // address public custodian;

    struct Donation {
        uint256 value;
        uint256 conversionFactor;
        uint256 date;
    }
    mapping(address => Donation[]) private _donations;
    
    using SafeMath for uint256;
    uint256 public totalDonations;
    uint256 public donationsCount;

    event DonationReceived(address indexed donor, uint256 value);
    event Withdraw(uint256 amount);

    constructor(string memory _name, string memory _url, string memory _imageURL, string memory _description 
    , address payable _beneficiary, address _custodian) public { 
        name = _name;
        url = _url;
        imageURL = _imageURL;
        description = _description;
        beneficiary = _beneficiary;
        transferOwnership(_custodian); //custodian = _custodian;
    }

    function setBeneficiary(address payable _beneficiary) public onlyOwner {
        beneficiary = _beneficiary;
    }

    function myDonationsCount() public view returns(uint256) {
        return _donations[msg.sender].length;
    }

    function donate() public payable {
        Donation memory donation = Donation({
            value: msg.value,
            conversionFactor : 1,
            date: block.timestamp
        });
        _donations[msg.sender].push(donation);
        totalDonations = totalDonations.add(msg.value);
        donationsCount++;

        emit DonationReceived(msg.sender, msg.value); //added events
    }

    function multipleReturns() pure public returns(uint256, uint256) {
        return (1, 2);
    }
    function multipleReturnsWithNames() pure public returns(uint256 a, uint256 b) {
        a = 1;
        b = 2;
        return (a, b);
    }

    function myDonations() public view returns(uint256[] memory values,uint256[] memory dates){
        uint256 count = myDonationsCount();
        values = new uint256[](count);
        dates = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            Donation storage donation = _donations[msg.sender][i];
            values[i] = donation.value;
            dates[i] = donation.date;
        }
        return (values, dates);
    }


    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        beneficiary.transfer(balance);
        emit Withdraw(balance);
    }

    //Fallback functions are functions that are unnamed and will supply the default behavior in the event that the contract receives ether through a plain transaction or if the
    //contract is called with a method signature that does not match any of the defined functions.
    //we will use this to simulate the idea of an anonymous donation.
    fallback() external payable { //function () external payable { 
        totalDonations = totalDonations.add(msg.value);
        donationsCount++;
    }
}
