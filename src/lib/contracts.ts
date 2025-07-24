import { Address } from 'viem';

// Contract ABI for the TracerContract
export const TRACKER_CONTRACT_ABI = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'fingerprintData',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'totalValue', type: 'uint256', internalType: 'uint256' },
      { name: 'transactionCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'fingerprintExists',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'fingerprintHashes',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAllFingerprintHashes',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]', internalType: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getContractBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getFingerprintData',
    inputs: [{ name: 'fingerprintHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'totalValue', type: 'uint256', internalType: 'uint256' },
      { name: 'transactionCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalFingerprints',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'submitAction',
    inputs: [{ name: 'fingerprintHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'withdrawFunds',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'ActionLogged',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      {
        name: 'fingerprintHash',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'FundsWithdrawn',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  { type: 'error', name: 'TrackerContract__InvalidFingerprintHash', inputs: [] },
  { type: 'error', name: 'TrackerContract__NoEthRecievedWithTransaction', inputs: [] },
  { type: 'error', name: 'TrackerContract__NoFundsToWithdraw', inputs: [] },
  { type: 'error', name: 'TrackerContract__OnlyOwnerCanCallThisFunction', inputs: [] },
  { type: 'error', name: 'TrackerContract__WithdrawalFailed', inputs: [] },
] as const;

// Contract configuration
export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address,
  abi: TRACKER_CONTRACT_ABI,
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532'),
} as const;

// ETH amount to send with each transaction
export const TRANSACTION_VALUE = '0.001';
