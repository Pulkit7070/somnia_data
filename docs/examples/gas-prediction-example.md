# Example: Gas Price Prediction

This example demonstrates how to use the Gas Predictor to forecast gas prices and provide actionable recommendations.

## Scenario

A user is about to submit a swap transaction. The Smart Wallet Copilot should:

1. Analyze current gas trends
2. Predict gas price movement
3. Recommend optimal timing
4. Update prediction in real-time

## Code Implementation

### 1. Initialize Gas Predictor

```typescript
import { GasPredictor } from "@swc/gas-predictor";
import { GasDataPoint, MempoolMetrics } from "@swc/shared";

const predictor = new GasPredictor({
  windowSize: 20,
  updateInterval: 15000, // 15 seconds
  confidenceThreshold: 0.7,
});
```

### 2. Feed Historical Data

```typescript
// Collect gas data from RPC
import { createPublicClient, http } from "viem";

const client = createPublicClient({
  chain: somniaTestnet,
  transport: http("https://rpc-testnet.somnia.network"),
});

async function collectGasData() {
  const block = await client.getBlock({ blockTag: "latest" });
  const feeHistory = await client.getFeeHistory({
    blockCount: 1,
    rewardPercentiles: [25, 50, 75],
  });

  const dataPoint: GasDataPoint = {
    timestamp: Number(block.timestamp) * 1000,
    baseFee: Number(block.baseFeePerGas) / 1e9, // Convert to Gwei
    priorityFee: Number(feeHistory.reward[0][1]) / 1e9,
    blockNumber: Number(block.number),
    utilization: calculateUtilization(block),
  };

  predictor.addGasData(dataPoint);
}

function calculateUtilization(block: any): number {
  const gasUsed = Number(block.gasUsed);
  const gasLimit = Number(block.gasLimit);
  return gasUsed / gasLimit;
}
```

### 3. Collect Mempool Metrics

```typescript
async function collectMempoolMetrics() {
  // Query pending transactions
  const pendingTxs = await client.request({
    method: "txpool_content",
  });

  const metrics: MempoolMetrics = {
    timestamp: Date.now(),
    pendingTxCount: countTransactions(pendingTxs.pending),
    avgGasPrice: calculateAvgGasPrice(pendingTxs.pending),
    medianGasPrice: calculateMedianGasPrice(pendingTxs.pending),
    p95GasPrice: calculatePercentileGasPrice(pendingTxs.pending, 95),
    blockUtilization: await getAverageUtilization(),
    queuedTxCount: countTransactions(pendingTxs.queued),
  };

  predictor.addMempoolMetrics(metrics);
}
```

### 4. Make Prediction

```typescript
// Predict gas for 5-minute horizon
const prediction = await predictor.predict(5);

console.log("Gas Prediction:", {
  current: prediction.currentGwei,
  predicted: prediction.predictedGwei,
  trend: prediction.trend,
  change: prediction.percentChange,
  confidence: prediction.confidence,
  action: prediction.recommendedAction,
});
```

### 5. Expected Output

```typescript
{
  timestamp: 1706227200000,
  horizon: 5, // minutes
  currentGwei: 25.3,
  predictedGwei: 28.8,
  trend: 'up',
  percentChange: 13.8,
  confidence: 0.85,
  recommendedAction: 'wait',
  model: 'hybrid-trend-mempool',
  features: {
    trendFactor: 0.12,
    pressureFactor: 0.08,
    volatility: 2.5,
    mempoolPressure: 0.72,
  }
}
```

## Display Gas Alert

```typescript
import { GasPredictionAlert, AlertType, RiskLevel } from "@swc/shared";

function createGasAlert(prediction: GasPrediction): GasPredictionAlert {
  // Determine risk level based on prediction
  let level: RiskLevel;
  if (prediction.percentChange > 15) {
    level = RiskLevel.HIGH;
  } else if (prediction.percentChange > 5) {
    level = RiskLevel.MEDIUM;
  } else {
    level = RiskLevel.LOW;
  }

  return {
    type: AlertType.GAS_PREDICTION,
    level,
    trend: prediction.trend,
    percent: prediction.percentChange,
    confidence: prediction.confidence,
    horizon: prediction.horizon,
    currentGwei: prediction.currentGwei,
    predictedGwei: prediction.predictedGwei,
    recommendedAction: prediction.recommendedAction,
    timestamp: prediction.timestamp,
  };
}

function displayGasAlert(alert: GasPredictionAlert) {
  const badge = document.createElement("div");
  badge.className = "gas-prediction-badge";
  badge.innerHTML = `
    <div class="badge-header">
      <h3>⛽ Gas Prediction</h3>
      <button class="close" onclick="dismissAlert()">×</button>
    </div>
    <div class="badge-body">
      <div class="gas-info">
        <div class="current">
          <span class="label">Current</span>
          <span class="value">${alert.currentGwei.toFixed(1)} Gwei</span>
        </div>
        <div class="predicted">
          <span class="label">${alert.horizon}min</span>
          <span class="value ${alert.trend}">
            ${alert.predictedGwei.toFixed(1)} Gwei
            ${alert.trend === "up" ? "▲" : alert.trend === "down" ? "▼" : "─"}
            ${Math.abs(alert.percent).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div class="confidence-bar">
        <div class="label">Confidence</div>
        <div class="bar">
          <div class="fill" style="width: ${alert.confidence * 100}%"></div>
        </div>
        <div class="percentage">${(alert.confidence * 100).toFixed(0)}%</div>
      </div>
      
      ${getRecommendationHTML(alert)}
    </div>
    <div class="badge-actions">
      ${getActionButtons(alert.recommendedAction)}
    </div>
  `;

  document.body.appendChild(badge);
}

function getRecommendationHTML(alert: GasPredictionAlert): string {
  switch (alert.recommendedAction) {
    case "submit-now":
      return `
        <div class="recommendation success">
          <span class="icon">✓</span>
          <span class="text">Good time to submit</span>
        </div>
      `;
    case "wait":
      const savingsEstimate = calculateSavings(alert);
      return `
        <div class="recommendation warning">
          <span class="icon">⏱️</span>
          <span class="text">Wait ${alert.horizon}min to save ~$${savingsEstimate}</span>
        </div>
      `;
    case "monitor":
      return `
        <div class="recommendation info">
          <span class="icon">👁️</span>
          <span class="text">Monitor gas prices</span>
        </div>
      `;
  }
}

function getActionButtons(action: string): string {
  switch (action) {
    case "submit-now":
      return `
        <button class="btn-primary" onclick="submitTransaction()">Submit Now</button>
        <button class="btn-secondary" onclick="dismiss()">Dismiss</button>
      `;
    case "wait":
      return `
        <button class="btn-primary" onclick="setReminder()">Remind Me</button>
        <button class="btn-secondary" onclick="submitAnyway()">Submit Anyway</button>
      `;
    case "monitor":
      return `
        <button class="btn-primary" onclick="enableNotifications()">Notify When Lower</button>
        <button class="btn-secondary" onclick="dismiss()">Dismiss</button>
      `;
  }
}

function calculateSavings(alert: GasPredictionAlert): string {
  // Estimate savings based on typical transaction
  const GAS_LIMIT = 150000; // Typical swap
  const ETH_PRICE = 2500; // Mock price

  const currentCost = (alert.currentGwei * GAS_LIMIT * ETH_PRICE) / 1e9;
  const predictedCost = (alert.predictedGwei * GAS_LIMIT * ETH_PRICE) / 1e9;
  const savings = Math.abs(currentCost - predictedCost);

  return savings.toFixed(2);
}
```

## Real-Time Updates

```typescript
// Background service updates prediction every 15 seconds
import { INTERVALS } from "@swc/shared";

class GasPredictorService {
  private updateTimer?: NodeJS.Timeout;

  start() {
    this.updateTimer = setInterval(async () => {
      await this.collectData();
      await this.updatePrediction();
    }, INTERVALS.GAS_UPDATE);
  }

  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  private async collectData() {
    await Promise.all([collectGasData(), collectMempoolMetrics()]);
  }

  private async updatePrediction() {
    const prediction = await predictor.predict(5);

    // Emit to UI
    chrome.runtime.sendMessage({
      type: "gas-prediction-updated",
      payload: prediction,
    });

    // Check if significant change occurred
    if (this.shouldAlert(prediction)) {
      const alert = createGasAlert(prediction);
      chrome.runtime.sendMessage({
        type: AlertType.GAS_PREDICTION,
        payload: alert,
      });
    }
  }

  private shouldAlert(prediction: GasPrediction): boolean {
    // Alert if:
    // 1. Large change (>10%)
    // 2. High confidence (>80%)
    // 3. Not alerted recently
    return (
      Math.abs(prediction.percentChange) > 10 &&
      prediction.confidence > 0.8 &&
      this.canAlert()
    );
  }

  private canAlert(): boolean {
    const lastAlert = localStorage.getItem("last-gas-alert");
    if (!lastAlert) return true;

    const elapsed = Date.now() - parseInt(lastAlert);
    return elapsed > 5 * 60 * 1000; // 5 minutes
  }
}

const gasPredictorService = new GasPredictorService();
gasPredictorService.start();
```

## Testing

```typescript
// tests/examples/gas-prediction.test.ts
import { GasPredictor } from "@swc/gas-predictor";
import { GasDataPoint, MempoolMetrics } from "@swc/shared";

describe("Gas Prediction Example", () => {
  let predictor: GasPredictor;

  beforeEach(() => {
    predictor = new GasPredictor();
  });

  it("should predict rising gas prices", async () => {
    // Add increasing gas data
    for (let i = 0; i < 10; i++) {
      const dataPoint: GasDataPoint = {
        timestamp: Date.now() - (10 - i) * 60000,
        baseFee: 20 + i * 2, // Increasing
        priorityFee: 2,
        blockNumber: 1000 + i,
        utilization: 0.7 + i * 0.02,
      };
      predictor.addGasData(dataPoint);
    }

    // Add mempool pressure
    predictor.addMempoolMetrics({
      timestamp: Date.now(),
      pendingTxCount: 5000,
      avgGasPrice: 30,
      medianGasPrice: 28,
      p95GasPrice: 35,
      blockUtilization: 0.85,
      queuedTxCount: 1000,
    });

    const prediction = await predictor.predict(5);

    expect(prediction.trend).toBe("up");
    expect(prediction.percentChange).toBeGreaterThan(0);
    expect(prediction.recommendedAction).toBe("submit-now");
  });

  it("should predict decreasing gas prices", async () => {
    // Add decreasing gas data
    for (let i = 0; i < 10; i++) {
      const dataPoint: GasDataPoint = {
        timestamp: Date.now() - (10 - i) * 60000,
        baseFee: 40 - i * 2, // Decreasing
        priorityFee: 2,
        blockNumber: 1000 + i,
        utilization: 0.9 - i * 0.05,
      };
      predictor.addGasData(dataPoint);
    }

    // Low mempool pressure
    predictor.addMempoolMetrics({
      timestamp: Date.now(),
      pendingTxCount: 500,
      avgGasPrice: 20,
      medianGasPrice: 18,
      p95GasPrice: 25,
      blockUtilization: 0.4,
      queuedTxCount: 100,
    });

    const prediction = await predictor.predict(5);

    expect(prediction.trend).toBe("down");
    expect(prediction.percentChange).toBeLessThan(0);
    expect(prediction.recommendedAction).toBe("wait");
  });

  it("should have low confidence with insufficient data", async () => {
    // Add only 2 data points
    predictor.addGasData({
      timestamp: Date.now() - 60000,
      baseFee: 25,
      priorityFee: 2,
      blockNumber: 1000,
      utilization: 0.7,
    });

    const prediction = await predictor.predict(5);

    expect(prediction.confidence).toBeLessThan(0.7);
    expect(prediction.recommendedAction).toBe("monitor");
  });
});
```

## Integration with UI

```typescript
// packages/ui/src/components/GasPredictionBadge.tsx
import React, { useEffect, useState } from "react";
import { GasPrediction } from "@swc/shared";

export const GasPredictionBadge: React.FC = () => {
  const [prediction, setPrediction] = useState<GasPrediction | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Listen for prediction updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "gas-prediction-updated") {
        setPrediction(message.payload);
        setVisible(true);
      }
    });
  }, []);

  if (!visible || !prediction) return null;

  return (
    <div className="gas-prediction-badge">
      <div className="badge-header">
        <h3>⛽ Gas Prediction</h3>
        <button onClick={() => setVisible(false)}>×</button>
      </div>
      <div className="badge-body">
        <GasInfo prediction={prediction} />
        <ConfidenceBar confidence={prediction.confidence} />
        <Recommendation action={prediction.recommendedAction} />
      </div>
      <div className="badge-actions">
        <ActionButtons action={prediction.recommendedAction} />
      </div>
    </div>
  );
};
```

## Next Steps

- See [Transaction Categorization Example](./categorization-example.md)
- See [Trending Token Detection Example](./trending-detection-example.md)
- Read [Gas Predictor Documentation](../docs/GAS_PREDICTOR.md)
