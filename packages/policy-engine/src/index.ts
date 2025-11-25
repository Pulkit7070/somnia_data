/**
 * @swc/policy-engine - Main Export
 */

export * from './engine';
export * from './rules/infinite-approval';
export * from './rules/contract-state-change';
export * from './rules/blacklisted-address';
export * from './rules/large-transfer';

// Re-export types from shared
export type {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
} from '@swc/shared';
