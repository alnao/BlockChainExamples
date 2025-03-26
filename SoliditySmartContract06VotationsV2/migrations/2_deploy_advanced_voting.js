// migrations/2_deploy_advanced_voting.js
const AdvancedVotingSystem = artifacts.require("AdvancedVotingSystem");

module.exports = async function(deployer, network, accounts) {
  const admin = accounts[0]; // L'account che esegue il deploy sarà l'amministratore
  
  console.log(`Deploying AdvancedVotingSystem with admin: ${admin}`);
  
  try {
    // Deploy del contratto AdvancedVotingSystem
    await deployer.deploy(AdvancedVotingSystem, { from: admin });
    const votingInstance = await AdvancedVotingSystem.deployed();
    
    console.log(`AdvancedVotingSystem deployed at: ${votingInstance.address}`);
    
    // Log network-specific info
    if (network === 'development' || network === 'test' || network === 'ganache') {
      console.log('\nDevelopment Environment Setup:');
      console.log('-----------------------------');
      console.log(`Admin account: ${admin}`);
      console.log(`Test accounts available:`);
      
      // Mostra gli account disponibili per il testing
      for (let i = 1; i < Math.min(accounts.length, 6); i++) {
        console.log(`Account ${i}: ${accounts[i]}`);
      }
      
      console.log('\nSample Usage:');
      console.log('-------------');
      console.log(`1. Create voting session: await instance.createVotingSession("Election 2025", "Presidential Election", web3.utils.toWei("0.1", "ether"), web3.utils.toWei("0.01", "ether"), { from: "${admin}" });`);
      console.log(`2. Register candidate: await instance.registerCandidate("Candidate Name", "My proposal details...", { from: accounts[1], value: web3.utils.toWei("0.1", "ether") });`);
      console.log(`3. Close registration & start voting: await instance.closeRegistrationAndStartVoting(100, { from: "${admin}" });`);
      console.log(`4. Vote: await instance.vote(accounts[1], { from: accounts[3], value: web3.utils.toWei("0.01", "ether") });`);
      console.log(`5. End voting: await instance.endVoting({ from: "${admin}" });`);
      console.log(`6. Get results: await instance.getVotingResults(1);`);
    }
    
    if (network === 'goerli' || network === 'sepolia' || network === 'mainnet') {
      console.log('\nContract successfully deployed to a production network.');
      console.log(`Verify contract on Etherscan: npx truffle run verify AdvancedVotingSystem --network ${network}`);
    }
    
  } catch (error) {
    console.error('Error during deployment:', error);
    throw error;
  }
};