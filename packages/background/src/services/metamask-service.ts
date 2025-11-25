/**
 * MetaMask Service - Transaction interception and wallet integration
 * 
 * Intercepts MetaMask transactions for policy evaluation.
 */

import MMSDK from '@metamask/sdk';
import { MessageBus } from './message-bus';
import { PolicyService } from './policy-service';
import { Logger, Transaction } from '@swc/shared';

const logger = new Logger('MetaMaskService');

export class MetaMaskService {
  private messageBus: MessageBus;
  private policyService: PolicyService;
  private sdk?: typeof MMSDK;
  private provider?: any;

  constructor(messageBus: MessageBus, policyService: PolicyService) {
    this.messageBus = messageBus;
    this.policyService = policyService;
  }

  async start() {
    try {
      logger.info('Starting MetaMask service');

      // Initialize MetaMask SDK
      this.sdk = new MMSDK({
        dappMetadata: {
          name: 'Smart Wallet Copilot',
          url: 'https://smartwalletcopilot.io',
        },
        logging: {
          developerMode: false,
        },
      });

      // Connect to provider
      this.provider = await this.sdk.connect();

      // Set up transaction interception
      this.setupInterception();

      logger.info('MetaMask service started');
    } catch (error) {
      logger.error('Failed to start MetaMask service:', error);
    }
  }

  stop() {
    logger.info('MetaMask service stopped');
  }

  private setupInterception() {
    if (!this.provider) {
      logger.warn('Provider not available for interception');
      return;
    }

    // Intercept eth_sendTransaction
    const originalRequest = this.provider.request.bind(this.provider);

    this.provider.request = async (args: any) => {
      // Check if this is a transaction request
      if (args.method === 'eth_sendTransaction') {
        const tx = args.params[0];
        
        try {
          // Evaluate with policy engine
          const evaluation = await this.policyService.evaluateTransaction(tx);

          // If blocked, wait for user decision
          if (!evaluation.allowed) {
            logger.info('Transaction blocked by policy engine');

            // Emit alert and wait for user decision
            const decision = await this.waitForUserDecision(evaluation);

            if (decision === 'block') {
              throw new Error('Transaction blocked by Smart Wallet Copilot');
            }
            
            // User overrode - log and proceed
            logger.warn('User overrode policy block');
          }
        } catch (error) {
          logger.error('Transaction evaluation failed:', error);
          // Let transaction through if evaluation fails
        }
      }

      // Proceed with original request
      return originalRequest(args);
    };

    logger.info('Transaction interception set up');
  }

  private waitForUserDecision(evaluation: any): Promise<'block' | 'allow'> {
    return new Promise((resolve) => {
      // Emit alert to UI
      this.messageBus.sendToUI('POLICY.EVALUATION_RESULT', evaluation);

      // Listen for user decision
      const handler = (message: any) => {
        if (message.type === 'USER.TRANSACTION_DECISION') {
          chrome.runtime.onMessage.removeListener(handler);
          resolve(message.payload.decision);
        }
      };

      chrome.runtime.onMessage.addListener(handler);

      // Timeout after 5 minutes (user took too long)
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handler);
        resolve('block');
      }, 5 * 60 * 1000);
    });
  }
}
