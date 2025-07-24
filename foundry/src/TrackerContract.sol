// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TrackerContract
 * @dev A contract that tracks user actions with fingerprint hashes and accepts ETH payments
 */
contract TrackerContract {
    uint256 public constant MINIMUM_AMOUNT = 0.001 ether;

    error TrackerContract__InvalidFingerprintHash();
    error TrackerContract__NotEnoughEthRecievedWithTransaction();
    error TrackerContract__NoFundsToWithdraw();
    error TrackerContract__WithdrawalFailed();
    error TrackerContract__OnlyOwnerCanCallThisFunction();

    // Struct to store fingerprint data
    struct FingerprintData {
        uint256 totalValue;
        uint256 transactionCount;
    }

    // Mapping from fingerprint hash to data
    mapping(bytes32 => FingerprintData) public fingerprintData;

    // Array to store all unique fingerprint hashes for enumeration
    bytes32[] public fingerprintHashes;

    // Mapping to check if a fingerprint hash already exists
    mapping(bytes32 => bool) public fingerprintExists;

    // Contract owner
    address public owner;

    // Events
    event ActionLogged(address indexed user, bytes32 fingerprintHash, uint256 value);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert TrackerContract__OnlyOwnerCanCallThisFunction();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Submit an action with a fingerprint hash and ETH payment
     * @param fingerprintHash The SHA-256 hash of the fingerprint
     */
    function submitAction(bytes32 fingerprintHash) external payable {
        // Check if we have a hash
        if (fingerprintHash == bytes32(0)) {
            revert TrackerContract__InvalidFingerprintHash();
        }

        // Check if minimum amount was sent
        if (msg.value < MINIMUM_AMOUNT) {
            revert TrackerContract__NotEnoughEthRecievedWithTransaction();
        }

        // Update fingerprint data
        fingerprintData[fingerprintHash].totalValue += msg.value;
        fingerprintData[fingerprintHash].transactionCount += 1;

        // Add to array if it's a new fingerprint hash
        if (!fingerprintExists[fingerprintHash]) {
            fingerprintHashes.push(fingerprintHash);
            fingerprintExists[fingerprintHash] = true;
        }

        // Emit event
        emit ActionLogged(msg.sender, fingerprintHash, msg.value);
    }

    /**
     * @dev Get fingerprint data by hash
     * @param fingerprintHash The fingerprint hash to query
     * @return totalValue Total ETH sent for this fingerprint
     * @return transactionCount Number of transactions for this fingerprint
     */
    function getFingerprintData(bytes32 fingerprintHash)
        external
        view
        returns (uint256 totalValue, uint256 transactionCount)
    {
        FingerprintData memory data = fingerprintData[fingerprintHash];
        return (data.totalValue, data.transactionCount);
    }

    /**
     * @dev Get all fingerprint hashes
     * @return Array of all fingerprint hashes
     */
    function getAllFingerprintHashes() external view returns (bytes32[] memory) {
        return fingerprintHashes;
    }

    /**
     * @dev Get total number of unique fingerprints
     * @return Number of unique fingerprints
     */
    function getTotalFingerprints() external view returns (uint256) {
        return fingerprintHashes.length;
    }

    /**
     * @dev Get contract balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Withdraw contract funds (only owner)
     */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;

        // Make sure we have a balance in the contract
        if (balance == 0) {
            revert TrackerContract__NoFundsToWithdraw();
        }

        (bool success, ) = payable(owner).call{value: balance}("");

        // Revert if unsuccessfull
        if (!success) {
            revert TrackerContract__WithdrawalFailed();
        }

        emit FundsWithdrawn(owner, balance);
    }
}