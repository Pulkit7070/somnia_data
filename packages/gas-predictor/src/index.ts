/**
 * @swc/gas-predictor - Gas Price Predictor
 * Predicts gas price trends using mempool data and historical patterns
 */

import {
  GasPrediction,
  MempoolMetrics,
  GasDataPoint,
  Logger,
} from '@swc/shared';

const logger = new Logger('GasPredictor');

export interface PredictorConfig {
  windowSize: number; // Number of historical data points to consider
  updateInterval: number; // ms between updates
  confidenceThreshold: number; // Minimum confidence to make prediction
}

const DEFAULT_CONFIG: PredictorConfig = {
  windowSize: 20,
  updateInterval: 15000,
  confidenceThreshold: 0.7,
};

/**
 * Gas Price Predictor
 * Uses time series analysis and mempool metrics to predict gas trends
 */
export class GasPredictor {
  private gasHistory: GasDataPoint[] = [];
  private mempoolHistory: MempoolMetrics[] = [];
  private config: PredictorConfig;

  constructor(config: Partial<PredictorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add gas data point
   */
  addGasData(dataPoint: GasDataPoint): void {
    this.gasHistory.push(dataPoint);

    // Keep only recent history
    if (this.gasHistory.length > this.config.windowSize) {
      this.gasHistory.shift();
    }
  }

  /**
   * Add mempool metrics
   */
  addMempoolMetrics(metrics: MempoolMetrics): void {
    this.mempoolHistory.push(metrics);

    if (this.mempoolHistory.length > this.config.windowSize) {
      this.mempoolHistory.shift();
    }
  }

  /**
   * Predict gas price for a given horizon
   */
  async predict(horizon: number = 5): Promise<GasPrediction> {
    if (this.gasHistory.length < 5) {
      logger.warn('Insufficient data for prediction');
      return this.defaultPrediction(horizon);
    }

    const currentGas = this.getCurrentGasPrice();
    const trend = this.detectTrend();
    const volatility = this.calculateVolatility();
    const mempoolPressure = this.getMempoolPressure();

    // Predict based on trend + mempool pressure
    const trendFactor = this.getTrendFactor(trend);
    const pressureFactor = this.getPressureFactor(mempoolPressure);
    const combinedFactor = trendFactor * 0.6 + pressureFactor * 0.4;

    const predictedGas = currentGas * (1 + combinedFactor);
    const percentChange = ((predictedGas - currentGas) / currentGas) * 100;

    // Calculate confidence
    const confidence = this.calculateConfidence(volatility, mempoolPressure);

    // Determine recommended action
    const recommendedAction = this.getRecommendedAction(
      percentChange,
      confidence,
      mempoolPressure
    );

    const prediction: GasPrediction = {
      timestamp: Date.now(),
      horizon,
      currentGwei: currentGas,
      predictedGwei: predictedGas,
      trend: this.getTrendLabel(percentChange),
      percentChange,
      confidence,
      recommendedAction,
      model: 'hybrid-trend-mempool',
      features: {
        trendFactor,
        pressureFactor,
        volatility,
        mempoolPressure,
      },
    };

    logger.debug(`Prediction: ${JSON.stringify(prediction)}`);

    return prediction;
  }

  /**
   * Get current gas price
   */
  private getCurrentGasPrice(): number {
    if (this.gasHistory.length === 0) return 20; // Default fallback

    const latest = this.gasHistory[this.gasHistory.length - 1];
    return latest.baseFee + latest.priorityFee;
  }

  /**
   * Detect trend using simple moving average
   */
  private detectTrend(): number {
    if (this.gasHistory.length < 5) return 0;

    const recentAvg = this.calculateAverage(this.gasHistory.slice(-5));
    const olderAvg = this.calculateAverage(
      this.gasHistory.slice(-10, -5)
    );

    if (olderAvg === 0) return 0;

    return (recentAvg - olderAvg) / olderAvg;
  }

  /**
   * Calculate volatility (standard deviation)
   */
  private calculateVolatility(): number {
    if (this.gasHistory.length < 2) return 0;

    const prices = this.gasHistory.map((d) => d.baseFee + d.priorityFee);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
    const variance =
      squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;

    return Math.sqrt(variance);
  }

  /**
   * Get mempool pressure (0-1)
   */
  private getMempoolPressure(): number {
    if (this.mempoolHistory.length === 0) return 0.5;

    const latest = this.mempoolHistory[this.mempoolHistory.length - 1];

    // Normalize metrics
    const txPressure = Math.min(latest.pendingTxCount / 50000, 1);
    const utilizationPressure = latest.blockUtilization;
    const queuePressure = Math.min(latest.queuedTxCount / 10000, 1);

    return (txPressure + utilizationPressure + queuePressure) / 3;
  }

  /**
   * Get trend factor for prediction
   */
  private getTrendFactor(trend: number): number {
    // Amplify trend slightly for prediction
    return trend * 1.2;
  }

  /**
   * Get pressure factor for prediction
   */
  private getPressureFactor(pressure: number): number {
    // High pressure = gas likely to increase
    if (pressure > 0.8) return 0.15;
    if (pressure > 0.6) return 0.08;
    if (pressure > 0.4) return 0.03;
    if (pressure < 0.2) return -0.05;
    return 0;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(
    volatility: number,
    mempoolPressure: number
  ): number {
    const dataQuality = Math.min(this.gasHistory.length / this.config.windowSize, 1);

    // Lower volatility = higher confidence
    const volatilityFactor = Math.max(0, 1 - volatility / 100);

    // Extreme mempool pressure = lower confidence
    const pressureFactor =
      mempoolPressure > 0.9 || mempoolPressure < 0.1
        ? 0.8
        : 1;

    return dataQuality * 0.4 + volatilityFactor * 0.4 + pressureFactor * 0.2;
  }

  /**
   * Get recommended action
   */
  private getRecommendedAction(
    percentChange: number,
    confidence: number,
    mempoolPressure: number
  ): 'submit-now' | 'wait' | 'monitor' {
    if (confidence < this.config.confidenceThreshold) {
      return 'monitor';
    }

    // Gas dropping significantly
    if (percentChange < -5 && mempoolPressure < 0.5) {
      return 'wait';
    }

    // Gas rising significantly  
    if (percentChange > 10 || mempoolPressure > 0.8) {
      return 'submit-now';
    }

    // Stable
    if (Math.abs(percentChange) < 3) {
      return 'submit-now';
    }

    return 'monitor';
  }

  /**
   * Get trend label
   */
  private getTrendLabel(
    percentChange: number
  ): 'up' | 'down' | 'stable' {
    if (percentChange > 3) return 'up';
    if (percentChange < -3) return 'down';
    return 'stable';
  }

  /**
   * Calculate average of gas data points
   */
  private calculateAverage(data: GasDataPoint[]): number {
    if (data.length === 0) return 0;

    const sum = data.reduce(
      (acc, d) => acc + d.baseFee + d.priorityFee,
      0
    );
    return sum / data.length;
  }

  /**
   * Default prediction when insufficient data
   */
  private defaultPrediction(horizon: number): GasPrediction {
    return {
      timestamp: Date.now(),
      horizon,
      currentGwei: 20,
      predictedGwei: 20,
      trend: 'stable',
      percentChange: 0,
      confidence: 0.5,
      recommendedAction: 'monitor',
      model: 'default',
      features: {},
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.gasHistory = [];
    this.mempoolHistory = [];
  }

  /**
   * Get gas history
   */
  getGasHistory(): GasDataPoint[] {
    return [...this.gasHistory];
  }
}

export const gasPredictor = new GasPredictor();
export default gasPredictor;
