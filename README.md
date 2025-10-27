# Web3 Copilot Extension

A VS Code extension and Hardhat toolkit for analyzing, monitoring, and optimizing smart contract deployments on Ethereum networks.

## Overview

Web3 Copilot Extension combines a VS Code extension with a comprehensive Hardhat sample project to provide developers with powerful tools for:

- **Smart Contract Analysis**: Automated security analysis using Slither
- **Gas Optimization**: Detailed gas usage reporting and comparison
- **Contract Interaction Tracking**: Monitor and analyze contract interactions across deployments
- **Network Deployment**: Easy deployment to Ethereum Sepolia testnet and localhost
- **Data Analysis**: Statistical analysis of contract metrics and performance

## Project Structure

```
web3-copilot-extension/
├── extension/                    # VS Code Extension
│   ├── src/
│   │   └── extension.ts         # Extension entry point
│   ├── package.json             # Extension dependencies
│   └── tsconfig.json
│
├── sample-hardhat/              # Hardhat Project Sample
│   ├── contracts/
│   │   └── ERC20.sol            # Sample token contract
│   ├── scripts/
│   │   ├── deploy.js            # Deployment script
│   │   ├── interact.js          # Contract interaction script
│   │   ├── run_slither.sh       # Security analysis script
│   │   └── run_evaluation.sh    # Performance evaluation
│   ├── test/
│   │   └── testERC20.js         # Contract tests
│   ├── analysis/
│   │   └── compute_stats.ipynb  # Statistical analysis notebook
│   ├── reports/                 # Generated reports
│   ├── deployments/             # Deployment artifacts
│   ├── hardhat.config.js        # Hardhat configuration
│   ├── package.json             # Project dependencies
│   └── .env.example             # Environment variables template
│
├── diagrams/                    # Architecture documentation
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Features

### VS Code Extension
- Integration with VS Code for enhanced smart contract development
- Command palette support for quick access to tools
- Real-time feedback and diagnostics

### Hardhat Integration
- **ERC20 Token Contract**: Example token implementation
- **Multi-Network Support**: Localhost and Sepolia testnet
- **Gas Reporting**: Detailed gas consumption analysis
- **Contract Interaction Logging**: Track all function calls and state changes
- **Security Analysis**: Slither integration for vulnerability detection

### Analytics & Reporting
- **Gas Comparison**: Compare gas usage across different optimizer settings
- **Interaction Reports**: JSON-formatted interaction history
- **Statistical Analysis**: Jupyter notebooks for data exploration
- **CSV Export**: Export metrics for external analysis

## Quick Start

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Git
- VS Code (for extension features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoeDkhar/web3-copilot-extension.git
   cd web3-copilot-extension
   ```

2. **Install extension dependencies**
   ```bash
   cd extension
   npm install
   cd ..
   ```

3. **Install Hardhat project dependencies**
   ```bash
   cd sample-hardhat
   npm install
   cd ..
   ```

### Setup Environment Variables

1. **Copy the example environment file**
   ```bash
   cd sample-hardhat
   cp .env.example .env
   ```

2. **Edit `.env` with your configuration**
   ```env
   # Sepolia RPC endpoint (public or your own Infura/Alchemy key)
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   
   # Your test wallet private key (from MetaMask or similar)
   PRIVATE_KEY=your_private_key_here
   ```

   ⚠️ **IMPORTANT**: Never commit `.env` to version control!

## Usage

### Deploy Smart Contract

**To localhost (local hardhat node):**
```bash
cd sample-hardhat
npx hardhat run scripts/deploy.js --network localhost
```

**To Sepolia testnet:**
```bash
cd sample-hardhat
npx hardhat run scripts/deploy.js --network sepolia
```

### Interact with Contract

```bash
cd sample-hardhat
npx hardhat run scripts/interact.js --network localhost
```

### Run Tests

```bash
cd sample-hardhat
npx hardhat test
```

### Security Analysis (Slither)

```bash
cd sample-hardhat
bash scripts/run_slither.sh
```

### Gas Analysis

View detailed gas reports:
```bash
cd sample-hardhat
npx hardhat run scripts/deploy.js --network localhost
cat gas-report.txt
```

### Statistical Analysis

Open and run the Jupyter notebooks for in-depth analysis:
- `sample-hardhat/analysis/compute_stats.ipynb` - Summary statistics
- `sample-hardhat/analyze_gas.ipynb` - Gas optimization analysis
- `sample-hardhat/analyze_interaction_reports.ipynb` - Interaction pattern analysis

## Configuration

### Hardhat Network Configuration

Edit `sample-hardhat/hardhat.config.js` to customize:
- Network RPC URLs
- Chain IDs
- Gas reporter settings
- Optimizer settings

### Solidity Version

The sample contract uses Solidity 0.8.20. Modify in `hardhat.config.js`:
```javascript
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}
```

## Development

### Building the Extension

```bash
cd extension
npm run compile
npm run package  # Create .vsix file
```

### Running Tests

```bash
cd sample-hardhat
npm test
```

### Generate Gas Reports

The gas reporter runs automatically during deployments. View results in:
- `sample-hardhat/gas-report.txt` - Human-readable format
- `sample-hardhat/gas_comparison.csv` - Spreadsheet format

## Deployment Reports

After running deployments, reports are generated:

- **Deployed Contracts**: `sample-hardhat/deployed-contracts.json`
- **Interaction Reports**: `sample-hardhat/reports/interaction-report-[network].json`
- **Gas Comparison**: `sample-hardhat/gas_comparison_with_diff.csv`

## File Descriptions

### Sample Contract
- **`sample-hardhat/contracts/ERC20.sol`**: Standard ERC20 token with extensions for testing

### Scripts
- **`deploy.js`**: Deploys the contract and logs address
- **`interact.js`**: Performs various contract interactions and logs results
- **`run_slither.sh`**: Runs Slither security analysis
- **`run_evaluation.sh`**: Complete evaluation workflow
- **`checkBalanceAndNetwork.js`**: Verifies network connectivity and balance

### Analysis
- **`compute_stats.ipynb`**: Computes statistical summaries of metrics
- **`analyze_gas.ipynb`**: Detailed gas consumption analysis
- **`analyze_interaction_reports.ipynb`**: Interaction pattern analysis

## Security

⚠️ **Security Best Practices**

1. **Never commit `.env` file** - It's in `.gitignore` for a reason
2. **Use test networks** - Only test on Sepolia, not mainnet
3. **Test wallets only** - Use throwaway private keys for testing
4. **Review contracts** - Always audit before mainnet deployment
5. **Check balances** - Verify gas and native token balances before transactions

## Available Networks

| Network | RPC URL | Chain ID | Usage |
|---------|---------|----------|-------|
| Localhost | http://127.0.0.1:8545 | 31337 | Local development |
| Sepolia | https://ethereum-sepolia-rpc.publicnode.com | 11155111 | Testnet |

## Troubleshooting

### Gas Reporter Not Showing
Ensure `gas_reporter` is enabled in `hardhat.config.js`

### Transactions Failing
- Check network connection: `npx hardhat run scripts/checkBalanceAndNetwork.js`
- Verify account has sufficient balance
- Check private key is correct in `.env`

### Deployment Issues
- Ensure Hardhat node is running: `npx hardhat node`
- Check contract syntax: `npx hardhat compile`
- Review error messages carefully

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the sample Hardhat project

## Resources

- [Hardhat Documentation](https://hardhat.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Slither Documentation](https://github.com/crytic/slither)
- [Ethereum Development](https://ethereum.org/en/developers/)
- [Sepolia Testnet Faucet](https://www.sepoliafaucet.io/)

## Author

- **JoeDkhar** - [GitHub](https://github.com/JoeDkhar)

---

**Happy coding! 🚀**
