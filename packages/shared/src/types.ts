/**
 * @swc/shared - Core Types and Constants
 * Shared type definitions and utilities for Smart Wallet Copilot
 */

// ============================================================================
// ALERT TYPES & EVENTS
// ============================================================================

export enum AlertType {
  CONTRACT_CHANGE = 'ALERT.CONTRACT_CHANGE',
  GAS_PREDICTION = 'ALERT.GAS_PREDICTION',
  RISK_DETECTED = 'ALERT.RISK_DETECTED',
  TX_CATEGORIZED = 'TX.CATEGORIZED',
  TREND_TOKEN = 'TREND.TOKEN',
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export interface ContractChangeAlert {
  type: AlertType.CONTRACT_CHANGE;
  level: RiskLevel;
  message: string;
  contract: string;
  contractName?: string;
  change: {
    field: string;
    from: any;
    to: any;
    timestamp: number;
  };
  evidence: {
    txHash?: string;
    blockNumber?: number;
    source: string;
  };
  actions: AlertAction[];
  timestamp: number;
}

export interface GasPredictionAlert {
  type: AlertType.GAS_PREDICTION;
  level: RiskLevel;
  trend: 'up' | 'down' | 'stable';
  percent: number;
  confidence: number;
  horizon: number; // minutes
  currentGwei: number;
  predictedGwei: number;
  recommendedAction: 'submit-now' | 'wait' | 'monitor';
  timestamp: number;
}

export interface RiskDetectedAlert {
  type: AlertType.RISK_DETECTED;
  level: RiskLevel;
  ruleId: string;
  ruleName: string;
  description: string;
  evidence: Record<string, any>;
  suggestedAction: 'block' | 'warn' | 'monitor';
  transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
    gas?: string;
  };
  overridable: boolean;
  timestamp: number;
}

export interface TransactionCategorizedEvent {
  type: AlertType.TX_CATEGORIZED;
  txHash: string;
  category: TransactionCategory;
  confidence: number;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface TrendingTokenAlert {
  type: AlertType.TREND_TOKEN;
  level: RiskLevel;
  token: string;
  tokenName?: string;
  tokenSymbol?: string;
  signal: 'volume-spike' | 'large-transfer' | 'approval-surge' | 'rug-alert';
  reason: string;
  metrics: {
    volume24h?: string;
    volumeChange?: number;
    transferCount?: number;
    holderCount?: number;
    largestTransfer?: string;
  };
  timestamp: number;
}

export type Alert =
  | ContractChangeAlert
  | GasPredictionAlert
  | RiskDetectedAlert
  | TransactionCategorizedEvent
  | TrendingTokenAlert;

export interface AlertAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: 'abort' | 'continue' | 'view-details' | 'override' | 'dismiss';
}

// ============================================================================
// TRANSACTION CATEGORIES
// ============================================================================

export enum TransactionCategory {
  SWAP = 'swap',
  TRANSFER = 'transfer',
  APPROVAL = 'approval',
  MINT = 'mint',
  BURN = 'burn',
  LP_ADD = 'lp-add',
  LP_REMOVE = 'lp-remove',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM = 'claim',
  AIRDROP = 'airdrop',
  NFT_PURCHASE = 'nft-purchase',
  NFT_SALE = 'nft-sale',
  BRIDGE = 'bridge',
  UNKNOWN = 'unknown',
}

export interface TransactionMetadata {
  category: TransactionCategory;
  confidence: number;
  from: string;
  to: string;
  value?: string;
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  amountIn?: string;
  amountOut?: string;
  fee?: string;
  protocol?: string;
  timestamp: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

// ============================================================================
// POLICY ENGINE TYPES
// ============================================================================

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  riskLevel: RiskLevel;
  evaluate: (
    transaction: Transaction,
    context: PolicyContext
  ) => Promise<PolicyEvaluationResult>;
}

export interface Transaction {
  from: string;
  to: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  nonce?: number;
  chainId?: number;
  methodName?: string;
  methodParams?: any[];
}

export interface PolicyContext {
  currentBlock: number;
  currentTimestamp: number;
  watchedContracts: Set<string>;
  blacklistedAddresses: Set<string>;
  userThresholds: UserThresholds;
  contractCache: Map<string, ContractInfo>;
  historicalData: HistoricalData;
}

export interface PolicyEvaluationResult {
  triggered: boolean;
  evidence?: Record<string, any>;
  suggestedAction?: 'block' | 'warn' | 'monitor';
  message?: string;
}

export interface UserThresholds {
  maxTransferAmount: string;
  maxApprovalAmount: string;
  minContractAge: number; // seconds
  gasLimitWarning: number;
}

export interface ContractInfo {
  address: string;
  name?: string;
  verified: boolean;
  createdAt?: number;
  owner?: string;
  paused?: boolean;
  upgradeable?: boolean;
  lastStateChange?: number;
  codeHash?: string;
}

export interface HistoricalData {
  gasHistory: GasDataPoint[];
  tokenVolumes: Map<string, VolumeData>;
  contractEvents: Map<string, ContractEvent[]>;
}

export interface GasDataPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
  blockNumber: number;
  utilization: number;
}

export interface VolumeData {
  token: string;
  timestamp: number;
  volume24h: string;
  txCount24h: number;
  holderCount: number;
}

export interface ContractEvent {
  eventName: string;
  timestamp: number;
  blockNumber: number;
  params: Record<string, any>;
}

// ============================================================================
// SOMNIA DATA STREAMS (SDS) TYPES
// ============================================================================

export interface SDSSchema {
  id: string;
  definition: string;
  encoder: any; // SchemaEncoder instance
}

export const SCHEMA_DEFINITIONS = {
  CONTRACT_METADATA: `bytes32 contractAddress, string version, address admin, bool paused, uint64 timestamp, bytes32 metadataHash`,
  TOKEN_ACTIVITY: `bytes32 tokenAddress, uint64 txCount24h, uint256 vol24h, uint64 holdersCount, bool largeTransferFlag, uint64 timestamp`,
  USER_POLICY: `address userAddress, bytes32 policyHash, bool autoBlock, uint64 timestamp`,
} as const;

export interface SDSEvent<T = any> {
  schemaId: string;
  publisher: string;
  data: T;
  timestamp: number;
  blockNumber: number;
  txHash?: string;
}

export interface ContractMetadataEvent {
  contractAddress: string;
  version: string;
  admin: string;
  paused: boolean;
  timestamp: number;
  metadataHash: string;
}

export interface TokenActivityEvent {
  tokenAddress: string;
  txCount24h: number;
  vol24h: string;
  holdersCount: number;
  largeTransferFlag: boolean;
  timestamp: number;
}

// ============================================================================
// COMMANDS (UI → Background)
// ============================================================================

export enum CommandType {
  SET_POLICY = 'COMMAND.SET_POLICY',
  OVERRIDE_BLOCK = 'COMMAND.OVERRIDE_BLOCK',
  ADD_WATCH = 'COMMAND.ADD_WATCH',
  REMOVE_WATCH = 'COMMAND.REMOVE_WATCH',
  GET_STATE = 'COMMAND.GET_STATE',
  CLEAR_ALERTS = 'COMMAND.CLEAR_ALERTS',
  UPDATE_THRESHOLDS = 'COMMAND.UPDATE_THRESHOLDS',
}

export interface SetPolicyCommand {
  type: CommandType.SET_POLICY;
  policy: UserPolicy;
}

export interface OverrideBlockCommand {
  type: CommandType.OVERRIDE_BLOCK;
  txHash: string;
  reason: string;
  timestamp: number;
}

export interface AddWatchCommand {
  type: CommandType.ADD_WATCH;
  target: string; // contract address or schema ID
  targetType: 'contract' | 'token' | 'schema';
  metadata?: Record<string, any>;
}

export interface RemoveWatchCommand {
  type: CommandType.REMOVE_WATCH;
  target: string;
}

export interface GetStateCommand {
  type: CommandType.GET_STATE;
}

export interface ClearAlertsCommand {
  type: CommandType.CLEAR_ALERTS;
}

export interface UpdateThresholdsCommand {
  type: CommandType.UPDATE_THRESHOLDS;
  thresholds: Partial<UserThresholds>;
}

export type Command =
  | SetPolicyCommand
  | OverrideBlockCommand
  | AddWatchCommand
  | RemoveWatchCommand
  | GetStateCommand
  | ClearAlertsCommand
  | UpdateThresholdsCommand;

// ============================================================================
// USER SETTINGS & POLICY
// ============================================================================

export interface UserPolicy {
  autoBlock: boolean;
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  enabledRules: string[];
  thresholds: UserThresholds;
  watchlist: WatchlistItem[];
  telemetryEnabled: boolean;
}

export interface WatchlistItem {
  address: string;
  type: 'contract' | 'token';
  name?: string;
  addedAt: number;
  notes?: string;
}

// ============================================================================
// GAS PREDICTION
// ============================================================================

export interface GasPrediction {
  timestamp: number;
  horizon: number; // minutes
  currentGwei: number;
  predictedGwei: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  confidence: number;
  recommendedAction: 'submit-now' | 'wait' | 'monitor';
  model: string;
  features: Record<string, number>;
}

export interface MempoolMetrics {
  timestamp: number;
  pendingTxCount: number;
  avgGasPrice: number;
  medianGasPrice: number;
  p95GasPrice: number;
  blockUtilization: number;
  queuedTxCount: number;
}

// ============================================================================
// NETWORK & CONFIGURATION
// ============================================================================

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  sdsConfig?: {
    endpoint: string;
    apiKey?: string;
  };
}

export const SOMNIA_TESTNET: NetworkConfig = {
  chainId: 50311,
  name: 'Somnia Testnet',
  rpcUrl: 'https://rpc-testnet.somnia.network',
  wsUrl: 'wss://ws-testnet.somnia.network',
  blockExplorer: 'https://explorer-testnet.somnia.network',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'STT',
    decimals: 18,
  },
  sdsConfig: {
    endpoint: 'https://streams.somnia.network',
  },
};

export const SOMNIA_MAINNET: NetworkConfig = {
  chainId: 50001,
  name: 'Somnia Mainnet',
  rpcUrl: 'https://rpc.somnia.network',
  wsUrl: 'wss://ws.somnia.network',
  blockExplorer: 'https://explorer.somnia.network',
  nativeCurrency: {
    name: 'Somnia',
    symbol: 'SOM',
    decimals: 18,
  },
  sdsConfig: {
    endpoint: 'https://streams.somnia.network',
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONSTANTS = {
  ALERT_LATENCY_TARGET: 700, // ms
  GAS_PREDICTION_HORIZONS: [1, 5, 10, 30], // minutes
  MAX_WATCHLIST_SIZE: 100,
  CACHE_TTL: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  MAX_ALERTS_HISTORY: 1000,
  VERSION: '0.1.0',
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Result<T, E = Error> {
  ok: boolean;
  value?: T;
  error?: E;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TimeSeries<T> {
  timestamp: number;
  value: T;
}

export interface Subscription {
  id: string;
  target: string;
  type: 'contract' | 'token' | 'schema';
  callback: (event: any) => void;
  createdAt: number;
}

// ============================================================================
// MESSAGE BUS (IPC)
// ============================================================================

export interface Message<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  sender: 'ui' | 'background';
}

export interface MessageResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
