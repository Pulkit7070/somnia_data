/**
 * Gas Service - Gas price prediction and monitoring
 * 
 * Collects gas data and provides real-time predictions.
 */

import { GasPredictor } from '@swc/gas-predictor';
import { MessageBus } from './message-bus';
import { Logger, GasDataPoint, MempoolMetrics, AlertType, GasPredictionAlert } from '@swc/shared';
import { createPublicClient, http } from 'viem';

const logger = new Logger('GasService');

// Somnia testnet config
const somniaTestnet = {
  id: 50311,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.somnia.network'] },
    public: { http: ['https://rpc-testnet.somnia.network'] },
  },
};

export class GasService {
  private predictor: GasPredictor;
  private messageBus: MessageBus;
  private updateTimer?: NodeJS.Timeout;
  private client: any;
  private lastAlert = 0;
  private alertCooldown = 5 * 60 * 1000; // 5 minutes

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
    this.predictor = new GasPredictor({
      windowSize: 20,
      updateInterval: 15000,
      confidenceThreshold: 0.7,
    });

    this.client = createPublicClient({
      chain: somniaTestnet,
      transport: http(),
    });
  }

  start() {
    logger.info('Starting gas prediction service');
    
    // Initial collection
    this.update();

    // Update every 15 seconds
    this.updateTimer = setInterval(() => {
      this.update();
    }, 15000);
  }

  stop() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
    logger.info('Gas prediction service stopped');
  }

  async update() {
    try {
      // Collect gas data
      await this.collectGasData();
      await this.collectMempoolMetrics();

      // Make prediction
      const prediction = await this.predictor.predict(5);

      // Emit to UI
      this.messageBus.sendToUI('GAS.PREDICTION_UPDATED', prediction);

      // Check if we should alert
      if (this.shouldAlert(prediction)) {
        await this.emitAlert(prediction);
      }
    } catch (error) {
      logger.error('Gas update failed:', error);
    }
  }

  async getLatestPrediction() {
    return await this.predictor.predict(5);
  }

  private async collectGasData() {
    try {
      const block = await this.client.getBlock({ blockTag: 'latest' });
      const feeHistory = await this.client.getFeeHistory({
        blockCount: 1,
        rewardPercentiles: [25, 50, 75],
      });

      const dataPoint: GasDataPoint = {
        timestamp: Number(block.timestamp) * 1000,
        baseFee: Number(block.baseFeePerGas || 0n) / 1e9,
        priorityFee: Number(feeHistory.reward?.[0]?.[1] || 0n) / 1e9,
        blockNumber: Number(block.number),
        utilization: this.calculateUtilization(block),
      };

      this.predictor.addGasData(dataPoint);
    } catch (error) {
      logger.error('Failed to collect gas data:', error);
    }
  }

  private calculateUtilization(block: any): number {
    const gasUsed = Number(block.gasUsed);
    const gasLimit = Number(block.gasLimit);
    return gasLimit > 0 ? gasUsed / gasLimit : 0;
  }

  private async collectMempoolMetrics() {
    try {
      // Note: txpool_content might not be available on all RPC endpoints
      // This is a simplified version
      const metrics: MempoolMetrics = {
        timestamp: Date.now(),
        pendingTxCount: 0, // Would need mempool access
        avgGasPrice: 0,
        medianGasPrice: 0,
        p95GasPrice: 0,
        blockUtilization: 0,
        queuedTxCount: 0,
      };

      this.predictor.addMempoolMetrics(metrics);
    } catch (error) {
      logger.debug('Failed to collect mempool metrics:', error);
    }
  }

  private shouldAlert(prediction: any): boolean {
    // Alert if:
    // 1. Large change (>10%)
    // 2. High confidence (>70%)
    // 3. Not alerted recently
    const now = Date.now();
    const canAlert = now - this.lastAlert > this.alertCooldown;

    return (
      Math.abs(prediction.percentChange) > 10 &&
      prediction.confidence > 0.7 &&
      canAlert
    );
  }

  private async emitAlert(prediction: any) {
    const alert: GasPredictionAlert = {
      type: AlertType.GAS_PREDICTION,
      level: prediction.percentChange > 15 ? 'HIGH' : 'MEDIUM',
      trend: prediction.trend,
      percent: prediction.percentChange,
      confidence: prediction.confidence,
      horizon: prediction.horizon,
      currentGwei: prediction.currentGwei,
      predictedGwei: prediction.predictedGwei,
      recommendedAction: prediction.recommendedAction,
      timestamp: prediction.timestamp,
    };

    this.messageBus.sendToUI(AlertType.GAS_PREDICTION, alert);
    this.lastAlert = Date.now();

    logger.info('Gas alert emitted', {
      trend: alert.trend,
      change: alert.percent,
    });
  }
}
