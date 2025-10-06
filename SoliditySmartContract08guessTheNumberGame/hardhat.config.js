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
      // opzionale: inserire qui la private key dell’account creato su Geth 0xTUA_PRIVATE_KEY_SENZA_0x
      accounts: ["0xTUA_PRIVATE_KEY_SENZA_0x"]
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/<KEY_ID>", // o endpoint Alchemy
      accounts: ["0xTUA_PRIVATE_KEY_SENZA_0x"
        ,"0xTUA_SECONDA_PRIVATE_KEY_SENZA_0x"
      ]
    }
  }
 
};
