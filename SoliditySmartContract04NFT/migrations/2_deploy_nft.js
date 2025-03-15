// migrations/2_deploy_simple_nft.js
const SimpleNFT = artifacts.require("SimpleNFT");

module.exports = function(deployer, network, accounts) {
  // Deploy con nome "MyAwesomeNFT" e simbolo "MANFT"
  deployer.deploy(SimpleNFT, "MyAwesomeNFT", "MANFT");
};