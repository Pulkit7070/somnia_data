# Example: Detecting Infinite Approvals

This example shows how to use the Policy Engine to detect and block infinite token approvals.

## Scenario

A user attempts to approve unlimited spending to a new, unverified contract. The Smart Wallet Copilot should:

1. Detect the infinite approval
2. Check if the spender is trusted
3. Block the transaction if untrusted
4. Show a clear warning to the user

## Code Implementation

### 1. Define the Transaction

```typescript
import { Transaction } from "@swc/shared";

const transaction: Transaction = {
  from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  to: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC token
  data:
    "0x095ea7b3" + // approve() function signature
    "000000000000000000000000NewUntrustedContract" + // spender (padded)
    "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // amount (infinite)
  gas: "50000",
  gasPrice: "25000000000", // 25 Gwei
  chainId: 50311,
};
```

### 2. Set Up Policy Context

```typescript
import { PolicyContext, ContractInfo } from "@swc/shared";

const context: PolicyContext = {
  currentBlock: 12345678,
  currentTimestamp: Date.now(),
  watchedContracts: new Set([
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router (trusted)
  ]),
  blacklistedAddresses: new Set(["0xMaliciousAddress123..."]),
  userThresholds: {
    maxTransferAmount: "1000000000000000000000", // 1000 ETH (in wei)
    maxApprovalAmount: "1000000000000000000000000", // 1M tokens
    minContractAge: 7 * 24 * 60 * 60, // 7 days in seconds
    gasLimitWarning: 500000,
  },
  contractCache: new Map<string, ContractInfo>(),
  historicalData: {
    gasHistory: [],
    tokenVolumes: new Map(),
    contractEvents: new Map(),
  },
};

// Add info about the spender contract (new, unverified)
context.contractCache.set("0xnewuntrustedcontract", {
  address: "0xNewUntrustedContract",
  name: "Unknown Contract",
  verified: false,
  createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  paused: false,
  upgradeable: false,
});
```

### 3. Evaluate with Policy Engine

```typescript
import { PolicyEngine, infiniteApprovalRule } from "@swc/policy-engine";

// Initialize engine
const engine = new PolicyEngine({
  autoBlock: true,
  enabledRules: ["infinite-approval-001"],
  parallelExecution: false,
});

// Register the infinite approval rule
engine.registerRule(infiniteApprovalRule);

// Evaluate the transaction
const result = await engine.evaluateTransaction(transaction, context);

console.log("Evaluation Result:", result);
```

### 4. Expected Output

```typescript
{
  allowed: false, // Transaction blocked
  riskLevel: 'HIGH',
  triggeredRules: [
    {
      rule: {
        id: 'infinite-approval-001',
        name: 'Infinite Approval Detection',
        riskLevel: 'HIGH',
      },
      result: {
        triggered: true,
        suggestedAction: 'block',
        evidence: {
          spender: '0xNewUntrustedContract',
          amount: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
          token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          isInfinite: true,
          contractInfo: {
            address: '0xNewUntrustedContract',
            verified: false,
            createdAt: 1706140800000,
          },
        },
        message: 'DANGER: You are about to approve infinite spending to an unknown contract...',
      },
    },
  ],
  alerts: [
    {
      type: 'ALERT.RISK_DETECTED',
      level: 'HIGH',
      ruleId: 'infinite-approval-001',
      ruleName: 'Infinite Approval Detection',
      description: 'DANGER: You are about to approve infinite spending...',
      evidence: { /* ... */ },
      suggestedAction: 'block',
      transaction: { /* ... */ },
      overridable: true,
      timestamp: 1706227200000,
    },
  ],
  recommendations: [
    'Do not proceed with this transaction (Infinite Approval Detection)',
  ],
}
```

### 5. Display Alert to User

```typescript
import { Alert, RiskDetectedAlert } from "@swc/shared";

function displayAlert(alert: RiskDetectedAlert) {
  // Show modal in extension UI
  const modal = document.createElement("div");
  modal.className = "alert-modal risk-high";
  modal.innerHTML = `
    <div class="alert-header">
      <h2>⚠️ ${alert.ruleName}</h2>
    </div>
    <div class="alert-body">
      <p>${alert.description}</p>
      
      <div class="evidence">
        <h3>📋 Evidence</h3>
        <ul>
          <li>Contract: ${alert.evidence.spender}</li>
          <li>Amount: ∞ (Infinite)</li>
          <li>Verified: ❌ No</li>
          <li>Age: 2 days</li>
        </ul>
      </div>
      
      <div class="recommendation">
        <h3>💡 Recommendation</h3>
        <p>Approve a specific amount instead of unlimited, or verify the contract source code.</p>
      </div>
    </div>
    <div class="alert-actions">
      <button class="btn-secondary" onclick="viewDetails()">🔍 View Details</button>
      <button class="btn-danger" onclick="blockTransaction()">⛔ Block Transaction</button>
      <button class="btn-warning" onclick="override()">⚠️ Override (Not Recommended)</button>
    </div>
  `;

  document.body.appendChild(modal);
}

function blockTransaction() {
  // Reject MetaMask request
  window.ethereum.request({
    method: "wallet_rejectRequest",
    params: [
      {
        /* ... */
      },
    ],
  });
}

function override() {
  // Show override confirmation
  const confirmed = confirm(
    "Are you absolutely sure you want to proceed? This could allow the contract to steal all your tokens."
  );

  if (confirmed) {
    // Log override for audit trail
    logOverride(
      transaction,
      "User explicitly overrode infinite approval warning"
    );

    // Allow transaction to proceed
    allowTransaction();
  }
}
```

## Testing

```typescript
// tests/examples/infinite-approval.test.ts
import { PolicyEngine, infiniteApprovalRule } from "@swc/policy-engine";
import { Transaction, PolicyContext } from "@swc/shared";

describe("Infinite Approval Detection Example", () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine({
      autoBlock: true,
      enabledRules: ["infinite-approval-001"],
      parallelExecution: false,
    });
    engine.registerRule(infiniteApprovalRule);
  });

  it("should block infinite approval to unknown contract", async () => {
    const tx: Transaction = {
      from: "0x1234...",
      to: "0xTokenAddress",
      data: "0x095ea7b3" + "spender" + "f".repeat(64),
    };

    const context: PolicyContext = {
      currentBlock: 123,
      currentTimestamp: Date.now(),
      watchedContracts: new Set(),
      blacklistedAddresses: new Set(),
      userThresholds: {
        maxTransferAmount: "1000000000000000000000",
        maxApprovalAmount: "1000000000000000000000000",
        minContractAge: 7 * 24 * 60 * 60,
        gasLimitWarning: 500000,
      },
      contractCache: new Map(),
      historicalData: {
        gasHistory: [],
        tokenVolumes: new Map(),
        contractEvents: new Map(),
      },
    };

    const result = await engine.evaluateTransaction(tx, context);

    expect(result.allowed).toBe(false);
    expect(result.riskLevel).toBe("HIGH");
    expect(result.triggeredRules).toHaveLength(1);
    expect(result.alerts[0].suggestedAction).toBe("block");
  });

  it("should warn (not block) for infinite approval to trusted contract", async () => {
    const trustedRouter = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

    const tx: Transaction = {
      from: "0x1234...",
      to: "0xTokenAddress",
      data:
        "0x095ea7b3" +
        trustedRouter.slice(2).padStart(64, "0") +
        "f".repeat(64),
    };

    const context: PolicyContext = {
      // ... same as above
      watchedContracts: new Set([trustedRouter]),
    };

    const result = await engine.evaluateTransaction(tx, context);

    // Should not trigger for trusted contract
    expect(result.triggeredRules).toHaveLength(0);
  });
});
```

## Expected User Experience

1. **User initiates approval** on a dApp
2. **MetaMask popup appears** with transaction details
3. **Smart Wallet Copilot intercepts** and evaluates
4. **Alert modal appears** over MetaMask with:
   - Clear warning message
   - Evidence (contract address, amount, verification status)
   - Recommended actions
5. **User makes decision:**
   - Block → Transaction rejected, modal closes
   - Override → Secondary confirmation, then proceeds
   - View Details → Opens contract info page

## Integration with MetaMask SDK

```typescript
// packages/background/src/services/metamask-interceptor.ts
import MMSDK from "@metamask/sdk";
import { PolicyEngine } from "@swc/policy-engine";

const sdk = new MMSDK({
  dappMetadata: {
    name: "Smart Wallet Copilot",
    url: "https://smartwalletcopilot.io",
  },
});

const provider = await sdk.connect();

// Intercept transaction requests
const originalRequest = provider.request.bind(provider);
provider.request = async (args) => {
  if (args.method === "eth_sendTransaction") {
    const tx = args.params[0];

    // Evaluate with policy engine
    const evaluation = await policyEngine.evaluateTransaction(tx, context);

    if (!evaluation.allowed) {
      // Emit alert to UI
      chrome.runtime.sendMessage({
        type: "ALERT.RISK_DETECTED",
        payload: evaluation.alerts[0],
      });

      // Wait for user decision
      const decision = await waitForUserDecision();

      if (decision === "block") {
        throw new Error("Transaction blocked by Smart Wallet Copilot");
      }
    }
  }

  return originalRequest(args);
};
```

## Next Steps

- See [Gas Prediction Example](./gas-prediction-example.md)
- See [Contract State Monitoring Example](./contract-monitoring-example.md)
- Read [Policy Engine Documentation](../docs/POLICY_ENGINE.md)

---

**Note:** This is a simplified example. Production implementation includes additional error handling, logging, and UX considerations.
