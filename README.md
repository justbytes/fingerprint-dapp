# Fingerprint DApp

A full-stack Web3 application that tracks user transactions on-chain and links them to device fingerprints using Fingerprint.com.

Smart Contract Address: [0xA5fD4eCF04159d139f3bb129103C10aB8c6508b0](https://sepolia.basescan.org/address/0xA5fD4eCF04159d139f3bb129103C10aB8c6508b0)

Deployed with AWS:
https://fingerprinter.art

## 🚀 Features

- **Smart Contract Integration**: Solidity contract deployed on Base Sepolia testnet
- **Device Fingerprinting**: Integration with Fingerprint.com for unique device identification
- **Wallet Connection**: Support for multiple wallet providers via Reown AppKit
- **Transaction Tracking**: On-chain transaction logging with backend storage
- **RESTful API**: Backend API for fingerprint data management

### Security Features

- API secret key authentication for backend routes
- Rate limiting (50 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 🏗️ Architecture

### Smart Contract (Solidity + Foundry)

- **TrackerContract.sol**: Main contract for logging fingerprint actions
- **Minimum Payment**: 0.001 ETH per transaction
- **Data Storage**: Maps fingerprint hashes to transaction data
- **Events**: Emits `ActionLogged` events for frontend monitoring

  #### EVM Config

  The dapp is configured and deployed on Base Sepolia testnet:

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org

### Frontend (Next.js + React)

- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Web3 Integration**: Wagmi + Reown AppKit for wallet connectivity
- **Device Fingerprinting**: Fingerprint.com SDK integration
- **State Management**: React hooks for contract interactions

### Backend (Express.js + SQLite)

- **Database**: SQLite for transaction and fingerprint storage
- **Authentication**: API key-based authentication
- **Rate Limiting**: Express rate limiter for API protection
- **RESTful Endpoints**: Create and read operations for fingerprint data

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or later)
- **npm** or **yarn** package manager
- **Foundry** for smart contract development
- **Cast Wallet** imported to your local machine (required for contract deployment)

### Setting up Cast Wallet

To deploy the smart contract, you'll need to import a wallet using Foundry's `cast` command:

```bash
# Import your wallet (replace with your wallet name and private key)
cast wallet import myWallet --interactive

# Verify the wallet was imported
cast wallet list
```

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/justbytes/fingerprint-dapp.git
cd fingerprint-dapp
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install Foundry dependencies
forge install
```

### 3. Environment Configuration

Create a `.env` file in the root directory using the .env.exmaple as reference:

### 4. Get Required API Keys

#### Reown Project ID

1. Visit [Reown Cloud](https://cloud.reown.com)
2. Create a new project
3. Copy the Project ID

#### Fingerprint.com API Key

1. Sign up at [Fingerprint.com](https://fingerprint.com)
2. Get your public API key from the dashboard
3. Add to environment variables

#### BaseScan API Key

1. Visit [BaseScan](https://basescan.org)
2. Create an account and generate API key
3. Used for contract verification

## 🚀 Running the Application

### 1. Start the Backend Server

```bash
# Development mode with auto-reload
npm run backend:dev

# Production mode
npm run backend:build
npm run backend:start
```

The backend will be available at `http://localhost:3001`

### 2. Start the Frontend Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The frontend will be available at `http://localhost:3000`

## 📝 Smart Contract Development

### Building and Testing

```bash
# Build contracts
make build

# Run tests
make test

# Check contract sizes
make size
```

### Deploying to Base Sepolia

**Prerequisites**: Ensure you have a cast wallet imported and Base Sepolia ETH for gas fees.

```bash
cd foundry

# Deploy the contract
make deploy-base-sepolia

# Verify the contract (optional)
make verify-base-sepolia
```

The deployment script will output the contract address. Update your `.env` file with the new address.

### Withdrawing Test Funds

If you need to recover test ETH from the contract:

```bash
# Update the contract address in foundry/script/Withdraw.s.sol
# Then run:
make withdraw-funds
```

## 🔌 API Endpoints

### Available Endpoints

```
POST /log                              - Log new transaction
GET  /fingerprints                     - Get all fingerprints (paginated)
GET  /fingerprints/by-fingerprint-hash/:hash - Get fingerprint by hash
GET  /fingerprints/by-id/:id          - Get fingerprint by ID
GET  /health                          - Health check endpoint
```

## 🔗 Useful Links

- [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)
- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Fingerprint.com Documentation](https://dev.fingerprint.com)
- [Foundry Documentation](https://book.getfoundry.sh)
- [Reown AppKit Documentation](https://docs.reown.com/appkit)
