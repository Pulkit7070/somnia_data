# Testing Guide

## Extension Installation

1. **Build the extension:**

   ```bash
   npm run build
   ```

2. **Load in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder (c:\Users\Asus\Desktop\projects\somnia_data\extension)

3. **Verify Installation:**
   - Extension icon should appear in Chrome toolbar
   - Click icon to open popup
   - Should see clean GitHub-style dark theme (NO emojis, NO gradients)
   - Should show "Disconnected" status

## Test Wallet Connection

1. **Install MetaMask:**

   - Install MetaMask extension if not already installed
   - Create or import a wallet

2. **Connect Wallet:**
   - Click "Connect Wallet" button in extension popup
   - MetaMask prompt should appear
   - Approve the connection
   - Extension should show "Connected" status with green dot

## Deploy Test Contracts

### Setup Local Network

1. **Terminal 1 - Start local Hardhat node:**

   ```bash
   cd contracts
   npm install
   npx hardhat node
   ```

   This runs a local blockchain on `http://127.0.0.1:8545` (chain ID 31337)

2. **Terminal 2 - Deploy contracts:**

   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network localhost
   ```

   **Expected output:**

   ```
   Deploying test contracts to localhost...
   TestToken deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   MaliciousContract deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   UpgradeableToken deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
   SimpleSwap deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
   ```

3. **Add Local Network to MetaMask:**

   - MetaMask → Networks → Add Network
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

4. **Import Test Account:**
   - Copy private key from Hardhat node output (Account #0)
   - MetaMask → Import Account → paste private key
   - Account should have 10000 ETH

## Test Extension Features

### 1. Test Watchlist

**Add Contract:**

- Open extension → click "Watchlist" tab
- Click "+ Add" button
- Paste TestToken address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Label: "Test Token"
- Click "Add to Watchlist"
- Contract should appear in list with "Active" status

**Verify Monitoring:**

- Dashboard should show "Monitoring 1 contract"
- Click contract in watchlist to see details

### 2. Test Transaction Categorization

**Approval Transaction:**

```javascript
// In browser console or Remix
const testToken = await ethers.getContractAt(
  "TestToken",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);
await testToken.approve(
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  ethers.parseEther("100")
);
```

- Extension should categorize as "approval" transaction
- Check History tab for transaction record

**Transfer Transaction:**

```javascript
await testToken.transfer(
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  ethers.parseEther("10")
);
```

- Should categorize as "transfer"
- Should show value in ETH

### 3. Test Risk Detection

**Add Malicious Contract:**

- Watchlist → Add Contract
- Address: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- Label: "Malicious Contract"

**Trigger High-Risk Functions:**

```javascript
const malicious = await ethers.getContractAt(
  "MaliciousContract",
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
);

// Transfer ownership (should trigger alert)
await malicious.transferOwnership("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

// Withdraw all funds (should trigger high risk)
await malicious.withdrawAll();

// Destroy contract (should trigger critical alert)
await malicious.destroy();
```

**Expected Behavior:**

- Extension should detect ownership transfer pattern
- Should warn about withdrawAll function
- Should block or alert on selfdestruct pattern
- Risk score should decrease

### 4. Test Gas Prediction

**Monitor Gas Prices:**

- Dashboard should show "Gas Tracker" card
- Current gas price in Gwei
- Trend indicator (↑/↓/→)
- Confidence percentage with progress bar

**Verify Updates:**

- Gas data should update every 5 seconds
- Trend should change based on network activity

### 5. Test DEX Swap

**Add Liquidity:**

```javascript
const swap = await ethers.getContractAt(
  "SimpleSwap",
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
);
const testToken = await ethers.getContractAt(
  "TestToken",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);

// Approve tokens
await testToken.approve(swap.address, ethers.parseEther("1000"));

// Add liquidity
await swap.addLiquidity(ethers.parseEther("100"), {
  value: ethers.parseEther("1"),
});
```

- Should categorize as "liquidity-add"

**Execute Swap:**

```javascript
// Swap ETH for tokens
await swap.swapETHForTokens(ethers.parseEther("1"), {
  value: ethers.parseEther("0.1"),
});
```

- Should categorize as "swap" transaction
- Should show token amounts

### 6. Test Upgradeable Contract

**Check Upgrade Detection:**

```javascript
const upgradeable = await ethers.getContractAt(
  "UpgradeableToken",
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
);

// Upgrade to new implementation (requires new implementation contract first)
// await upgradeable.upgradeTo(newImplementationAddress);
```

- Extension should detect UUPS proxy pattern
- Should alert on upgrade attempts

## Test Settings

1. **Risk Tolerance:**

   - Settings → Risk Management
   - Toggle between Conservative/Balanced/Aggressive
   - Verify changes affect transaction blocking

2. **Auto-Block:**

   - Enable "Auto-block risky transactions"
   - Try to execute malicious contract function
   - Should be blocked automatically

3. **Notifications:**

   - Enable "Contract state changes"
   - Enable "Large transfers"
   - Trigger events and verify alerts

4. **Thresholds:**
   - Set "Max Transfer Amount" to 100 ETH
   - Try to transfer 150 ETH
   - Should trigger warning

## Expected UI Appearance

### Theme Characteristics:

- **Background:** Dark (#0D1117)
- **Surface:** Darker gray (#161B22)
- **Borders:** Subtle gray (#30363D)
- **Primary:** Blue (#2F81F7)
- **Text:** White (#E6EDF3) with gray hierarchy
- **Status:** Green (success), Red (error), Yellow (warning)

### NO Emojis Anywhere:

- ✅ Category badges use text only
- ✅ Status indicators use dots
- ✅ Icons are minimal SVG shapes
- ✅ Clean typography throughout

### NO Gradients:

- ✅ Solid background colors
- ✅ Simple cards with borders
- ✅ Flat button styles
- ✅ Progress bars with solid fills

## Troubleshooting

### Extension Won't Load:

- Check Developer mode is enabled
- Verify manifest.json exists in extension folder
- Check browser console for errors

### Wallet Won't Connect:

- Ensure MetaMask is installed
- Check site permissions in MetaMask
- Reload extension after changes

### Contracts Won't Deploy:

- Verify Hardhat node is running
- Check terminal for error messages
- Ensure you have local ETH balance

### Transactions Fail:

- Check MetaMask is on correct network (localhost:8545)
- Verify contract addresses are correct
- Ensure gas settings are reasonable

## Success Criteria

✅ Extension loads with clean minimal UI (no emojis, no gradients)
✅ Wallet connection works (MetaMask popup appears)
✅ Contracts deploy successfully to local network
✅ Watchlist can add/remove contracts
✅ Transactions are categorized correctly
✅ Risk detection identifies malicious patterns
✅ Gas tracker shows live data
✅ History displays transaction records
✅ Settings can be configured and saved

## Next Steps

After local testing:

1. Deploy contracts to Somnia testnet
2. Configure Somnia network in MetaMask
3. Test with real testnet transactions
4. Monitor performance and accuracy
5. Iterate on UI/UX based on feedback
