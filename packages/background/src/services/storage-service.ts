/**
 * Storage Service - IndexedDB wrapper with encryption
 * 
 * Manages persistent storage for:
 * - User settings
 * - Transaction history
 * - Alert history
 * - Watchlist
 * - Policy rules
 */

import { 
  STORAGE_KEYS, 
  Logger, 
  SecureStorage, 
  Transaction,
  Alert,
  PolicyRule,
  Settings 
} from '@swc/shared';

const logger = new Logger('StorageService');

export class StorageService {
  private storage: SecureStorage;
  private dbName = 'smart-wallet-copilot';
  private dbVersion = 1;
  private db?: IDBDatabase;

  constructor() {
    this.storage = new SecureStorage('swc');
  }

  async initialize() {
    try {
      // Initialize IndexedDB
      this.db = await this.openDatabase();
      
      // Load settings from chrome.storage
      const settings = await this.getSettings();
      if (!settings) {
        // Set defaults
        await this.saveSettings(this.getDefaultSettings());
      }

      logger.info('Storage initialized');
    } catch (error) {
      logger.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'hash' });
          txStore.createIndex('timestamp', 'timestamp', { unique: false });
          txStore.createIndex('from', 'from', { unique: false });
        }

        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
          alertStore.createIndex('timestamp', 'timestamp', { unique: false });
          alertStore.createIndex('level', 'level', { unique: false });
          alertStore.createIndex('dismissed', 'dismissed', { unique: false });
        }

        if (!db.objectStoreNames.contains('watchlist')) {
          db.createObjectStore('watchlist', { keyPath: 'address' });
        }
      };
    });
  }

  // Settings
  async getSettings(): Promise<Settings | null> {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
    return result[STORAGE_KEYS.SETTINGS] || null;
  }

  async saveSettings(settings: Settings) {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    logger.info('Settings saved');
  }

  private getDefaultSettings(): Settings {
    return {
      riskTolerance: 'balanced',
      autoBlock: true,
      notifications: {
        contractChanges: true,
        largeTransfers: true,
        gasPriceAlerts: true,
        trendingTokens: false,
      },
      thresholds: {
        maxTransferAmount: '1000000000000000000000', // 1000 ETH
        maxApprovalAmount: '1000000000000000000000000', // 1M tokens
        minContractAge: 7 * 24 * 60 * 60, // 7 days
        gasLimitWarning: 500000,
      },
      enabledRules: [
        'infinite-approval-001',
        'contract-state-change-001',
        'blacklisted-address-001',
        'large-transfer-001',
      ],
      telemetry: false,
    };
  }

  // Transaction History
  async saveTransaction(tx: Transaction & { category?: string; timestamp: number }) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.put(tx);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactionHistory(limit = 50, offset = 0): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const results: Transaction[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          if (count >= offset) {
            results.push(cursor.value);
          }
          count++;
          if (results.length < limit) {
            cursor.continue();
          } else {
            resolve(results);
          }
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Alerts
  async saveAlert(alert: Alert) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      const request = store.add({ ...alert, dismissed: false });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAlerts(limit = 100): Promise<Alert[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');

      const results: Alert[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async dismissAlert(alertId: string) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      const request = store.get(alertId);

      request.onsuccess = () => {
        const alert = request.result;
        if (alert) {
          alert.dismissed = true;
          store.put(alert);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAlertCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readonly');
      const store = transaction.objectStore('alerts');
      const index = store.index('dismissed');
      const request = index.count(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Watchlist
  async addToWatchlist(address: string, label?: string) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist'], 'readwrite');
      const store = transaction.objectStore('watchlist');
      const request = store.put({
        address,
        label: label || address,
        addedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromWatchlist(address: string) {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist'], 'readwrite');
      const store = transaction.objectStore('watchlist');
      const request = store.delete(address);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getWatchedContracts(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['watchlist'], 'readonly');
      const store = transaction.objectStore('watchlist');
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup old data
  async cleanup() {
    if (!this.db) return;

    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoff = Date.now() - maxAge;

    // Clean old transactions
    await this.cleanOldRecords('transactions', 'timestamp', cutoff);

    // Clean old dismissed alerts
    await this.cleanOldAlerts(cutoff);

    logger.info('Cleanup completed');
  }

  private cleanOldRecords(storeName: string, indexName: string, cutoff: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private cleanOldAlerts(cutoff: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['alerts'], 'readwrite');
      const store = transaction.objectStore('alerts');
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const alert = cursor.value;
          if (alert.dismissed) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

interface Settings {
  riskTolerance: 'conservative' | 'balanced' | 'aggressive';
  autoBlock: boolean;
  notifications: {
    contractChanges: boolean;
    largeTransfers: boolean;
    gasPriceAlerts: boolean;
    trendingTokens: boolean;
  };
  thresholds: {
    maxTransferAmount: string;
    maxApprovalAmount: string;
    minContractAge: number;
    gasLimitWarning: number;
  };
  enabledRules: string[];
  telemetry: boolean;
}
