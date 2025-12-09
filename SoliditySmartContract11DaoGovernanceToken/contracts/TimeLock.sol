// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    // minDelay: tempo minimo prima che una proposta passata possa essere eseguita
    // proposers: lista di indirizzi che possono proporre (di solito il Governor)
    // executors: lista di indirizzi che possono eseguire (di solito chiunque o null)
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
