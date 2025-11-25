/**
 * @swc/policy-engine - Rule: Blacklisted Address Detection
 * Blocks transfers to known malicious or blacklisted addresses
 */

import {
  PolicyRule,
  PolicyContext,
  Transaction,
  PolicyEvaluationResult,
  RiskLevel,
  Logger,
} from '@swc/shared';

const logger = new Logger('BlacklistedAddressRule');

/**
 * Blacklisted Address Rule
 * Blocks transactions to addresses on the blacklist
 */
export const blacklistedAddressRule: PolicyRule = {
  id: 'blacklisted-address-001',
  name: 'Blacklisted Address Detection',
  description: 'Blocks transactions to known malicious or sanctioned addresses',
  enabled: true,
  riskLevel: RiskLevel.CRITICAL,

  async evaluate(
    tx: Transaction,
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    if (!tx.to) {
      return { triggered: false };
    }

    const recipient = tx.to.toLowerCase();

    // Check against blacklist
    if (context.blacklistedAddresses.has(recipient)) {
      logger.error(`Transaction to blacklisted address ${tx.to}`);

      return {
        triggered: true,
        suggestedAction: 'block',
        evidence: {
          recipient: tx.to,
          reason: 'Address is on the blacklist',
          from: tx.from,
          value: tx.value,
        },
        message: `BLOCKED: This address (${tx.to}) is on the blacklist due to known malicious activity or sanctions. Transaction has been blocked for your protection.`,
      };
    }

    // Also check if the sender is interacting with data that references blacklisted addresses
    if (tx.data) {
      const dataBlacklistViolation = checkDataForBlacklistedAddresses(
        tx.data,
        context.blacklistedAddresses
      );

      if (dataBlacklistViolation) {
        logger.error(`Transaction data contains blacklisted address`);

        return {
          triggered: true,
          suggestedAction: 'block',
          evidence: {
            blacklistedAddress: dataBlacklistViolation,
            transactionTo: tx.to,
            reason: 'Transaction data references blacklisted address',
          },
          message: `BLOCKED: This transaction references a blacklisted address (${dataBlacklistViolation}) in its data. This may be an attempt to interact with a malicious contract.`,
        };
      }
    }

    return { triggered: false };
  },
};

/**
 * Check transaction data for references to blacklisted addresses
 */
function checkDataForBlacklistedAddresses(
  data: string,
  blacklist: Set<string>
): string | null {
  if (!data || data.length < 10) {
    return null;
  }

  // Extract potential addresses from data (40 hex chars preceded by 24 zeros)
  // This is the standard ABI encoding for addresses
  const addressPattern = /000000000000000000000000([a-fA-F0-9]{40})/g;
  const matches = data.matchAll(addressPattern);

  for (const match of matches) {
    const address = '0x' + match[1].toLowerCase();
    if (blacklist.has(address)) {
      return address;
    }
  }

  return null;
}
