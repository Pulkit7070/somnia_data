# Smart Wallet Copilot - Web Application

## Overview

Modern web application for blockchain security and transaction analysis on Somnia Network. Features direct wallet connection via MetaMask/WalletConnect, contract monitoring, and AI-powered transaction categorization.

## Features

- **Wallet Connection**: Direct integration with MetaMask, WalletConnect, and other Web3 wallets
- **Contract Watchlist**: Monitor smart contracts for state changes, upgrades, and ownership transfers
- **Transaction History**: View and analyze past transactions with AI categorization
- **Security Alerts**: Real-time notifications for risky transactions
- **Gas Tracking**: Monitor gas prices and optimize transaction timing
- **Multi-Network**: Support for Somnia, Ethereum Mainnet, and local networks

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2, RainbowKit, Ethers v6
- **TypeScript**: Full type safety

## Installation

```bash
cd webapp
npm install
```

## Configuration

1. **Get WalletConnect Project ID:**
   - Visit https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID

2. **Update providers.tsx:**
   ```typescript
   projectId: 'YOUR_WALLETCONNECT_PROJECT_ID'
   ```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm start
```

## Wallet Connection

The app supports multiple wallet providers:

- **MetaMask**: Browser extension
- **WalletConnect**: Mobile wallets (Trust, Rainbow, etc.)
- **Coinbase Wallet**: Coinbase integration
- **Injected**: Any Web3 browser wallet

### Add Somnia Network to MetaMask:

- **Network Name**: Somnia Testnet
- **RPC URL**: https://dream-rpc.somnia.network
- **Chain ID**: 50311
- **Currency**: STT
- **Explorer**: https://explorer-testnet.somnia.network

### Local Testing (Hardhat):

- **Network Name**: Localhost
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency**: ETH

## Testing with Deployed Contracts

Use these addresses to test the watchlist:

```
TestToken:          0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
MaliciousContract:  0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
UpgradeableToken:   0x0165878A594ca255338adfa4d48449f69242Eb8F
SimpleSwap:         0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
```

## Features Walkthrough

### 1. Connect Wallet
- Click "Connect Wallet" button in header
- Select your preferred wallet provider
- Approve connection in wallet popup
- See your balance and address displayed

### 2. Add Contract to Watchlist
- Navigate to "Watchlist" tab
- Click "+ Add Contract"
- Enter contract address (use test contracts above)
- Add optional label
- Click "Add to Watchlist"
- Contract appears in grid with monitoring status

### 3. View Transaction History
- Navigate to "History" tab
- See all transactions from connected wallet
- Each transaction shows:
  - Category (swap, transfer, approval, etc.)
  - Status (success, failed, pending)
  - Addresses involved
  - Value transferred
  - Link to block explorer

### 4. Configure Settings
- Navigate to "Settings" tab
- Set risk tolerance (conservative/balanced/aggressive)
- Enable/disable auto-blocking
- Set transaction thresholds
- Configure notifications
- Click "Save Settings"

## Architecture

```
webapp/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main app page
│   │   ├── providers.tsx      # Web3 providers config
│   │   └── globals.css        # Global styles
│   └── components/
│       ├── Dashboard.tsx      # Main dashboard
│       ├── Watchlist.tsx      # Contract monitoring
│       ├── History.tsx        # Transaction history
│       └── Settings.tsx       # User preferences
├── public/                    # Static assets
├── package.json              # Dependencies
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## Data Storage

Currently uses **localStorage** for:
- Watchlist contracts
- User settings
- Transaction history cache

**Production**: Integrate with backend API or decentralized storage (IPFS, Arweave)

## Roadmap

- [ ] Backend API integration
- [ ] Real-time contract event monitoring
- [ ] Advanced transaction simulation
- [ ] Risk scoring algorithm
- [ ] Push notifications
- [ ] Mobile responsive improvements
- [ ] Dark/Light theme toggle
- [ ] Export transaction reports

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t smart-wallet-copilot .
docker run -p 3000:3000 smart-wallet-copilot
```

### Static Export

```bash
npm run build
npm run export
# Deploy /out directory to any static host
```

## Support

- Documentation: [GitHub Wiki](https://github.com/yourusername/smart-wallet-copilot/wiki)
- Issues: [GitHub Issues](https://github.com/yourusername/smart-wallet-copilot/issues)
- Discord: [Community Server](https://discord.gg/your-server)

## License

MIT License - see LICENSE file for details
