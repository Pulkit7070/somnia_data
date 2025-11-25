/**
 * @swc/sdk - Somnia Data Streams Client
 * Core client for interacting with Somnia Data Streams
 */

import EventEmitter from 'eventemitter3';
import { Logger } from '@swc/shared';
import { SchemaEncoder, computeSchemaId } from '../schemas/encoder';

const logger = new Logger('SDSClient');

export interface SDSConfig {
  endpoint: string;
  apiKey?: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface SDSSubscription {
  id: string;
  schemaId: string;
  callback: (event: SDSEvent) => void;
  createdAt: number;
}

export interface SDSEvent {
  schemaId: string;
  publisher: string;
  data: any;
  timestamp: number;
  blockNumber: number;
  txHash?: string;
}

/**
 * Somnia Data Streams Client
 * Manages connections and subscriptions to SDS
 */
export class SDSClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, SDSSubscription>();
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnecting = false;
  private isConnected = false;

  constructor(private config: SDSConfig) {
    super();
    this.config = {
      reconnect: true,
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  /**
   * Connect to SDS endpoint
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      logger.debug('Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    try {
      await this.establishConnection();
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');
      logger.info('Connected to SDS');
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to SDS:', error);
      this.handleReconnect();
      throw error;
    }
  }

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.apiKey
        ? `${this.config.endpoint}?apiKey=${this.config.apiKey}`
        : this.config.endpoint;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          logger.debug('WebSocket opened');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          logger.error('WebSocket error:', error);
          this.emit('error', error);
        };

        this.ws.onclose = () => {
          logger.debug('WebSocket closed');
          this.isConnected = false;
          this.emit('disconnected');
          this.handleReconnect();
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (!this.config.reconnect) {
      logger.info('Reconnect disabled');
      return;
    }

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      logger.error('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay! * this.reconnectAttempts;

    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => {
        logger.error('Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Subscribe to a schema
   */
  async subscribe(
    schema: string | SchemaEncoder,
    callback: (event: SDSEvent) => void
  ): Promise<string> {
    const encoder = typeof schema === 'string' ? new SchemaEncoder(schema) : schema;
    const schemaId = computeSchemaId(encoder.getSchema());

    if (!this.isConnected) {
      await this.connect();
    }

    const subscriptionId = this.generateSubscriptionId();
    const subscription: SDSSubscription = {
      id: subscriptionId,
      schemaId,
      callback,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Send subscription message to server
    const message = {
      type: 'subscribe',
      schemaId,
      subscriptionId,
    };

    this.send(message);

    logger.info(`Subscribed to schema ${schemaId} (${subscriptionId})`);
    this.emit('subscribed', { subscriptionId, schemaId });

    return subscriptionId;
  }

  /**
   * Unsubscribe from a schema
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      logger.warn(`Subscription ${subscriptionId} not found`);
      return;
    }

    const message = {
      type: 'unsubscribe',
      subscriptionId,
    };

    this.send(message);
    this.subscriptions.delete(subscriptionId);

    logger.info(`Unsubscribed from ${subscriptionId}`);
    this.emit('unsubscribed', { subscriptionId });
  }

  /**
   * Publish data to a schema
   */
  async publish(schema: string | SchemaEncoder, data: Record<string, any>): Promise<void> {
    const encoder = typeof schema === 'string' ? new SchemaEncoder(schema) : schema;
    const schemaId = computeSchemaId(encoder.getSchema());
    const encodedData = encoder.encode(data);

    if (!this.isConnected) {
      await this.connect();
    }

    const message = {
      type: 'publish',
      schemaId,
      data: encodedData,
      timestamp: Date.now(),
    };

    this.send(message);

    logger.debug(`Published data to schema ${schemaId}`);
    this.emit('published', { schemaId, data });
  }

  /**
   * Get data by key (for key-value schemas)
   */
  async getByKey(schemaId: string, key: string): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateSubscriptionId();

      const message = {
        type: 'get',
        schemaId,
        key,
        requestId,
      };

      const handler = (response: any) => {
        if (response.requestId === requestId) {
          this.off('get-response', handler);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      };

      this.on('get-response', handler);
      this.send(message);

      // Timeout
      setTimeout(() => {
        this.off('get-response', handler);
        reject(new Error('Get request timeout'));
      }, 10000);
    });
  }

  /**
   * Disconnect from SDS
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    logger.info('Disconnected from SDS');
    this.emit('disconnected');
  }

  /**
   * Check connection status
   */
  isConnectionOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get active subscriptions
   */
  getSubscriptions(): SDSSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  // Private methods

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'event':
          this.handleEvent(message);
          break;

        case 'get-response':
          this.emit('get-response', message);
          break;

        case 'error':
          logger.error('Server error:', message.error);
          this.emit('server-error', message.error);
          break;

        case 'pong':
          this.emit('pong');
          break;

        default:
          logger.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Failed to parse message:', error);
    }
  }

  private handleEvent(message: any): void {
    const event: SDSEvent = {
      schemaId: message.schemaId,
      publisher: message.publisher,
      data: message.data,
      timestamp: message.timestamp,
      blockNumber: message.blockNumber,
      txHash: message.txHash,
    };

    // Find matching subscriptions and call callbacks
    for (const subscription of this.subscriptions.values()) {
      if (subscription.schemaId === event.schemaId) {
        try {
          subscription.callback(event);
        } catch (error) {
          logger.error('Subscription callback error:', error);
        }
      }
    }

    this.emit('event', event);
  }

  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
