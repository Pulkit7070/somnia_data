/**
 * @swc/shared - Constants
 */

import { RiskLevel, TransactionCategory } from './types';

// ============================================================================
// RISK SCORING
// ============================================================================

export const RISK_SCORES: Record<RiskLevel, number> = {
  [RiskLevel.CRITICAL]: 100,
  [RiskLevel.HIGH]: 75,
  [RiskLevel.MEDIUM]: 50,
  [RiskLevel.LOW]: 25,
  [RiskLevel.INFO]: 0,
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.CRITICAL]: '#DC2626',
  [RiskLevel.HIGH]: '#EA580C',
  [RiskLevel.MEDIUM]: '#F59E0B',
  [RiskLevel.LOW]: '#10B981',
  [RiskLevel.INFO]: '#3B82F6',
};

// ============================================================================
// TRANSACTION CATEGORIES
// ============================================================================

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  [TransactionCategory.SWAP]: 'Token Swap',
  [TransactionCategory.TRANSFER]: 'Transfer',
  [TransactionCategory.APPROVAL]: 'Token Approval',
  [TransactionCategory.MINT]: 'Mint',
  [TransactionCategory.BURN]: 'Burn',
  [TransactionCategory.LP_ADD]: 'Add Liquidity',
  [TransactionCategory.LP_REMOVE]: 'Remove Liquidity',
  [TransactionCategory.STAKE]: 'Stake',
  [TransactionCategory.UNSTAKE]: 'Unstake',
  [TransactionCategory.CLAIM]: 'Claim Rewards',
  [TransactionCategory.AIRDROP]: 'Airdrop',
  [TransactionCategory.NFT_PURCHASE]: 'NFT Purchase',
  [TransactionCategory.NFT_SALE]: 'NFT Sale',
  [TransactionCategory.BRIDGE]: 'Bridge',
  [TransactionCategory.UNKNOWN]: 'Unknown',
};

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  [TransactionCategory.SWAP]: '🔄',
  [TransactionCategory.TRANSFER]: '💸',
  [TransactionCategory.APPROVAL]: '✅',
  [TransactionCategory.MINT]: '🎨',
  [TransactionCategory.BURN]: '🔥',
  [TransactionCategory.LP_ADD]: '💎',
  [TransactionCategory.LP_REMOVE]: '💰',
  [TransactionCategory.STAKE]: '🔒',
  [TransactionCategory.UNSTAKE]: '🔓',
  [TransactionCategory.CLAIM]: '🎁',
  [TransactionCategory.AIRDROP]: '🪂',
  [TransactionCategory.NFT_PURCHASE]: '🖼️',
  [TransactionCategory.NFT_SALE]: '💵',
  [TransactionCategory.BRIDGE]: '🌉',
  [TransactionCategory.UNKNOWN]: '❓',
};

// ============================================================================
// METHOD SIGNATURES (for categorization)
// ============================================================================

export const METHOD_SIGNATURES = {
  // ERC20
  TRANSFER: '0xa9059cbb',
  TRANSFER_FROM: '0x23b872dd',
  APPROVE: '0x095ea7b3',
  
  // DEX / Swap
  SWAP_EXACT_TOKENS_FOR_TOKENS: '0x38ed1739',
  SWAP_TOKENS_FOR_EXACT_TOKENS: '0x8803dbee',
  SWAP_EXACT_ETH_FOR_TOKENS: '0x7ff36ab5',
  SWAP_TOKENS_FOR_EXACT_ETH: '0x4a25d94a',
  SWAP_EXACT_TOKENS_FOR_ETH: '0x18cbafe5',
  SWAP_ETH_FOR_EXACT_TOKENS: '0xfb3bdb41',
  
  // Uniswap V3
  EXACT_INPUT: '0xc04b8d59',
  EXACT_OUTPUT: '0xf28c0498',
  EXACT_INPUT_SINGLE: '0x414bf389',
  EXACT_OUTPUT_SINGLE: '0xdb3e2198',
  
  // Liquidity
  ADD_LIQUIDITY: '0xe8e33700',
  ADD_LIQUIDITY_ETH: '0xf305d719',
  REMOVE_LIQUIDITY: '0xbaa2abde',
  REMOVE_LIQUIDITY_ETH: '0x02751cec',
  
  // Staking
  STAKE: '0xa694fc3a',
  UNSTAKE: '0x2e17de78',
  WITHDRAW: '0x3ccfd60b',
  CLAIM: '0x4e71d92d',
  CLAIM_REWARDS: '0x372500ab',
  
  // NFT
  SAFE_TRANSFER_FROM: '0x42842e0e',
  SAFE_TRANSFER_FROM_WITH_DATA: '0xb88d4fde',
  SET_APPROVAL_FOR_ALL: '0xa22cb465',
  
  // Minting
  MINT: '0x40c10f19',
  MINT_NFT: '0xd0def521',
  
  // Burning
  BURN: '0x42966c68',
  BURN_FROM: '0x79cc6790',
} as const;

// ============================================================================
// KNOWN CONTRACTS & PROTOCOLS
// ============================================================================

export const KNOWN_PROTOCOLS: Record<string, string> = {
  // DEX Routers (lowercase addresses)
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2',
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3',
  '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch',
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap',
  
  // Add Somnia-specific contracts here when available
};

// ============================================================================
// BLACKLISTED ADDRESSES (example - should be dynamic)
// ============================================================================

export const BLACKLISTED_ADDRESSES = new Set<string>([
  // Add known malicious addresses
  // These should be fetched from an external API in production
]);

// ============================================================================
// GAS CONSTANTS
// ============================================================================

export const GAS_LIMITS = {
  TRANSFER: 21000,
  ERC20_TRANSFER: 65000,
  ERC20_APPROVE: 45000,
  SWAP: 150000,
  ADD_LIQUIDITY: 200000,
  NFT_TRANSFER: 85000,
};

export const GAS_PERCENTILES = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  URGENT: 95,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  USER_POLICY: 'user_policy',
  WATCHLIST: 'watchlist',
  ALERT_HISTORY: 'alert_history',
  TX_HISTORY: 'tx_history',
  CACHED_CONTRACTS: 'cached_contracts',
  GAS_HISTORY: 'gas_history',
  USER_PREFERENCES: 'user_preferences',
  OVERRIDE_LOG: 'override_log',
} as const;

// ============================================================================
// API ENDPOINTS (mock - replace with actual)
// ============================================================================

export const API_ENDPOINTS = {
  TOKEN_PRICE: 'https://api.coingecko.com/api/v3/simple/token_price',
  TOKEN_INFO: 'https://api.coingecko.com/api/v3/coins',
  GAS_ORACLE: 'https://api.etherscan.io/api?module=gastracker',
  BLACKLIST: 'https://api.security.somnia.network/v1/blacklist',
  CONTRACT_VERIFICATION: 'https://api.somnia.network/v1/contract/verify',
} as const;

// ============================================================================
// TIMEOUTS & INTERVALS
// ============================================================================

export const TIMEOUTS = {
  ALERT_DISPLAY: 10000, // 10 seconds
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds
  SUBSCRIPTION_RECONNECT: 5000, // 5 seconds
  RPC_REQUEST: 10000, // 10 seconds
  SDS_CONNECTION: 30000, // 30 seconds
} as const;

export const INTERVALS = {
  GAS_UPDATE: 15000, // 15 seconds
  MEMPOOL_POLL: 5000, // 5 seconds
  CONTRACT_SYNC: 60000, // 1 minute
  TRENDING_UPDATE: 30000, // 30 seconds
  CACHE_CLEANUP: 300000, // 5 minutes
} as const;

// ============================================================================
// PERFORMANCE THRESHOLDS
// ============================================================================

export const PERFORMANCE = {
  ALERT_LATENCY_TARGET: 700, // ms
  MAX_ALERT_LATENCY: 2000, // ms
  MIN_CONFIDENCE: 0.7, // 70%
  HIGH_CONFIDENCE: 0.9, // 90%
  MAX_MEMORY_MB: 100,
  MAX_CPU_PERCENT: 10,
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  GAS_PREDICTOR: true,
  TRENDING_DETECTION: true,
  AUTO_CATEGORIZATION: true,
  RISK_BLOCKING: true,
  TELEMETRY: false,
  SIMULATION_SANDBOX: false,
  MULTI_CHAIN: false,
  COMMUNITY_WATCHLIST: false,
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  CONNECTION_FAILED: 'E001',
  INVALID_TRANSACTION: 'E002',
  POLICY_VIOLATION: 'E003',
  INSUFFICIENT_DATA: 'E004',
  TIMEOUT: 'E005',
  NETWORK_ERROR: 'E006',
  INVALID_ADDRESS: 'E007',
  UNKNOWN_ERROR: 'E999',
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const PATTERNS = {
  ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  AMOUNT: /^\d+(\.\d+)?$/,
  PERCENTAGE: /^-?\d+(\.\d+)?%?$/,
} as const;
