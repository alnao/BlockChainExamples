// migrations/2_deploy_simple_voting.js
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = function(deployer, network, accounts) {
  // Deploy del contratto con una durata di 48 ore per le votazioni
  // Questo valore può essere modificato in base alle esigenze
  const durataDiVotazioneInOre = 48;
  
  deployer.deploy(SimpleVoting, durataDiVotazioneInOre);
};