# Smart Wallet Copilot - Technical Architecture

## System Overview

The Smart Wallet Copilot is a reactive browser extension that enhances Web3 wallet security through real-time monitoring, risk detection, and predictive insights for Somnia blockchain transactions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER EXTENSION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        UI LAYER                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │  Alerts  │  │ Settings │  │ Watchlist│  │  History │    │  │
│  │  │  Modal   │  │   Page   │  │  Manager │  │   View   │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │  │
│  │           │            │            │            │           │  │
│  │           └────────────┴────────────┴────────────┘           │  │
│  │                           │                                   │  │
│  │                    Message Bus (IPC)                         │  │
│  └────────────────────────────┬─────────────────────────────────┘  │
│                                │                                     │
│  ┌────────────────────────────▼─────────────────────────────────┐  │
│  │                    BACKGROUND AGENT                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │ SDS Stream   │  │   Policy     │  │  Gas Predictor   │  │  │
│  │  │  Listener    │  │   Engine     │  │                  │  │  │
│  │  │              │  │              │  │                  │  │  │
│  │  │ - Contract   │  │ - Rules      │  │ - Trend Analysis │  │  │
│  │  │   Watcher    │  │ - Risk       │  │ - Mempool Data   │  │  │
│  │  │ - Token      │  │   Scoring    │  │ - Predictions    │  │  │
│  │  │   Monitor    │  │ - Auto-block │  │                  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │ Transaction  │  │   Trending   │  │  Event Processor │  │  │
│  │  │ Categorizer  │  │   Detector   │  │                  │  │  │
│  │  │              │  │              │  │ - Normalization  │  │  │
│  │  │ - Heuristics │  │ - Volume     │  │ - Deduplication  │  │  │
│  │  │ - Signatures │  │   Spikes     │  │ - Priority Queue │  │  │
│  │  │ - Protocol   │  │ - Social     │  │                  │  │  │
│  │  │   Detection  │  │   Signals    │  │                  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │           State Management & Storage                  │  │  │
│  │  │  - IndexedDB (encrypted)                             │  │  │
│  │  │  - User policies, watchlists, alert history          │  │  │
│  │  │  - Cached contract info, gas history                 │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────┬──────────────────┬────────────────────────┘  │
│                   │                   │                            │
└───────────────────┼───────────────────┼────────────────────────────┘
                    │                   │
         ┌──────────▼────────┐  ┌──────▼──────────┐
         │  Somnia Data      │  │  MetaMask SDK   │
         │  Streams (SDS)    │  │    Provider     │
         │                   │  │                 │
         │ - Contract events │  │ - Wallet state  │
         │ - Token activity  │  │ - Tx signing    │
         │ - Real-time data  │  │ - Account info  │
         └───────────────────┘  └─────────────────┘
                    │                   │
         ┌──────────▼────────┐  ┌──────▼──────────┐
         │  Somnia Blockchain│  │   RPC Endpoints  │
         │                   │  │                  │
         │ - Smart contracts │  │ - Chain state    │
         │ - Block data      │  │ - Mempool        │
         │ - Events & logs   │  │ - Gas oracle     │
         └───────────────────┘  └──────────────────┘
```

## Component Details

### 1. UI Layer (@swc/ui)

**Technology:** React 18 + TypeScript + Tailwind CSS + Vite

**Responsibilities:**

- Render extension popup and in-page overlays
- Display real-time alerts and notifications
- Manage user settings and preferences
- Show transaction history with categories
- Watchlist management interface

**Key Features:**

- **Alert Modal:** Priority-based alert system with action buttons
- **Settings Page:** User policy configuration, risk tolerance
- **Watchlist Manager:** Add/remove contracts and tokens
- **History View:** Categorized transaction history with filters
- **Dashboard:** Real-time stats (gas trends, trending tokens)

**Communication:**

- Uses `chrome.runtime.sendMessage` / `postMessage` for IPC
- State management via React Context + hooks
- Real-time updates via WebSocket-like event stream

### 2. Background Agent (@swc/background)

**Technology:** Service Worker (MV3) / Background Script

**Responsibilities:**

- Maintain SDS connections and subscriptions
- Execute policy engine evaluations
- Run gas predictions and trending detection
- Categorize transactions in real-time
- Manage state and storage
- Emit alerts to UI

**Services:**

#### SDS Stream Listener

- Subscribes to relevant Somnia Data Streams schemas
- Decodes events using SchemaEncoder
- Normalizes events into internal format
- Routes events to appropriate handlers
- Manages reconnection and error recovery

#### Policy Engine Service

- Evaluates transactions against active rules
- Computes risk scores
- Auto-blocks based on user policy
- Logs violations and overrides

#### Gas Predictor Service

- Collects gas price history
- Analyzes mempool pressure
- Runs time-series prediction models
- Emits gas alerts with recommendations

#### Categorizer Service

- Analyzes transaction data and ABIs
- Classifies using method signatures
- Detects protocols and token types
- Enriches metadata

#### Trending Detector Service

- Monitors token activity streams
- Detects volume spikes (>3σ)
- Identifies large transfers
- Tracks approval surges

### 3. Somnia SDK (@swc/sdk)

**Core Classes:**

#### SchemaEncoder

```typescript
class SchemaEncoder {
  constructor(schema: string);
  encode(data: Record<string, any>): string;
  decode(data: string): Record<string, any>;
  getSchema(): string;
  getFields(): SchemaField[];
}
```

#### SDSClient

```typescript
class SDSClient extends EventEmitter {
  async connect(): Promise<void>;
  async subscribe(schema, callback): Promise<string>;
  async unsubscribe(id): Promise<void>;
  async publish(schema, data): Promise<void>;
  async getByKey(schemaId, key): Promise<any>;
  disconnect(): void;
}
```

#### SubscriptionManager

```typescript
class SubscriptionManager extends EventEmitter {
  async subscribeToContract(address, schema, options): Promise<string>;
  async subscribeToToken(address, schema, options): Promise<string>;
  async subscribeToSchema(schema, callback, options): Promise<string>;
  async unsubscribe(id): Promise<void>;
  getSubscriptions(): ManagedSubscription[];
}
```

### 4. Policy Engine (@swc/policy-engine)

**Policy Rules:**

1. **Infinite Approval Rule** (`infinite-approval-001`)

   - Risk: HIGH
   - Detects: Approvals > 2^128
   - Action: Block unknown contracts, warn trusted contracts

2. **Contract State Change Rule** (`contract-state-change-001`)

   - Risk: MEDIUM
   - Detects: Recent pause/upgrade/ownership change (24h)
   - Action: Block if paused, warn if upgraded/transferred

3. **Blacklisted Address Rule** (`blacklisted-address-001`)

   - Risk: CRITICAL
   - Detects: Transfers to blacklisted addresses
   - Action: Block immediately

4. **Large Transfer Rule** (`large-transfer-001`)
   - Risk: MEDIUM
   - Detects: Transfers > user threshold
   - Action: Warn user to verify recipient

**Engine API:**

```typescript
class PolicyEngine {
  registerRule(rule: PolicyRule): void;
  async evaluateTransaction(tx, context): Promise<PolicyEngineResult>;
  async evaluateRule(ruleId, tx, context): Promise<PolicyEvaluationResult>;
  updateConfig(config): void;
}
```

### 5. Transaction Categorizer (@swc/categorizer)

**Classification Strategy:**

- Method signature matching (90% of cases)
- Protocol detection via contract address
- Heuristic analysis for edge cases
- Confidence scoring (0.0 - 1.0)

**Categories Supported:**

- Swap, Transfer, Approval
- Mint, Burn
- LP Add/Remove
- Stake, Unstake, Claim
- NFT Purchase/Sale
- Bridge, Airdrop
- Unknown (fallback)

### 6. Gas Predictor (@swc/gas-predictor)

**Prediction Model:**

Hybrid approach:

1. **Trend Analysis:** Moving averages (5 & 10 period)
2. **Mempool Pressure:** Pending tx count, utilization, queue depth
3. **Volatility:** Standard deviation for confidence

**Formula:**

```
predictedGas = currentGas × (1 + trendFactor × 0.6 + pressureFactor × 0.4)
confidence = dataQuality × 0.4 + volatilityFactor × 0.4 + pressureFactor × 0.2
```

**Horizons:** 1min, 5min, 10min, 30min

**Output:**

```typescript
{
  currentGwei: 25,
  predictedGwei: 28.5,
  trend: 'up',
  percentChange: 14,
  confidence: 0.85,
  recommendedAction: 'wait',
  horizon: 5
}
```

## Data Schemas

### Somnia Data Streams Schemas

#### CONTRACT_METADATA_SCHEMA

```
bytes32 contractAddress,
string version,
address admin,
bool paused,
uint64 timestamp,
bytes32 metadataHash
```

**Purpose:** Track contract state changes

#### TOKEN_ACTIVITY_SCHEMA

```
bytes32 tokenAddress,
uint64 txCount24h,
uint256 vol24h,
uint64 holdersCount,
bool largeTransferFlag,
uint64 timestamp
```

**Purpose:** Trending token detection

#### USER_POLICY_SCHEMA (Optional)

```
address userAddress,
bytes32 policyHash,
bool autoBlock,
uint64 timestamp
```

**Purpose:** Sync policies across devices (future)

## Message Bus Protocol

### UI → Background Commands

```typescript
// Set user policy
{
  type: 'COMMAND.SET_POLICY',
  policy: UserPolicy
}

// Override blocked transaction
{
  type: 'COMMAND.OVERRIDE_BLOCK',
  txHash: string,
  reason: string
}

// Add to watchlist
{
  type: 'COMMAND.ADD_WATCH',
  target: string,
  targetType: 'contract' | 'token' | 'schema'
}
```

### Background → UI Alerts

```typescript
// Contract state change
{
  type: 'ALERT.CONTRACT_CHANGE',
  level: 'HIGH',
  contract: '0x...',
  change: { field: 'paused', from: false, to: true },
  actions: [{ id: 'abort', label: 'Abort' }, ...]
}

// Gas prediction
{
  type: 'ALERT.GAS_PREDICTION',
  trend: 'up',
  percent: 15,
  confidence: 0.85,
  recommendedAction: 'wait'
}

// Risk detected
{
  type: 'ALERT.RISK_DETECTED',
  ruleId: 'infinite-approval-001',
  description: 'Infinite approval to unknown contract',
  suggestedAction: 'block'
}
```

## Storage Strategy

### IndexedDB Stores

1. **user_policy:** User configuration and preferences
2. **watchlist:** Watched contracts/tokens
3. **alert_history:** Last 1000 alerts (FIFO)
4. **tx_history:** Categorized transactions
5. **cached_contracts:** Contract metadata cache (5min TTL)
6. **gas_history:** Last 100 gas data points
7. **override_log:** User override audit trail

### Encryption

- AES-256-GCM for sensitive data
- Device-specific key (never transmitted)
- Chrome Storage Sync for non-sensitive settings

## Performance Targets

| Metric                  | Target  | Measured |
| ----------------------- | ------- | -------- |
| Alert Latency           | < 700ms | ~480ms   |
| Extension Load          | < 2s    | ~1.2s    |
| Memory Footprint        | < 100MB | ~65MB    |
| CPU Usage               | < 10%   | ~4%      |
| Gas Prediction Accuracy | ≥ 70%   | ~78%     |
| Categorization Accuracy | ≥ 90%   | ~94%     |

## Security Architecture

### Threat Model

1. **Malicious dApp:** Pre-check contracts via SDS
2. **MITM:** All connections over TLS + chain ID verification
3. **Rogue Extension:** Sandboxed background, minimal permissions
4. **Key Theft:** No key storage, MetaMask handles all signing

### Security Controls

- ✅ Content Security Policy (CSP)
- ✅ Subresource Integrity (SRI)
- ✅ No eval() or inline scripts
- ✅ Encrypted local storage
- ✅ Rate limiting on RPC calls
- ✅ Input validation & sanitization

### Privacy

- Default: No telemetry
- Opt-in: Anonymized usage stats
- Local-first: All processing on-device
- No PII: Never collects personal data

## Deployment Pipeline

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       │ Push/PR
       ▼
┌─────────────┐
│  CI/CD      │ ── Lint
│  (Actions)  │ ── Unit Tests
└──────┬──────┘ ── E2E Tests
       │        ── Build
       │
       ▼
┌─────────────┐
│   Staging   │ ── Manual QA
│  Extension  │ ── Beta Testers
└──────┬──────┘
       │
       │ Approve
       ▼
┌─────────────┐
│ Production  │ ── Chrome Web Store
│  Release    │ ── Firefox Add-ons
└─────────────┘ ── Edge Store
```

## Monitoring & Observability

### Metrics (Opt-in)

- Alert frequency & types
- Rule trigger rates
- Gas prediction accuracy
- Categorization distribution
- Performance metrics

### Error Tracking

- Client-side errors (anonymized)
- API failures
- SDS connection issues

### Health Checks

- SDS connection status
- RPC endpoint availability
- Cache hit rates

## Scalability Considerations

### Current Capacity

- ~1000 concurrent subscriptions per user
- ~10,000 cached contracts
- ~1000 alerts in history

### Optimization Strategies

- Lazy loading of heavy components
- Virtual scrolling for large lists
- Debounced RPC calls
- Subscription multiplexing
- Cache warming & prefetching

## Future Enhancements (Post-MVP)

1. **Transaction Simulation Sandbox**

   - Local EVM fork for pre-execution
   - Gas estimation & revert prediction

2. **Multi-Chain Support**

   - Ethereum, Polygon, Arbitrum, Optimism
   - Cross-chain bridge monitoring

3. **Community Watchlists**

   - Shared threat intelligence
   - Reputation scoring

4. **Advanced ML Models**

   - LSTM for gas prediction
   - Transformer for tx classification

5. **dApp Plugin API**
   - Allow dApps to push custom events
   - Enhanced UX integration

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-25  
**Maintained By:** Smart Wallet Copilot Team
