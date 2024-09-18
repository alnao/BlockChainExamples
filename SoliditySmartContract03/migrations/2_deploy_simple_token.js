const SimpleToken = artifacts.require("SimpleToken");

   module.exports = function (deployer) {
     deployer.deploy(SimpleToken); //SimpleToken, "NaoToken", "Nao", 18, 999999999);
   };
   