/**
 * @swc/sdk - Subscription Manager
 * Manages multiple SDS subscriptions with priority and deduplication
 */

import EventEmitter from 'eventemitter3';
import { Logger } from '@swc/shared';
import { SDSClient, SDSEvent } from './client';
import { SchemaEncoder } from '../schemas/encoder';

const logger = new Logger('SubscriptionManager');

export interface ManagedSubscription {
  id: string;
  target: string;
  targetType: 'contract' | 'token' | 'schema';
  schemaId: string;
  priority: number;
  active: boolean;
  createdAt: number;
  lastEvent?: number;
  eventCount: number;
}

export interface SubscriptionOptions {
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Subscription Manager
 * Handles subscription lifecycle, deduplication, and priority
 */
export class SubscriptionManager extends EventEmitter {
  private subscriptions = new Map<string, ManagedSubscription>();
  private schemaEncoders = new Map<string, SchemaEncoder>();
  private targetToSubscription = new Map<string, string>(); // target -> subscription ID

  constructor(private client: SDSClient) {
    super();
    this.setupClientListeners();
  }

  private setupClientListeners(): void {
    this.client.on('event', (event: SDSEvent) => {
      this.handleEvent(event);
    });

    this.client.on('disconnected', () => {
      this.emit('disconnected');
    });

    this.client.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Subscribe to contract events
   */
  async subscribeToContract(
    contractAddress: string,
    schema: string,
    options: SubscriptionOptions = {}
  ): Promise<string> {
    // Check if already subscribed
    const existing = this.targetToSubscription.get(contractAddress);
    if (existing) {
      logger.info(`Already subscribed to contract ${contractAddress}`);
      return existing;
    }

    const encoder = new SchemaEncoder(schema);
    const schemaId = this.computeSchemaId(schema);

    // Subscribe to SDS
    const sdsSubscriptionId = await this.client.subscribe(encoder, (event) => {
      // Filter events for this specific contract
      if (this.matchesContract(event, contractAddress)) {
        this.handleContractEvent(contractAddress, event);
      }
    });

    const subscription: ManagedSubscription = {
      id: sdsSubscriptionId,
      target: contractAddress,
      targetType: 'contract',
      schemaId,
      priority: options.priority || 0,
      active: true,
      createdAt: Date.now(),
      eventCount: 0,
    };

    this.subscriptions.set(sdsSubscriptionId, subscription);
    this.targetToSubscription.set(contractAddress, sdsSubscriptionId);
    this.schemaEncoders.set(schemaId, encoder);

    logger.info(`Subscribed to contract ${contractAddress}`);
    this.emit('subscription-added', subscription);

    return sdsSubscriptionId;
  }

  /**
   * Subscribe to token events
   */
  async subscribeToToken(
    tokenAddress: string,
    schema: string,
    options: SubscriptionOptions = {}
  ): Promise<string> {
    const existing = this.targetToSubscription.get(tokenAddress);
    if (existing) {
      logger.info(`Already subscribed to token ${tokenAddress}`);
      return existing;
    }

    const encoder = new SchemaEncoder(schema);
    const schemaId = this.computeSchemaId(schema);

    const sdsSubscriptionId = await this.client.subscribe(encoder, (event) => {
      if (this.matchesToken(event, tokenAddress)) {
        this.handleTokenEvent(tokenAddress, event);
      }
    });

    const subscription: ManagedSubscription = {
      id: sdsSubscriptionId,
      target: tokenAddress,
      targetType: 'token',
      schemaId,
      priority: options.priority || 0,
      active: true,
      createdAt: Date.now(),
      eventCount: 0,
    };

    this.subscriptions.set(sdsSubscriptionId, subscription);
    this.targetToSubscription.set(tokenAddress, sdsSubscriptionId);
    this.schemaEncoders.set(schemaId, encoder);

    logger.info(`Subscribed to token ${tokenAddress}`);
    this.emit('subscription-added', subscription);

    return sdsSubscriptionId;
  }

  /**
   * Subscribe to raw schema
   */
  async subscribeToSchema(
    schema: string,
    callback: (event: SDSEvent) => void,
    options: SubscriptionOptions = {}
  ): Promise<string> {
    const encoder = new SchemaEncoder(schema);
    const schemaId = this.computeSchemaId(schema);

    const existing = this.targetToSubscription.get(schemaId);
    if (existing) {
      logger.info(`Already subscribed to schema ${schemaId}`);
      return existing;
    }

    const sdsSubscriptionId = await this.client.subscribe(encoder, callback);

    const subscription: ManagedSubscription = {
      id: sdsSubscriptionId,
      target: schemaId,
      targetType: 'schema',
      schemaId,
      priority: options.priority || 0,
      active: true,
      createdAt: Date.now(),
      eventCount: 0,
    };

    this.subscriptions.set(sdsSubscriptionId, subscription);
    this.targetToSubscription.set(schemaId, sdsSubscriptionId);
    this.schemaEncoders.set(schemaId, encoder);

    logger.info(`Subscribed to schema ${schemaId}`);
    this.emit('subscription-added', subscription);

    return sdsSubscriptionId;
  }

  /**
   * Unsubscribe from target
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      logger.warn(`Subscription ${subscriptionId} not found`);
      return;
    }

    await this.client.unsubscribe(subscriptionId);

    this.subscriptions.delete(subscriptionId);
    this.targetToSubscription.delete(subscription.target);

    // Clean up encoder if no more subscriptions use it
    const hasOtherSubscriptions = Array.from(this.subscriptions.values()).some(
      (sub) => sub.schemaId === subscription.schemaId
    );
    if (!hasOtherSubscriptions) {
      this.schemaEncoders.delete(subscription.schemaId);
    }

    logger.info(`Unsubscribed from ${subscription.target}`);
    this.emit('subscription-removed', subscription);
  }

  /**
   * Unsubscribe by target
   */
  async unsubscribeByTarget(target: string): Promise<void> {
    const subscriptionId = this.targetToSubscription.get(target);
    if (subscriptionId) {
      await this.unsubscribe(subscriptionId);
    }
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): ManagedSubscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.active);
  }

  /**
   * Get subscription by target
   */
  getSubscriptionByTarget(target: string): ManagedSubscription | undefined {
    const subscriptionId = this.targetToSubscription.get(target);
    return subscriptionId ? this.subscriptions.get(subscriptionId) : undefined;
  }

  /**
   * Pause subscription
   */
  pause(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      logger.info(`Paused subscription ${subscriptionId}`);
    }
  }

  /**
   * Resume subscription
   */
  resume(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = true;
      logger.info(`Resumed subscription ${subscriptionId}`);
    }
  }

  /**
   * Clear all subscriptions
   */
  async clear(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    await Promise.all(subscriptionIds.map((id) => this.unsubscribe(id)));
    logger.info('Cleared all subscriptions');
  }

  // Private methods

  private handleEvent(event: SDSEvent): void {
    // Update statistics
    for (const subscription of this.subscriptions.values()) {
      if (subscription.schemaId === event.schemaId && subscription.active) {
        subscription.lastEvent = event.timestamp;
        subscription.eventCount++;
      }
    }
  }

  private handleContractEvent(contractAddress: string, event: SDSEvent): void {
    this.emit('contract-event', {
      contract: contractAddress,
      event,
    });
  }

  private handleTokenEvent(tokenAddress: string, event: SDSEvent): void {
    this.emit('token-event', {
      token: tokenAddress,
      event,
    });
  }

  private matchesContract(event: SDSEvent, contractAddress: string): boolean {
    // Check if event data contains the contract address
    if (event.data.contractAddress) {
      return event.data.contractAddress.toLowerCase() === contractAddress.toLowerCase();
    }
    return false;
  }

  private matchesToken(event: SDSEvent, tokenAddress: string): boolean {
    if (event.data.tokenAddress) {
      return event.data.tokenAddress.toLowerCase() === tokenAddress.toLowerCase();
    }
    return false;
  }

  private computeSchemaId(schema: string): string {
    // Simple hash for now - in production use keccak256
    let hash = 0;
    for (let i = 0; i < schema.length; i++) {
      hash = (hash << 5) - hash + schema.charCodeAt(i);
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}
