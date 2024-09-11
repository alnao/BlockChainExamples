const SimpleToken = artifacts.require("SimpleToken");

   module.exports = function (deployer) {
     deployer.deploy(SimpleToken, "NaoToken", "Nao", 18, "1000000000000000000000000");
   };
   