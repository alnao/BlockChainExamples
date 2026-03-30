const SimpleToken = artifacts.require("SimpleToken");

contract("SimpleToken", (accounts) => {
  let simpleToken;
  const [owner, recipient, spender] = accounts;
  const name = "SimpleToken";
  const symbol = "STK";
  const decimals = 18;
  const totalSupply = web3.utils.toWei("1000000", "ether");

  beforeEach(async () => {
    simpleToken = await SimpleToken.new(name, symbol, decimals, totalSupply);
  });

  describe("Deployment", () => {
    it("should set the correct token details", async () => {
      assert.equal(await simpleToken.name(), name, "Name is incorrect");
      assert.equal(await simpleToken.symbol(), symbol, "Symbol is incorrect");
      assert.equal(await simpleToken.decimals(), decimals, "Decimals is incorrect");
      assert.equal(await simpleToken.totalSupply(), totalSupply, "Total supply is incorrect");
    });

    it("should assign the total supply to the owner", async () => {
      const ownerBalance = await simpleToken.balanceOf(owner);
      assert.equal(ownerBalance.toString(), totalSupply, "Owner balance is incorrect");
    });
  });

  describe("Transfer", () => {
    const amount = web3.utils.toWei("1000", "ether");

    it("should transfer tokens between accounts", async () => {
      await simpleToken.transfer(recipient, amount, { from: owner });
      const recipientBalance = await simpleToken.balanceOf(recipient);
      assert.equal(recipientBalance.toString(), amount, "Recipient balance is incorrect");
    });

    it("should fail if sender doesn't have enough tokens", async () => {
      try {
        await simpleToken.transfer(recipient, web3.utils.toWei("1000001", "ether"), { from: owner });
        assert.fail("The transfer should have thrown an error");
      } catch (error) {
        assert.include(error.message, "revert", "The error message should contain 'revert'");
      }
    });
  });

  describe("Approve and TransferFrom", () => {
    const amount = web3.utils.toWei("1000", "ether");

    beforeEach(async () => {
      await simpleToken.approve(spender, amount, { from: owner });
    });

    it("should approve tokens for delegated transfer", async () => {
      const allowance = await simpleToken.allowance(owner, spender);
      assert.equal(allowance.toString(), amount, "Allowance is incorrect");
    });

    it("should transfer tokens using transferFrom", async () => {
      await simpleToken.transferFrom(owner, recipient, amount, { from: spender });
      const recipientBalance = await simpleToken.balanceOf(recipient);
      assert.equal(recipientBalance.toString(), amount, "Recipient balance is incorrect");
    });

    it("should fail if trying to transferFrom more than allowed", async () => {
      try {
        await simpleToken.transferFrom(owner, recipient, web3.utils.toWei("1001", "ether"), { from: spender });
        assert.fail("The transferFrom should have thrown an error");
      } catch (error) {
        assert.include(error.message, "revert", "The error message should contain 'revert'");
      }
    });
  });
});