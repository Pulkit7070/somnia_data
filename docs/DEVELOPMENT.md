# Development Guide

## Quick Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode (watch)
npm run dev

# Run tests
npm run test
npm run test:e2e

# Lint code
npm run lint
```

## Package Development

### Working on a specific package

```bash
# Build specific package
npm run build --workspace=@swc/policy-engine

# Test specific package
npm run test --workspace=@swc/policy-engine

# Watch mode for development
npm run dev --workspace=@swc/shared
```

### Adding a new package

1. Create directory: `packages/my-package/`
2. Add `package.json` with package name `@swc/my-package`
3. Add `tsconfig.json` extending root config
4. Add `src/index.ts` as entry point
5. Update root `package.json` workspaces if needed

## Extension Development

### Loading in Browser

#### Chrome/Brave/Edge

1. Build extension: `npm run extension:build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `packages/ui/build`

#### Firefox

1. Build extension: `npm run extension:build`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `packages/ui/build/manifest.json`

### Hot Reload Development

```bash
# Terminal 1: Watch UI changes
npm run dev --workspace=@swc/ui

# Terminal 2: Watch background changes
npm run dev --workspace=@swc/background

# Terminal 3: Watch shared packages
npm run dev --workspace=@swc/shared
```

After making changes, click "Reload" in `chrome://extensions/` for the extension.

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- packages/policy-engine/src/engine.test.ts

# Watch mode
npm run test -- --watch
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- tests/e2e/alerts.spec.ts

# Debug mode (headed browser)
npm run test:e2e -- --debug
```

### Writing Tests

#### Unit Test Example

```typescript
// packages/policy-engine/src/rules/infinite-approval.test.ts
import { infiniteApprovalRule } from "./infinite-approval";

describe("Infinite Approval Rule", () => {
  it("should trigger for infinite approval to unknown contract", async () => {
    const tx = {
      from: "0x1234...",
      to: "0xtoken...",
      data: "0x095ea7b3000000000000000000000000spender...amount...",
    };

    const context = {
      watchedContracts: new Set(),
      blacklistedAddresses: new Set(),
      // ...
    };

    const result = await infiniteApprovalRule.evaluate(tx, context);

    expect(result.triggered).toBe(true);
    expect(result.suggestedAction).toBe("block");
  });
});
```

#### E2E Test Example

```typescript
// tests/e2e/contract-alert.spec.ts
import { test, expect } from "@playwright/test";

test("should show alert when contract is paused", async ({ page }) => {
  // Load extension
  await page.goto("http://localhost:3000/test-dapp");

  // Trigger contract interaction
  await page.click('[data-testid="swap-button"]');

  // Wait for alert
  const alert = page.locator('[data-testid="alert-modal"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("contract is paused");

  // Verify action buttons
  await expect(page.locator('button:has-text("Abort")')).toBeVisible();
  await expect(page.locator('button:has-text("Continue")')).toBeVisible();
});
```

## Debugging

### Browser DevTools

1. Load extension
2. Right-click extension icon → "Inspect popup"
3. Go to `chrome://extensions` → Click "Inspect views: background page"
4. Use Console, Network, and Sources tabs

### Logging

```typescript
import { Logger } from "@swc/shared";

const logger = new Logger("MyComponent");

logger.debug("Detailed debug info"); // LogLevel.DEBUG
logger.info("General information"); // LogLevel.INFO
logger.warn("Warning message"); // LogLevel.WARN
logger.error("Error occurred", error); // LogLevel.ERROR
```

### React DevTools

Install React DevTools browser extension to inspect component tree and state.

### Network Inspection

Monitor SDS and RPC requests:

1. Open DevTools → Network tab
2. Filter by "WS" for WebSocket (SDS)
3. Filter by "Fetch/XHR" for RPC calls

## Somnia Testnet

### RPC Configuration

```typescript
// .env
VITE_SOMNIA_RPC_URL=https://rpc-testnet.somnia.network
VITE_SOMNIA_CHAIN_ID=50311
VITE_SOMNIA_WS_URL=wss://ws-testnet.somnia.network
VITE_SDS_ENDPOINT=https://streams.somnia.network
```

### Getting Testnet Tokens

1. Join Discord: https://discord.gg/somnianetwork
2. Contact @emma_odia
3. Or use faucet: https://faucet.somnia.network

### Adding Somnia to MetaMask

```javascript
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [
    {
      chainId: "0xC497", // 50311 in hex
      chainName: "Somnia Testnet",
      nativeCurrency: { name: "Somnia", symbol: "STT", decimals: 18 },
      rpcUrls: ["https://rpc-testnet.somnia.network"],
      blockExplorerUrls: ["https://explorer-testnet.somnia.network"],
    },
  ],
});
```

## Common Development Tasks

### Adding a New Alert Type

1. Define type in `packages/shared/src/types.ts`:

```typescript
export interface MyNewAlert {
  type: AlertType.MY_NEW_ALERT;
  level: RiskLevel;
  message: string;
  // ... other fields
}
```

2. Add to Alert union type:

```typescript
export type Alert = ContractChangeAlert | MyNewAlert | ...;
```

3. Implement emitter in background service
4. Add UI handler in alert modal

### Adding a New Configuration Option

1. Update `UserPolicy` type in `packages/shared/src/types.ts`
2. Add form field in `packages/ui/src/pages/Settings.tsx`
3. Update storage schema if needed
4. Add validation logic

### Updating SDS Schema

1. Define schema string in `packages/shared/src/types.ts`:

```typescript
export const SCHEMA_DEFINITIONS = {
  MY_NEW_SCHEMA: `field1 type1, field2 type2, ...`,
};
```

2. Add TypeScript interface:

```typescript
export interface MyNewSchemaEvent {
  field1: type1;
  field2: type2;
}
```

3. Subscribe in background service:

```typescript
subscriptionManager.subscribeToSchema(
  SCHEMA_DEFINITIONS.MY_NEW_SCHEMA,
  (event) => handleMyNewEvent(event)
);
```

## Build & Release

### Development Build

```bash
npm run build
```

Output: `packages/*/dist/`

### Production Build

```bash
NODE_ENV=production npm run build
npm run extension:build
```

Output: `packages/ui/build/` (ready for browser store)

### Creating a Release

1. Update version: `package.json`, `CHANGELOG.md`
2. Commit: `git commit -m "chore: release v0.2.0"`
3. Tag: `git tag v0.2.0`
4. Push: `git push && git push --tags`
5. CI builds and creates GitHub release

### Browser Store Submission

#### Chrome Web Store

1. Zip `packages/ui/build/`
2. Upload to Chrome Web Store Developer Dashboard
3. Fill in store listing
4. Submit for review

#### Firefox Add-ons

1. Zip `packages/ui/build/`
2. Upload to addons.mozilla.org
3. Submit for review

## Performance Optimization

### Bundle Size Analysis

```bash
# Install analyzer
npm install --save-dev webpack-bundle-analyzer

# Run build with analyzer
npm run build -- --analyze
```

### Profiling

Use Chrome DevTools Performance tab:

1. Record interaction
2. Analyze flame graph
3. Identify bottlenecks

### Memory Leaks

Use Chrome DevTools Memory tab:

1. Take heap snapshot
2. Perform action
3. Take another snapshot
4. Compare allocations

## Troubleshooting

### Extension Not Loading

- Check manifest.json syntax
- Verify all required files exist
- Check Console for errors
- Try reloading extension

### SDS Connection Issues

- Verify endpoint URL
- Check network connectivity
- Verify API key (if required)
- Check firewall/proxy settings

### Build Errors

- Clear caches: `npm run clean && rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build -- --verbose`
- Verify all packages built: `turbo run build --force`

### Test Failures

- Check test environment setup
- Verify mocks are correct
- Run single test to isolate: `npm run test -- path/to/test.ts`
- Check for async timing issues

## Resources

- [Somnia Docs](https://docs.somnia.network)
- [MetaMask SDK Docs](https://docs.metamask.io/sdk/)
- [Viem Docs](https://viem.sh)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

- **Discord:** https://discord.gg/somnianetwork
- **GitHub Issues:** Report bugs or request features
- **GitHub Discussions:** Ask questions

---

Happy coding! 🚀
