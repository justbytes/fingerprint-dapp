# Foundry Makefile for TrackerContract
# Note: Run these commands from the foundry/ directory

# Load environment variables
-include .env

# Install dependencies
.PHONY: install
install:
	@echo "📦 Installing dependencies..."
	@forge install foundry-rs/forge-std --no-commit

# Build the project
.PHONY: build
build:
	@echo "🔨 Building project..."
	@forge build

# Clean and build
.PHONY: rebuild
rebuild: clean build

# Clean build artifacts
.PHONY: clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	@forge clean
	@rm -rf cache/ out/

# Check contract size
.PHONY: size
size:
	@echo "📏 Checking contract sizes..."
	@forge build --sizes

# Run tests
.PHONY: test
test:
	@echo "🧪 Running tests..."
	@forge test -vv

# Run tests with gas reporting
.PHONY: test-gas
test-gas:
	@echo "⛽ Running tests with gas reporting..."
	@forge test --gas-report

# Run tests with coverage
.PHONY: coverage
coverage:
	@echo "📊 Generating coverage report..."
	@forge coverage --report lcov

# Run static analysis
.PHONY: analyze
analyze:
	@echo "🔍 Running static analysis..."
	@forge test --gas-report
	@echo "📊 Contract sizes:"
	@forge build --sizes

.PHONY: deploy-base-sepolia
deploy-base-sepolia:
	@echo "📦 Deploying contract to Base Sepolia network"
	@forge script foundry/script/Deploy.s.sol:DeployScript --rpc-url $(BASE_SEPOLIA_RPC_URL) --account $(WALLET_NAME) --broadcast -vvv

.PHONY: verify-base-sepolia
verify-base-sepolia:
	@echo "🔍 Verifying contract on Base Sepolia network"
	@read -p "Enter contract address: " contract_addr; \
	forge verify-contract $$contract_addr \
		foundry/src/TrackerContract.sol:TrackerContract \
		--chain base-sepolia \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		-vvv

.PHONY: withdraw-funds
withdraw-funds:
	@echo "🤑 Withdrawing test funds from TrackerContract on Base Sepolia network"
	@forge script foundry/script/Withdraw.s.sol:WithdrawScript --rpc-url $(BASE_SEPOLIA_RPC_URL) --account $(WALLET_NAME) --broadcast -vvv
