pragma solidity >= 0.4.0 < 0.9.0;
contract Greeter {
    string private _greeting;
    address private _owner;
    constructor() public {
        _owner = msg.sender;
    }

	function greetHello() external pure returns(string memory) {
        return "Hello, World!";
    }

	function greet() external view returns(string memory) {
        return _greeting; 
    }
    //old function setGreeting(string calldata greeting) external {
    function setGreeting(string calldata greeting) external onlyOwner {
        _greeting = greeting;
    }

    function owner() public view returns(address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner,"Ownable: caller is not the owner");
        _;
    }
}