'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useVisitorData } from '@fingerprintjs/fingerprintjs-pro-react';
import {
  useSubmitAction,
  useFingerprintData,
  useContractBalance,
  useTotalFingerprints,
  useTransactionReceipt,
} from 'src/hooks/useContract';
import { getFingerprintHash } from 'src/lib/fingerprint';
import { logTransaction, getFingerprintByHash } from 'src/lib/api';
import { formatEther } from 'viem';
import {
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Fingerprint,
  Wallet,
  Activity,
} from 'lucide-react';

export function TrackerDApp() {
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const { data: visitorData, isLoading: fingerprintLoading } = useVisitorData();

  const [fingerprintHash, setFingerprintHash] = useState<`0x${string}` | undefined>();
  const [showApiCall, setShowApiCall] = useState(false);
  const [apiCallStatus, setApiCallStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Wallet data from backend
  const [walletData, setWalletData] = useState<any>(null);
  const [walletDataLoading, setWalletDataLoading] = useState(false);
  const [walletDataError, setWalletDataError] = useState<string | null>(null);

  const {
    submitAction,
    isLoading: isSubmitting,
    isSuccess,
    error,
    txHash,
    reset,
  } = useSubmitAction();

  const { data: fingerprintData } = useFingerprintData(fingerprintHash);
  const { data: contractBalance } = useContractBalance();
  const { data: totalFingerprints } = useTotalFingerprints();
  const { data: receipt } = useTransactionReceipt(txHash as `0x${string}` | null);

  // Generate fingerprint hash when visitor data is available
  useEffect(() => {
    if (visitorData?.visitorId) {
      const hash = getFingerprintHash(visitorData.visitorId);
      setFingerprintHash(hash);
    }
  }, [visitorData]);

  // Fetch wallet data when fingerprint hash is available
  useEffect(() => {
    if (isConnected && fingerprintHash) {
      fetchWalletData(fingerprintHash);
    } else {
      setWalletData(null);
      setWalletDataError(null);
    }
  }, [isConnected, fingerprintHash]);

  const fetchWalletData = async (hash: string) => {
    setWalletDataLoading(true);
    setWalletDataError(null);

    try {
      console.log('Fetching wallet data for fingerprint hash:', hash);

      const response = await getFingerprintByHash(hash);

      if (response.status === 404) {
        setWalletData(null);
        setWalletDataLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch wallet data: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      console.log('Wallet data received:', data);
      setWalletData(data.data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletDataError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setWalletDataLoading(false);
    }
  };

  // Handle successful transaction and call backend API
  useEffect(() => {
    if (
      receipt &&
      receipt.status === 'success' &&
      visitorData &&
      address &&
      txHash &&
      fingerprintHash
    ) {
      setShowApiCall(true);
      setApiCallStatus('loading');

      // Call the backend API to log the transaction using the new authenticated method
      const logTransactionToBackend = async () => {
        try {
          const requestBody = {
            fingerprintId: visitorData.visitorId,
            walletAddress: address,
            transactionHash: txHash,
            hashedFingerprint: fingerprintHash,
            timestamp: new Date().toISOString(),
          };

          console.log('Making authenticated API call to log transaction');
          console.log('Request body:', requestBody);

          const response = await logTransaction(requestBody);

          console.log('Response status:', response.status);

          const responseText = await response.text();
          console.log('Raw response:', responseText);

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              console.error('Failed to parse error response as JSON:', parseError);
              errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
          }

          let data;
          try {
            data = JSON.parse(responseText);
            console.log('Transaction logged successfully:', data);
          } catch (parseError) {
            console.error('Failed to parse success response as JSON:', parseError);
            throw new Error('Server returned invalid JSON response: ' + responseText);
          }

          setApiCallStatus('success');
          setApiError(null);

          if (fingerprintHash) {
            setTimeout(() => fetchWalletData(fingerprintHash), 1000);
          }

          setTimeout(() => {
            setShowApiCall(false);
            setApiCallStatus(null);
          }, 5000);
        } catch (error) {
          console.error('Error logging transaction:', error);
          setApiCallStatus('error');
          setApiError(error instanceof Error ? error.message : 'Unknown error occurred');

          setTimeout(() => {
            setShowApiCall(false);
            setApiCallStatus(null);
            setApiError(null);
          }, 8000);
        }
      };

      logTransactionToBackend();
    }
  }, [receipt, visitorData, address, txHash, fingerprintHash]);
  const handleSubmitAction = async () => {
    if (!fingerprintHash) return;

    reset();
    setShowApiCall(false);
    setApiCallStatus(null);
    setApiError(null);
    await submitAction(fingerprintHash);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Web3 Tracker DApp</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track user transactions on-chain linked to device fingerprints using Fingerprint.com
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          {!isConnected ? (
            <button
              onClick={() => open()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => open()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </button>
              <button
                onClick={() => open({ view: 'Account' })}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Account
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fingerprint Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Device Fingerprint</h3>
                <Fingerprint className="h-6 w-6 text-blue-500" />
              </div>
              {fingerprintLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Generating...</span>
                </div>
              ) : visitorData ? (
                <div className="space-y-2">
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Generated
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    ID: {visitorData.visitorId.slice(0, 16)}...
                  </div>
                  <div className="text-xs text-gray-500 break-all">
                    Hash: {fingerprintHash?.slice(0, 16)}...
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Failed to generate
                </div>
              )}
            </div>

            {/* Contract Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contract Stats</h3>
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Fingerprints:</span>
                  <span className="text-sm font-medium">
                    {totalFingerprints ? totalFingerprints.toString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contract Balance:</span>
                  <span className="text-sm font-medium">
                    {contractBalance ? `${formatEther(contractBalance)} ETH` : '0 ETH'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Network:</span>
                  <span className="text-sm font-medium">Base Sepolia</span>
                </div>
              </div>
            </div>

            {/* Your Fingerprint Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Data</h3>
                <Wallet className="h-6 w-6 text-purple-500" />
              </div>
              {fingerprintData ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Sent:</span>
                    <span className="text-sm font-medium">
                      {formatEther(fingerprintData[0])} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transactions:</span>
                    <span className="text-sm font-medium">{fingerprintData[1].toString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No transactions yet</div>
              )}
            </div>
          </div>

          {/* Transaction Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Submit Action (0.001 ETH)
            </h3>

            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Connect your wallet to interact with the contract
                </p>
                <button
                  onClick={() => open()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Connect Wallet
                </button>
              </div>
            ) : !fingerprintHash ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Waiting for device fingerprint...</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Transaction Button */}
                <div className="text-center">
                  <button
                    onClick={handleSubmitAction}
                    disabled={isSubmitting || !fingerprintHash}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                             text-white font-semibold py-3 px-8 rounded-lg
                             transition-colors duration-200
                             disabled:cursor-not-allowed
                             flex items-center justify-center mx-auto space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Action</span>
                    )}
                  </button>
                </div>

                {/* Transaction Status */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-700 font-medium">Transaction Failed</span>
                    </div>
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                  </div>
                )}

                {isSuccess && txHash && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-700 font-medium">Transaction Submitted</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-600 text-sm">
                        Transaction hash:
                        <a
                          href={`https://sepolia.basescan.org/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </p>
                      <p className="text-green-600 text-sm">
                        FingerprintID: {visitorData?.visitorId}
                      </p>

                      {receipt && receipt.status === 'success' && (
                        <p className="text-green-600 text-sm">
                          ✅ Transaction confirmed on blockchain
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* API Call Status */}
                {showApiCall && (
                  <div
                    className={`border rounded-lg p-4 ${
                      apiCallStatus === 'loading'
                        ? 'bg-blue-50 border-blue-200'
                        : apiCallStatus === 'success'
                        ? 'bg-green-50 border-green-200'
                        : apiCallStatus === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {apiCallStatus === 'loading' && (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-blue-700 font-medium">Logging to Backend...</span>
                        </>
                      )}
                      {apiCallStatus === 'success' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-700 font-medium">
                            Successfully Logged to Backend
                          </span>
                        </>
                      )}
                      {apiCallStatus === 'error' && (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-700 font-medium">Backend Logging Failed</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2">
                      {apiCallStatus === 'loading' && (
                        <p className="text-blue-600 text-sm">
                          Sending transaction data to backend API...
                        </p>
                      )}
                      {apiCallStatus === 'success' && (
                        <p className="text-green-600 text-sm">
                          Transaction data has been successfully stored in the backend database.
                        </p>
                      )}
                      {apiCallStatus === 'error' && (
                        <p className="text-red-600 text-sm">
                          Failed to log transaction to backend: {apiError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallet Data from Backend */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Wallet Data from Backend</h3>
              <button
                onClick={() => fingerprintHash && fetchWalletData(fingerprintHash)}
                disabled={walletDataLoading || !fingerprintHash}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {walletDataLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Connect your wallet to view backend data</p>
              </div>
            ) : walletDataLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading wallet data from backend...</p>
              </div>
            ) : walletDataError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">Error Loading Wallet Data</span>
                </div>
                <p className="text-red-600 text-sm">{walletDataError}</p>
              </div>
            ) : walletData ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Fingerprint ID</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {walletData.fingerprintId.slice(0, 8)}...
                        </p>
                      </div>
                      <Fingerprint className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Transactions</p>
                        <p className="text-lg font-semibold text-green-900">
                          {walletData.transactions ? walletData.transactions.length : 0}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">First Seen</p>
                        <p className="text-lg font-semibold text-purple-900">
                          {new Date(walletData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Fingerprint ID:</span>
                      <p className="text-gray-600 break-all mt-1">{walletData.fingerprintId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Wallet Address:</span>
                      <p className="text-gray-600 break-all mt-1">{walletData.walletAddress}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Hashed Fingerprint:</span>
                      <p className="text-gray-600 break-all mt-1">{walletData.hashedFingerprint}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <p className="text-gray-600 mt-1">
                        {new Date(walletData.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transaction History */}
                {walletData.transactions && walletData.transactions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction History ({walletData.transactions.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {walletData.transactions.map((tx: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              Transaction #{index + 1}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(tx.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>Hash:</span>
                              {tx.txHash ? (
                                <a
                                  href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                                >
                                  {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">No hash available</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Wallet:</span>
                              <span className="text-gray-600">
                                {tx.walletAddress
                                  ? `${tx.walletAddress.slice(0, 6)}...${tx.walletAddress.slice(
                                      -4
                                    )}`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No backend data found for this wallet</p>
                <p className="text-sm text-gray-500">
                  Submit a transaction to create a fingerprint record
                </p>
              </div>
            )}
          </div>

          {/* Contract Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Address:</span>
                <a
                  href={`https://sepolia.basescan.org/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                >
                  {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(0, 10)}...
                  {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.slice(-8)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Backend API:</span>
                <span className="text-blue-600">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span>Base Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connected Account:</span>
                <span className="break-all">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
