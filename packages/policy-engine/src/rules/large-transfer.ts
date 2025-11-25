/**
 * @swc/policy-engine - Rule: Large Transfer Detection
 * Warns about transfers that exceed user-defined thresholds
 */

import {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
  RiskLevel,
  Logger,
  formatAmount,
} from '@swc/shared';

const logger = new Logger('LargeTransferRule');

/**
 * Large Transfer Rule
 * Warns when transfer amount exceeds user threshold
 */
export const largeTransferRule: PolicyRule = {
  id: 'large-transfer-001',
  name: 'Large Transfer Detection',
  description: 'Warns when transaction amount exceeds user-defined threshold',
  enabled: true,
  riskLevel: RiskLevel.MEDIUM,

  async evaluate(
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    const threshold = context.userThresholds.maxTransferAmount;

    if (!threshold || threshold === '0') {
      // No threshold set, skip check
      return { triggered: false };
    }

    // Check native token transfer
    if (tx.value && tx.value !== '0') {
      const value = BigInt(tx.value);
      const thresholdValue = BigInt(threshold);

      if (value > thresholdValue) {
        logger.warn(`Large native token transfer detected: ${tx.value}`);

        return {
          triggered: true,
          suggestedAction: 'warn',
          evidence: {
            amount: tx.value,
            threshold,
            to: tx.to,
            from: tx.from,
            type: 'native',
          },
          message: `WARNING: You are about to transfer ${formatAmount(
            tx.value,
            18,
            4
          )} tokens to ${tx.to}. This exceeds your warning threshold of ${formatAmount(
            threshold,
            18,
            4
          )}. Please verify the recipient address.`,
        };
      }
    }

    // Check ERC20 transfer in data
    if (tx.data && isERC20Transfer(tx.data)) {
      const amount = parseERC20TransferAmount(tx.data);
      if (amount) {
        const thresholdValue = BigInt(threshold);

        if (amount > thresholdValue) {
          logger.warn(`Large ERC20 transfer detected: ${amount}`);

          return {
            triggered: true,
            suggestedAction: 'warn',
            evidence: {
              amount: amount.toString(),
              threshold,
              token: tx.to,
              type: 'erc20',
            },
            message: `WARNING: You are about to transfer a large amount of tokens. Amount: ${formatAmount(
              amount.toString(),
              18,
              4
            )}. Verify the transaction details carefully.`,
          };
        }
      }
    }

    return { triggered: false };
  },
};

/**
 * Check if transaction is ERC20 transfer
 */
function isERC20Transfer(data: string): boolean {
  // ERC20 transfer() signature: 0xa9059cbb
  // ERC20 transferFrom() signature: 0x23b872dd
  return (
    data.toLowerCase().startsWith('0xa9059cbb') ||
    data.toLowerCase().startsWith('0x23b872dd')
  );
}

/**
 * Parse ERC20 transfer amount from transaction data
 */
function parseERC20TransferAmount(data: string): bigint | null {
  try {
    if (data.startsWith('0xa9059cbb')) {
      // transfer(address to, uint256 amount)
      // Amount is in bytes 36-68 (after function sig and to address)
      if (data.length >= 138) {
        const amountHex = data.slice(74, 138);
        return BigInt('0x' + amountHex);
      }
    } else if (data.startsWith('0x23b872dd')) {
      // transferFrom(address from, address to, uint256 amount)
      // Amount is in bytes 68-100
      if (data.length >= 202) {
        const amountHex = data.slice(138, 202);
        return BigInt('0x' + amountHex);
      }
    }
  } catch (error) {
    logger.error('Failed to parse ERC20 transfer amount:', error);
  }

  return null;
}
