const SimpleToken = artifacts.require("SimpleToken");

//   module.exports = function (deployer) {
//     deployer.deploy(SimpleToken); //SimpleToken, "NaoToken", "Nao", 18, 999999999);
//   };
   module.exports = async function (deployer, network, accounts) {
     await deployer.deploy(SimpleToken);
     const tokenInstance = await SimpleToken.deployed();
   
     console.log('\nDettagli Deployment:');
     console.log('----------------------');
     console.log('Token address:', tokenInstance.address);
     console.log('Deployer address:', accounts[0]);
     const balance = await tokenInstance.balanceOf(accounts[0]);
     console.log('Initial balance:', web3.utils.fromWei(balance.toString(), 'ether'));
   };