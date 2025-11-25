/**
 * @swc/policy-engine - Rule: Infinite Approval Detection
 * Detects and blocks infinite token approvals to unknown contracts
 */

import {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
  RiskLevel,
  Logger,
} from '@swc/shared';

const logger = new Logger('InfiniteApprovalRule');

// Consider approval "infinite" if it's above this threshold (2^128)
const HIGH_APPROVAL_THRESHOLD = BigInt(2) ** BigInt(128);

/**
 * Infinite Approval Rule
 * Blocks approvals that grant infinite or very large allowances to unknown spenders
 */
export const infiniteApprovalRule: PolicyRule = {
  id: 'infinite-approval-001',
  name: 'Infinite Approval Detection',
  description:
    'Detects and blocks infinite token approvals to unknown or untrusted contracts',
  enabled: true,
  riskLevel: RiskLevel.HIGH,

  async evaluate(
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    // Check if this is an approval transaction
    if (!isApprovalTransaction(tx)) {
      return { triggered: false };
    }

    const { spender, amount } = parseApprovalData(tx);

    if (!spender || !amount) {
      return { triggered: false };
    }

    // Check if approval amount is very high
    const isInfinite = amount >= HIGH_APPROVAL_THRESHOLD;
    if (!isInfinite) {
      return { triggered: false };
    }

    // Check if spender is in watchlist (trusted contracts)
    const isTrusted = context.watchedContracts.has(spender.toLowerCase());
    if (isTrusted) {
      logger.debug(`Infinite approval to trusted contract ${spender}`);
      return { triggered: false };
    }

    // Check if spender is a known good contract
    const contractInfo = context.contractCache.get(spender.toLowerCase());
    if (contractInfo?.verified && contractInfo.createdAt) {
      const contractAge = context.currentTimestamp - contractInfo.createdAt;
      const minAge = context.userThresholds.minContractAge;

      if (contractAge >= minAge) {
        logger.debug(`Infinite approval to old verified contract ${spender}`);
        return {
          triggered: true,
          suggestedAction: 'warn',
          evidence: {
            spender,
            amount: amount.toString(),
            contractAge,
            verified: true,
          },
          message: `You are approving infinite spending to ${
            contractInfo.name || spender
          }. This is common for DEX interactions, but be cautious.`,
        };
      }
    }

    // Dangerous: infinite approval to unknown/new contract
    logger.warn(`Infinite approval to unknown contract ${spender}`);

    return {
      triggered: true,
      suggestedAction: 'block',
      evidence: {
        spender,
        amount: amount.toString(),
        token: tx.to,
        isInfinite: true,
        contractInfo: contractInfo || null,
      },
      message: `DANGER: You are about to approve infinite spending to an unknown contract (${spender}). This could allow the contract to steal all your tokens. Consider approving a specific amount instead.`,
    };
  },
};

/**
 * Check if transaction is an ERC20 approval
 */
function isApprovalTransaction(tx: Transaction): boolean {
  if (!tx.data) return false;

  // ERC20 approve() signature: 0x095ea7b3
  const approveSignature = '0x095ea7b3';
  return tx.data.toLowerCase().startsWith(approveSignature);
}

/**
 * Parse approval transaction data
 */
function parseApprovalData(tx: Transaction): {
  spender: string | null;
  amount: bigint | null;
} {
  if (!tx.data || tx.data.length < 138) {
    return { spender: null, amount: null };
  }

  try {
    // Skip function signature (10 chars: 0x + 8 hex)
    // Spender address (64 hex chars, last 40 are the address)
    const spenderHex = tx.data.slice(34, 74);
    const spender = '0x' + spenderHex;

    // Amount (next 64 hex chars)
    const amountHex = tx.data.slice(74, 138);
    const amount = BigInt('0x' + amountHex);

    return { spender, amount };
  } catch (error) {
    logger.error('Failed to parse approval data:', error);
    return { spender: null, amount: null };
  }
}
