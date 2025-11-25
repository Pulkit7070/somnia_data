/**
 * @swc/policy-engine - Rule: Contract State Change Detection
 * Detects recent critical contract state changes (pause, ownership, upgrade)
 */

import {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
  RiskLevel,
  Logger,
  ContractInfo,
} from '@swc/shared';

const logger = new Logger('ContractStateChangeRule');

// Consider changes within this window as "recent" (24 hours)
const RECENT_CHANGE_WINDOW = 24 * 60 * 60 * 1000;

/**
 * Contract State Change Rule
 * Warns about transactions to contracts that recently changed state
 */
export const contractStateChangeRule: PolicyRule = {
  id: 'contract-state-change-001',
  name: 'Recent Contract State Change',
  description: 'Warns about interactions with contracts that recently changed critical state',
  enabled: true,
  riskLevel: RiskLevel.MEDIUM,

  async evaluate(
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    if (!tx.to) {
      return { triggered: false };
    }

    const contractAddress = tx.to.toLowerCase();
    const contractInfo = context.contractCache.get(contractAddress);

    if (!contractInfo) {
      // No cached info - might want to warn about unknown contracts
      return { triggered: false };
    }

    // Check for recent state changes
    const stateChangeRisk = checkStateChanges(contractInfo, context);
    if (stateChangeRisk) {
      return stateChangeRisk;
    }

    return { triggered: false };
  },
};

/**
 * Check for critical state changes
 */
function checkStateChanges(
  contractInfo: ContractInfo,
  context: PolicyContext
): PolicyEvaluationResult | null {
  const now = context.currentTimestamp;
  const lastChange = contractInfo.lastStateChange;

  if (!lastChange) {
    return null;
  }

  const timeSinceChange = now - lastChange;

  // Recent change detected
  if (timeSinceChange < RECENT_CHANGE_WINDOW) {
    // Check if contract is currently paused
    if (contractInfo.paused) {
      logger.warn(`Contract ${contractInfo.address} is paused`);
      return {
        triggered: true,
        suggestedAction: 'block',
        evidence: {
          contract: contractInfo.address,
          contractName: contractInfo.name,
          paused: true,
          lastStateChange: lastChange,
          timeSinceChange,
        },
        message: `BLOCKED: This contract (${
          contractInfo.name || contractInfo.address
        }) is currently PAUSED. Your transaction will likely fail.`,
      };
    }

    // Check for recent owner change
    const events = context.historicalData.contractEvents.get(contractInfo.address) || [];
    const recentOwnerChange = events.find(
      (e) => e.eventName === 'OwnershipTransferred' && now - e.timestamp < RECENT_CHANGE_WINDOW
    );

    if (recentOwnerChange) {
      logger.warn(`Contract ${contractInfo.address} recently changed ownership`);
      return {
        triggered: true,
        suggestedAction: 'warn',
        evidence: {
          contract: contractInfo.address,
          contractName: contractInfo.name,
          event: recentOwnerChange,
          timeSinceChange,
        },
        message: `WARNING: This contract's ownership was recently transferred (${formatTimeAgo(
          timeSinceChange
        )} ago). New owner: ${recentOwnerChange.params.newOwner}. Proceed with caution.`,
      };
    }

    // Check for recent upgrade
    const recentUpgrade = events.find(
      (e) => e.eventName === 'Upgraded' && now - e.timestamp < RECENT_CHANGE_WINDOW
    );

    if (recentUpgrade) {
      logger.warn(`Contract ${contractInfo.address} was recently upgraded`);
      return {
        triggered: true,
        suggestedAction: 'warn',
        evidence: {
          contract: contractInfo.address,
          contractName: contractInfo.name,
          event: recentUpgrade,
          timeSinceChange,
        },
        message: `WARNING: This contract was recently upgraded (${formatTimeAgo(
          timeSinceChange
        )} ago). The implementation may have changed. Review the changes before proceeding.`,
      };
    }
  }

  return null;
}

/**
 * Format time ago in human-readable format
 */
function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
