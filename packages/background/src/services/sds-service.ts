/**
 * SDS Service - Somnia Data Streams connection manager
 * 
 * Manages WebSocket connection to Somnia Data Streams and handles:
 * - Contract event subscriptions
 * - Token activity monitoring
 * - Real-time event processing
 */

import { SDSClient, SubscriptionManager } from '@swc/sdk';
import { MessageBus } from './message-bus';
import { StorageService } from './storage-service';
import { Logger, ContractInfo, AlertType, ContractChangeAlert } from '@swc/shared';

const logger = new Logger('SDSService');

export class SDSService {
  private client: SDSClient;
  private subscriptionManager: SubscriptionManager;
  private messageBus: MessageBus;
  private storageService: StorageService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(messageBus: MessageBus, storageService: StorageService) {
    this.messageBus = messageBus;
    this.storageService = storageService;
    
    // Initialize SDS client
    this.client = new SDSClient({
      url: 'wss://data-streams-testnet.somnia.network',
      reconnect: true,
      reconnectDelay: 5000,
      maxReconnectAttempts: this.maxReconnectAttempts,
    });

    this.subscriptionManager = new SubscriptionManager(this.client);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Connection events
    this.client.on('connected', () => {
      logger.info('Connected to Somnia Data Streams');
      this.reconnectAttempts = 0;
      this.messageBus.sendToUI('SDS.CONNECTED');
      this.resubscribeAll();
    });

    this.client.on('disconnected', () => {
      logger.warn('Disconnected from Somnia Data Streams');
      this.messageBus.sendToUI('SDS.DISCONNECTED');
    });

    this.client.on('error', (error) => {
      logger.error('SDS error:', error);
      this.messageBus.sendToUI('SDS.ERROR', { error: error.message });
    });

    // Contract events
    this.subscriptionManager.on('contract:paused', (data) => {
      this.handleContractPaused(data);
    });

    this.subscriptionManager.on('contract:unpaused', (data) => {
      this.handleContractUnpaused(data);
    });

    this.subscriptionManager.on('contract:ownership-transferred', (data) => {
      this.handleOwnershipTransferred(data);
    });

    this.subscriptionManager.on('contract:upgraded', (data) => {
      this.handleContractUpgraded(data);
    });

    // Token events
    this.subscriptionManager.on('token:transfer', (data) => {
      this.handleTokenTransfer(data);
    });

    this.subscriptionManager.on('token:approval', (data) => {
      this.handleTokenApproval(data);
    });
  }

  async connect() {
    try {
      await this.client.connect();
      logger.info('SDS client connected');
    } catch (error) {
      logger.error('Failed to connect to SDS:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.disconnect();
    logger.info('SDS client disconnected');
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  async watchContract(address: string, label?: string) {
    try {
      await this.storageService.addToWatchlist(address, label);
      
      // Subscribe to contract events
      await this.subscriptionManager.subscribeToContract(address, {
        eventTypes: ['Paused', 'Unpaused', 'OwnershipTransferred', 'Upgraded'],
      });

      logger.info(`Watching contract: ${address}`);
      
      // Notify UI
      this.messageBus.sendToUI('WATCHLIST.ADDED', { address, label });
    } catch (error) {
      logger.error(`Failed to watch contract ${address}:`, error);
      throw error;
    }
  }

  async unwatchContract(address: string) {
    try {
      await this.storageService.removeFromWatchlist(address);
      
      // Unsubscribe from contract events
      this.subscriptionManager.unsubscribe(`contract:${address}`);

      logger.info(`Stopped watching contract: ${address}`);
      
      // Notify UI
      this.messageBus.sendToUI('WATCHLIST.REMOVED', { address });
    } catch (error) {
      logger.error(`Failed to unwatch contract ${address}:`, error);
      throw error;
    }
  }

  private async resubscribeAll() {
    try {
      const watchedContracts = await this.storageService.getWatchedContracts();
      
      for (const address of watchedContracts) {
        await this.subscriptionManager.subscribeToContract(address, {
          eventTypes: ['Paused', 'Unpaused', 'OwnershipTransferred', 'Upgraded'],
        });
      }

      logger.info(`Resubscribed to ${watchedContracts.length} contracts`);
    } catch (error) {
      logger.error('Failed to resubscribe:', error);
    }
  }

  // Event handlers
  private async handleContractPaused(data: any) {
    const alert: ContractChangeAlert = {
      type: AlertType.CONTRACT_CHANGE,
      level: 'HIGH',
      contract: data.address,
      changeType: 'paused',
      timestamp: data.timestamp || Date.now(),
    };

    await this.storageService.saveAlert(alert);
    this.messageBus.sendToUI(AlertType.CONTRACT_CHANGE, alert);

    logger.info(`Contract paused: ${data.address}`);
  }

  private async handleContractUnpaused(data: any) {
    const alert: ContractChangeAlert = {
      type: AlertType.CONTRACT_CHANGE,
      level: 'MEDIUM',
      contract: data.address,
      changeType: 'unpaused',
      timestamp: data.timestamp || Date.now(),
    };

    await this.storageService.saveAlert(alert);
    this.messageBus.sendToUI(AlertType.CONTRACT_CHANGE, alert);

    logger.info(`Contract unpaused: ${data.address}`);
  }

  private async handleOwnershipTransferred(data: any) {
    const alert: ContractChangeAlert = {
      type: AlertType.CONTRACT_CHANGE,
      level: 'HIGH',
      contract: data.address,
      changeType: 'ownership',
      newOwner: data.newOwner,
      timestamp: data.timestamp || Date.now(),
    };

    await this.storageService.saveAlert(alert);
    this.messageBus.sendToUI(AlertType.CONTRACT_CHANGE, alert);

    logger.info(`Ownership transferred: ${data.address} -> ${data.newOwner}`);
  }

  private async handleContractUpgraded(data: any) {
    const alert: ContractChangeAlert = {
      type: AlertType.CONTRACT_CHANGE,
      level: 'HIGH',
      contract: data.address,
      changeType: 'upgraded',
      newImplementation: data.implementation,
      timestamp: data.timestamp || Date.now(),
    };

    await this.storageService.saveAlert(alert);
    this.messageBus.sendToUI(AlertType.CONTRACT_CHANGE, alert);

    logger.info(`Contract upgraded: ${data.address}`);
  }

  private async handleTokenTransfer(data: any) {
    // Log large transfers (handled by policy engine)
    logger.debug(`Token transfer: ${data.from} -> ${data.to}, amount: ${data.value}`);
  }

  private async handleTokenApproval(data: any) {
    // Log approvals (handled by policy engine)
    logger.debug(`Token approval: ${data.owner} -> ${data.spender}, amount: ${data.value}`);
  }
}
