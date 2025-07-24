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

export function useSubmitAction(): UseSubmitActionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const submitAction = async (fingerprintHash: `0x${string}`) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

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

export function useContractBalance() {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getContractBalance',
  });
}

export function useTotalFingerprints() {
  return useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getTotalFingerprints',
  });
}

export function useTransactionReceipt(hash: `0x${string}` | null) {
  return useWaitForTransactionReceipt({
    hash: hash || undefined,
    query: {
      enabled: !!hash,
    },
  });
}
