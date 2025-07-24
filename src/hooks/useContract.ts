import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_CONFIG, TRANSACTION_VALUE } from '../lib/contracts';

export interface FingerprintData {
  totalValue: bigint;
  transactionCount: bigint;
}

export interface UseSubmitActionResult {
  submitAction: (fingerprintHash: `0x${string}`) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
  reset: () => void;
}

/**
 * Calls the submitAction function on the TrackerContract
 */
export function useSubmitAction(): UseSubmitActionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Makes the call to TrackerContract submitAction()
  const submitAction = async (fingerprintHash: `0x${string}`) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      // Write to contract
      const hash = await writeContractAsync({
        ...CONTRACT_CONFIG,
        functionName: 'submitAction',
        args: [fingerprintHash],
        value: parseEther(TRANSACTION_VALUE),
      });

      setTxHash(hash);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err?.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Resets state
  const reset = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
    setTxHash(null);
  };

  return {
    submitAction,
    isLoading,
    isSuccess,
    error,
    txHash,
    reset,
  };
}

/**
 * Gets the fingerprint hashs from the TracerContract
 */
export function useFingerprintData(fingerprintHash: `0x${string}` | undefined) {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getFingerprintData',
    args: fingerprintHash ? [fingerprintHash] : undefined,
    query: {
      enabled: !!fingerprintHash,
    },
  });
}

/**
 * Gets the current balance of the TrackerContract
 */
export function useContractBalance() {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getContractBalance',
  });
}

/**
 * Gets the total amount of fingerprints from TrackerContract
 */
export function useTotalFingerprints() {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getTotalFingerprints',
  });
}

/**
 * Gets the transaction hash receipt
 */
export function useTransactionReceipt(hash: `0x${string}` | null) {
  return useWaitForTransactionReceipt({
    hash: hash || undefined,
    query: {
      enabled: !!hash,
    },
  });
}
