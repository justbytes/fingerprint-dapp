// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "foundry/lib/forge-std/src/Test.sol";
import {TrackerContract} from "../src/TrackerContract.sol";

contract TrackerContractTest is Test {
    TrackerContract public tracker;
    address public owner;
    address public user1;
    address public user2;

    // Test fingerprint hashes
    bytes32 public constant FINGERPRINT_1 = keccak256("fingerprint1");
    bytes32 public constant FINGERPRINT_2 = keccak256("fingerprint2");
    bytes32 public constant ZERO_HASH = bytes32(0);

    // Test values
    uint256 public constant TEST_VALUE_1 = 0.001 ether;
    uint256 public constant TEST_VALUE_2 = 0.002 ether;

    event ActionLogged(address indexed user, bytes32 fingerprintHash, uint256 value);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        tracker = new TrackerContract();

        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testConstructor() public view {
        assertEq(tracker.owner(), owner);
        assertEq(tracker.getTotalFingerprints(), 0);
        assertEq(tracker.getContractBalance(), 0);
        assertEq(tracker.MINIMUM_AMOUNT(), 0.001 ether);
    }

    function testSubmitAction() public {
        vm.startPrank(user1);

        // Test successful action submission
        vm.expectEmit(true, false, false, true);
        emit ActionLogged(user1, FINGERPRINT_1, TEST_VALUE_1);

        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);

        // Verify data was stored correctly
        (uint256 totalValue, uint256 transactionCount) = tracker.getFingerprintData(FINGERPRINT_1);
        assertEq(totalValue, TEST_VALUE_1);
        assertEq(transactionCount, 1);
        assertEq(tracker.getTotalFingerprints(), 1);
        assertEq(tracker.getContractBalance(), TEST_VALUE_1);
        assertTrue(tracker.fingerprintExists(FINGERPRINT_1));

        vm.stopPrank();
    }

    function testSubmitActionMultipleTimes() public {
        vm.startPrank(user1);

        // Submit first action
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);

        // Submit second action with same fingerprint
        tracker.submitAction{value: TEST_VALUE_2}(FINGERPRINT_1);

        // Verify accumulated data
        (uint256 totalValue, uint256 transactionCount) = tracker.getFingerprintData(FINGERPRINT_1);
        assertEq(totalValue, TEST_VALUE_1 + TEST_VALUE_2);
        assertEq(transactionCount, 2);
        assertEq(tracker.getTotalFingerprints(), 1); // Still only one unique fingerprint

        vm.stopPrank();
    }

    function testSubmitActionMultipleFingerprints() public {
        vm.startPrank(user1);

        // Submit actions with different fingerprints
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);
        tracker.submitAction{value: TEST_VALUE_2}(FINGERPRINT_2);

        // Verify data for first fingerprint
        (uint256 totalValue1, uint256 transactionCount1) = tracker.getFingerprintData(FINGERPRINT_1);
        assertEq(totalValue1, TEST_VALUE_1);
        assertEq(transactionCount1, 1);

        // Verify data for second fingerprint
        (uint256 totalValue2, uint256 transactionCount2) = tracker.getFingerprintData(FINGERPRINT_2);
        assertEq(totalValue2, TEST_VALUE_2);
        assertEq(transactionCount2, 1);

        assertEq(tracker.getTotalFingerprints(), 2);

        vm.stopPrank();
    }

    function testSubmitActionFromDifferentUsers() public {
        // User1 submits action
        vm.prank(user1);
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);

        // User2 submits action with same fingerprint
        vm.prank(user2);
        tracker.submitAction{value: TEST_VALUE_2}(FINGERPRINT_1);

        // Verify accumulated data (same fingerprint, different users)
        (uint256 totalValue, uint256 transactionCount) = tracker.getFingerprintData(FINGERPRINT_1);
        assertEq(totalValue, TEST_VALUE_1 + TEST_VALUE_2);
        assertEq(transactionCount, 2);
        assertEq(tracker.getTotalFingerprints(), 1);
    }

    function testSubmitActionInvalidFingerprint() public {
        vm.startPrank(user1);

        // Test with zero hash
        vm.expectRevert(TrackerContract.TrackerContract__InvalidFingerprintHash.selector);
        tracker.submitAction{value: TEST_VALUE_1}(ZERO_HASH);

        vm.stopPrank();
    }

    function testSubmitActionInsufficientValue() public {
        vm.startPrank(user1);

        // Test with value less than minimum amount (0.001 ETH)
        uint256 insufficientAmount = 0.0005 ether; // Less than 0.001 ETH
        vm.expectRevert(TrackerContract.TrackerContract__NotEnoughEthRecievedWithTransaction.selector);
        tracker.submitAction{value: insufficientAmount}(FINGERPRINT_1);

        // Test with very small amount
        vm.expectRevert(TrackerContract.TrackerContract__NotEnoughEthRecievedWithTransaction.selector);
        tracker.submitAction{value: 1 wei}(FINGERPRINT_1);

        // Test with amount just below minimum
        uint256 justBelowMinimum = tracker.MINIMUM_AMOUNT() - 1;
        vm.expectRevert(TrackerContract.TrackerContract__NotEnoughEthRecievedWithTransaction.selector);
        tracker.submitAction{value: justBelowMinimum}(FINGERPRINT_1);

        vm.stopPrank();
    }

    function testSubmitActionExactMinimumAmount() public {
        vm.startPrank(user1);

        // Test with exact minimum amount should succeed
        uint256 exactMinimum = tracker.MINIMUM_AMOUNT();

        vm.expectEmit(true, false, false, true);
        emit ActionLogged(user1, FINGERPRINT_1, exactMinimum);

        tracker.submitAction{value: exactMinimum}(FINGERPRINT_1);

        // Verify transaction succeeded
        (uint256 totalValue, uint256 transactionCount) = tracker.getFingerprintData(FINGERPRINT_1);
        assertEq(totalValue, exactMinimum);
        assertEq(transactionCount, 1);

        vm.stopPrank();
    }

    function testGetAllFingerprintHashes() public {
        vm.startPrank(user1);

        // Initially empty
        bytes32[] memory hashes = tracker.getAllFingerprintHashes();
        assertEq(hashes.length, 0);

        // Add fingerprints
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);
        tracker.submitAction{value: TEST_VALUE_2}(FINGERPRINT_2);

        // Verify array contains both hashes
        hashes = tracker.getAllFingerprintHashes();
        assertEq(hashes.length, 2);
        assertEq(hashes[0], FINGERPRINT_1);
        assertEq(hashes[1], FINGERPRINT_2);

        vm.stopPrank();
    }

    function testWithdrawFunds() public {
        // Add some funds to contract
        vm.prank(user1);
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);

        uint256 initialBalance = owner.balance;
        uint256 contractBalance = tracker.getContractBalance();

        // Withdraw funds as owner
        vm.expectEmit(true, false, false, true);
        emit FundsWithdrawn(owner, contractBalance);

        tracker.withdrawFunds();

        // Verify funds were transferred
        assertEq(tracker.getContractBalance(), 0);
        assertEq(owner.balance, initialBalance + contractBalance);
    }

    function testWithdrawFundsNotOwner() public {
        // Add some funds to contract
        vm.prank(user1);
        tracker.submitAction{value: TEST_VALUE_1}(FINGERPRINT_1);

        // Try to withdraw as non-owner
        vm.startPrank(user1);
        vm.expectRevert(TrackerContract.TrackerContract__OnlyOwnerCanCallThisFunction.selector);
        tracker.withdrawFunds();
        vm.stopPrank();
    }

    function testWithdrawFundsNoBalance() public {
        // Try to withdraw with no balance
        vm.expectRevert(TrackerContract.TrackerContract__NoFundsToWithdraw.selector);
        tracker.withdrawFunds();
    }

    function testFuzzSubmitAction(bytes32 fingerprintHash, uint256 value) public {
        // Skip invalid inputs
        vm.assume(fingerprintHash != bytes32(0));
        vm.assume(value >= tracker.MINIMUM_AMOUNT() && value <= 100 ether);

        vm.deal(user1, value);

        vm.prank(user1);
        tracker.submitAction{value: value}(fingerprintHash);

        (uint256 totalValue, uint256 transactionCount) = tracker.getFingerprintData(fingerprintHash);
        assertEq(totalValue, value);
        assertEq(transactionCount, 1);
        assertEq(tracker.getContractBalance(), value);
    }

    receive() external payable {}
}