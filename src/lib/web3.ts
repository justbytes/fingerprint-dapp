import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from '@reown/appkit/networks';

// ReOwn Project ID for wallet connect
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'Web3 Tracker DApp',
  description: 'Track user transactions on-chain linked to device fingerprints',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Create wagmi adapter first
export const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia], // Only testnet is set
  projectId,
  ssr: true,
});

// Create modal with minimal config to avoid type issues
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'discord'],
    emailShowWallets: true,
  },
});

export { baseSepolia };
