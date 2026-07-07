// ignition/modules/AdvancedVotingSystem.js
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition module per il deploy di AdvancedVotingSystem.
 * Sostituisce la vecchia migration Truffle 2_deploy_advanced_voting.js.
 */
const AdvancedVotingSystemModule = buildModule("AdvancedVotingSystemModule", (m) => {
  const votingSystem = m.contract("AdvancedVotingSystem");
  return { votingSystem };
});

export default AdvancedVotingSystemModule;
