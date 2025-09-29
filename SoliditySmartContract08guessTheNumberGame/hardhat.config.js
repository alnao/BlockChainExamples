require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");

module.exports = {
  solidity: {
    version: "0.8.18"
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    ec2geth: {
      url: "http://1.2.3.4:8545",
      accounts: ["0xTUA_PRIVATE_KEY_SENZA_0x"]
    }
  }
};
