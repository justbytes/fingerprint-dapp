// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "foundry/lib/forge-std/src/Script.sol";
import { TrackerContract } from "../src/TrackerContract.sol";

contract DeployScript is Script {
    function run() external {
        // Start broadcasting transactions using cast wallet
        vm.startBroadcast();

        // Deploy the TrackerContract
        TrackerContract tracker = new TrackerContract();

        // Log the deployed contract address
        console.log("TrackerContract deployed to:", address(tracker));
        console.log("Owner:", tracker.owner());
        console.log("Contract balance:", tracker.getContractBalance());

        // Stop broadcasting
        vm.stopBroadcast();
    }
}