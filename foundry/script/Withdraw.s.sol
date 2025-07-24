// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Script, console } from "foundry/lib/forge-std/src/Script.sol";
import { TrackerContract } from "../src/TrackerContract.sol";

/// Run this to get you test test eth back from the contract
contract WithdrawScript is Script {
    function run() external {

        // Replace with your deployed contract address
        address contractAddress = 0x87E74b188541389eb7d72d35F10C0A131519b7e5;

        vm.startBroadcast();

        TrackerContract tracker = TrackerContract(contractAddress);

        // Check current state
        console.log("TrackerContract address:", address(tracker));
        console.log("Owner:", tracker.owner());

        uint256 contractBalance = tracker.getContractBalance();
        console.log("Contract balance before withdrawal:", contractBalance);

        // If theres ETH then withdraw
        if (contractBalance > 0) {
            // Withdraw all funds
            tracker.withdrawFunds();
            console.log("Withdrawal successful!");

            // Verify balance after withdrawal
            uint256 newBalance = tracker.getContractBalance();
            console.log("Contract balance after withdrawal:", newBalance);
        } else {
            console.log("No funds to withdraw");
        }

        vm.stopBroadcast();
    }
}