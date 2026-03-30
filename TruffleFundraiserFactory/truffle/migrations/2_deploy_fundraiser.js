const Fundraiser = artifacts.require("Fundraiser");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(
    Fundraiser,
    "Nome Raccolta Fondi AlNao",      // name
    "https://alnao.com",      // url
    "https://www.alnao.it/img/alnao.jpeg",  // imageURL
    "Descrizione raccolta AlNao",     // description
    accounts[1],               // beneficiary
    accounts[0]                // custodian/owner
  );
};