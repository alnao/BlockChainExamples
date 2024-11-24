const SimpleToken = artifacts.require("SimpleToken");

module.exports = async function(callback) {
  try {
    const token = await SimpleToken.deployed();
    const accounts = await web3.eth.getAccounts();

    console.log('\nInformazioni Token:');
    console.log('--------------------------------');
    console.log('Indirizzo contratto:', token.address);
    console.log('Nome:', await token.name());
    console.log('Simbolo:', await token.symbol());
    console.log('Decimali:', (await token.decimals()).toString());
    console.log('Total Supply:', web3.utils.fromWei((await token.totalSupply()).toString(), 'ether'));
    
    console.log('\nBalance per account:');
    console.log('--------------------------------');
    for (let i = 0; i < accounts.length; i++) {
      const balance = await token.balanceOf(accounts[i]);
      console.log(`Account ${i}: ${accounts[i]}`);
      console.log(`Balance: ${web3.utils.fromWei(balance.toString(), 'ether')} NAO\n`);
    }

    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};