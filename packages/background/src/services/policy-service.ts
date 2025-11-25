/**
 * Policy Service - Transaction evaluation and risk detection
 * 
 * Integrates the policy engine with storage and messaging.
 * Evaluates transactions and emits alerts.
 */

import { PolicyEngine } from '@swc/policy-engine';
import { MessageBus } from './message-bus';
import { StorageService } from './storage-service';
import { Logger, Transaction, PolicyContext, Alert, RiskDetectedAlert } from '@swc/shared';
import {
  infiniteApprovalRule,
  contractStateChangeRule,
  blacklistedAddressRule,
  largeTransferRule,
} from '@swc/policy-engine';

const logger = new Logger('PolicyService');

export class PolicyService {
  private engine: PolicyEngine;
  private messageBus: MessageBus;
  private storageService: StorageService;

  constructor(messageBus: MessageBus, storageService: StorageService) {
    this.messageBus = messageBus;
    this.storageService = storageService;

    this.engine = new PolicyEngine({
      autoBlock: true,
      parallelExecution: false,
      enabledRules: [
        'infinite-approval-001',
        'contract-state-change-001',
        'blacklisted-address-001',
        'large-transfer-001',
      ],
    });
  }

  async initialize() {
    // Register default rules
    this.engine.registerRule(infiniteApprovalRule);
    this.engine.registerRule(contractStateChangeRule);
    this.engine.registerRule(blacklistedAddressRule);
    this.engine.registerRule(largeTransferRule);

    logger.info('Policy engine initialized with default rules');
  }

  async evaluateTransaction(tx: Transaction): Promise<any> {
    try {
      const context = await this.buildContext();
      const result = await this.engine.evaluateTransaction(tx, context);

      // Save alerts
      for (const alert of result.alerts) {
        await this.storageService.saveAlert(alert);
        
        // Emit to UI
        this.messageBus.sendToUI(alert.type, alert);
      }

      logger.info('Transaction evaluated', {
        allowed: result.allowed,
        riskLevel: result.riskLevel,
        triggeredRules: result.triggeredRules.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to evaluate transaction:', error);
      throw error;
    }
  }

  async updateSettings(settings: any) {
    // Update engine config
    this.engine.setConfig({
      autoBlock: settings.autoBlock,
      enabledRules: settings.enabledRules,
    });

    logger.info('Policy engine settings updated');
  }

  private async buildContext(): Promise<PolicyContext> {
    const settings = await this.storageService.getSettings();
    const watchedContracts = await this.storageService.getWatchedContracts();

    return {
      currentBlock: 0, // Will be fetched from chain
      currentTimestamp: Date.now(),
      watchedContracts: new Set(watchedContracts),
      blacklistedAddresses: new Set(),
      userThresholds: settings?.thresholds || {
        maxTransferAmount: '1000000000000000000000',
        maxApprovalAmount: '1000000000000000000000000',
        minContractAge: 7 * 24 * 60 * 60,
        gasLimitWarning: 500000,
      },
      contractCache: new Map(),
      historicalData: {
        gasHistory: [],
        tokenVolumes: new Map(),
        contractEvents: new Map(),
      },
    };
  }
}
