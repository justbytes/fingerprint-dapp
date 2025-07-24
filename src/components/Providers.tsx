'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FpjsProvider } from '@fingerprintjs/fingerprintjs-pro-react';
import { WagmiProvider, type Config } from 'wagmi';
import { wagmiAdapter } from 'src/lib/web3';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const fingerprintApiKey = process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_KEY;

  if (!fingerprintApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-red-500">
            Missing Fingerprint.com API key. Please check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <FpjsProvider
          loadOptions={{
            apiKey: fingerprintApiKey,
            region: 'us',
          }}
        >
          {children}
        </FpjsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
