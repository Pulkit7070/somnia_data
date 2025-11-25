/**
 * Smart Wallet Copilot - Background Service Worker
 * 
 * This is the main entry point for the Chrome extension's service worker.
 * It orchestrates all background operations including:
 * - Somnia Data Streams connection
 * - Policy engine evaluation
 * - Gas price prediction
 * - Transaction categorization
 * - Alert management
 */

import { MessageBus } from './services/message-bus';
import { SDSService } from './services/sds-service';
import { PolicyService } from './services/policy-service';
import { GasService } from './services/gas-service';
import { StorageService } from './services/storage-service';
import { MetaMaskService } from './services/metamask-service';
import { Logger } from '@swc/shared';

const logger = new Logger('Background');

class BackgroundService {
  private messageBus: MessageBus;
  private sdsService: SDSService;
  private policyService: PolicyService;
  private gasService: GasService;
  private storageService: StorageService;
  private metaMaskService: MetaMaskService;
  private isInitialized = false;

  constructor() {
    this.messageBus = new MessageBus();
    this.storageService = new StorageService();
    this.sdsService = new SDSService(this.messageBus, this.storageService);
    this.policyService = new PolicyService(this.messageBus, this.storageService);
    this.gasService = new GasService(this.messageBus);
    this.metaMaskService = new MetaMaskService(this.messageBus, this.policyService);
  }

  async initialize() {
    if (this.isInitialized) {
      logger.warn('Background service already initialized');
      return;
    }

    try {
      logger.info('Initializing Smart Wallet Copilot...');

      // Initialize storage
      await this.storageService.initialize();

      // Initialize policy engine with saved rules
      await this.policyService.initialize();

      // Connect to Somnia Data Streams
      await this.sdsService.connect();

      // Start gas prediction service
      this.gasService.start();

      // Set up MetaMask interceptor
      this.metaMaskService.start();

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up alarm listeners for periodic tasks
      this.setupAlarms();

      this.isInitialized = true;
      logger.info('Smart Wallet Copilot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize background service:', error);
      throw error;
    }
  }

  private setupMessageHandlers() {
    // Handle messages from UI
    this.messageBus.on('UI.GET_STATUS', async () => {
      return {
        sdsConnected: this.sdsService.isConnected(),
        watchedContracts: await this.storageService.getWatchedContracts(),
        alertCount: await this.storageService.getAlertCount(),
      };
    });

    this.messageBus.on('UI.ADD_WATCHLIST', async (data: { address: string; label?: string }) => {
      await this.sdsService.watchContract(data.address, data.label);
      return { success: true };
    });

    this.messageBus.on('UI.REMOVE_WATCHLIST', async (data: { address: string }) => {
      await this.sdsService.unwatchContract(data.address);
      return { success: true };
    });

    this.messageBus.on('UI.UPDATE_SETTINGS', async (data: { settings: any }) => {
      await this.storageService.saveSettings(data.settings);
      await this.policyService.updateSettings(data.settings);
      return { success: true };
    });

    this.messageBus.on('UI.GET_HISTORY', async (data: { limit?: number; offset?: number }) => {
      const history = await this.storageService.getTransactionHistory(data.limit, data.offset);
      return { history };
    });

    this.messageBus.on('UI.GET_ALERTS', async (data: { limit?: number }) => {
      const alerts = await this.storageService.getAlerts(data.limit);
      return { alerts };
    });

    this.messageBus.on('UI.DISMISS_ALERT', async (data: { alertId: string }) => {
      await this.storageService.dismissAlert(data.alertId);
      return { success: true };
    });

    this.messageBus.on('UI.GET_GAS_PREDICTION', async () => {
      const prediction = await this.gasService.getLatestPrediction();
      return { prediction };
    });
  }

  private setupAlarms() {
    // Clean old data daily
    chrome.alarms.create('cleanup', { periodInMinutes: 24 * 60 });

    // Update gas predictions every 15 seconds
    chrome.alarms.create('gas-update', { periodInMinutes: 0.25 });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'cleanup') {
        this.cleanup();
      } else if (alarm.name === 'gas-update') {
        this.gasService.update();
      }
    });
  }

  private async cleanup() {
    try {
      logger.info('Running cleanup...');
      await this.storageService.cleanup();
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }

  async shutdown() {
    logger.info('Shutting down Smart Wallet Copilot...');
    
    this.gasService.stop();
    this.metaMaskService.stop();
    await this.sdsService.disconnect();
    
    this.isInitialized = false;
    logger.info('Shutdown complete');
  }
}

// Initialize service when extension loads
const service = new BackgroundService();

chrome.runtime.onInstalled.addListener(async () => {
  logger.info('Extension installed/updated');
  await service.initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  logger.info('Browser started');
  await service.initialize();
});

// Handle extension suspend
self.addEventListener('suspend', () => {
  logger.info('Service worker suspending...');
  service.shutdown();
});

// Keep service worker alive
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Return true to indicate async response
  return true;
});

export { service };
