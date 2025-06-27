require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
module.exports = {
    solidity: "0.8.20",
    networks: {
    arbitrum: {
        url: process.env.ARBITRUM_RPC,
        accounts: [process.env.PRIVATE_KEY],
    },
    },
};