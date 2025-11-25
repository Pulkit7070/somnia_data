/**
 * Message Bus - Inter-component communication
 * 
 * Handles message passing between background service, content scripts, and UI.
 * Supports both event-driven (pub/sub) and request-response patterns.
 */

import { Command, CommandType, CommandResponse } from '@swc/shared';
import { Logger } from '@swc/shared';

const logger = new Logger('MessageBus');

type MessageHandler = (data: any) => Promise<any> | any;

export class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();
  private requestId = 0;

  constructor() {
    // Set up Chrome message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleChromeMessage(message, sender)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Message handler error:', error);
          sendResponse({ error: error.message });
        });
      
      // Return true to indicate async response
      return true;
    });
  }

  /**
   * Register a message handler
   */
  on(type: CommandType | string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Unregister a message handler
   */
  off(type: CommandType | string, handler: MessageHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all handlers (fire-and-forget)
   */
  async emit(type: CommandType | string, data?: any) {
    const handlers = this.handlers.get(type) || [];
    
    try {
      await Promise.all(
        handlers.map((handler) => 
          Promise.resolve(handler(data)).catch((error) => {
            logger.error(`Handler error for ${type}:`, error);
          })
        )
      );
    } catch (error) {
      logger.error(`Failed to emit ${type}:`, error);
    }
  }

  /**
   * Send a message and wait for response (request-response)
   */
  async send(type: CommandType | string, data?: any): Promise<any> {
    const handlers = this.handlers.get(type) || [];
    
    if (handlers.length === 0) {
      throw new Error(`No handler registered for ${type}`);
    }

    // Execute first handler (request-response pattern)
    const handler = handlers[0];
    return await Promise.resolve(handler(data));
  }

  /**
   * Send message to UI (all tabs with extension popup/page)
   */
  async sendToUI(type: CommandType | string, data?: any) {
    const message: Command = {
      type: type as CommandType,
      payload: data,
      timestamp: Date.now(),
    };

    // Send to all extension contexts
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Extension context might not be available
      logger.debug('Failed to send to UI:', error);
    }

    // Send to all tabs with content script
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Content script might not be injected
          logger.debug(`Failed to send to tab ${tab.id}:`, error);
        }
      }
    }
  }

  /**
   * Send message to specific tab
   */
  async sendToTab(tabId: number, type: CommandType | string, data?: any) {
    const message: Command = {
      type: type as CommandType,
      payload: data,
      timestamp: Date.now(),
    };

    await chrome.tabs.sendMessage(tabId, message);
  }

  /**
   * Handle incoming Chrome messages
   */
  private async handleChromeMessage(message: any, sender: chrome.runtime.MessageSender): Promise<CommandResponse> {
    try {
      const command = message as Command;
      
      logger.debug(`Received message: ${command.type}`, {
        from: sender.tab?.id || 'extension',
        payload: command.payload,
      });

      // Execute handlers
      const handlers = this.handlers.get(command.type) || [];
      
      if (handlers.length === 0) {
        return {
          success: false,
          error: `No handler for ${command.type}`,
        };
      }

      // Execute first handler for request-response
      const result = await Promise.resolve(handlers[0](command.payload));
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      logger.error('Message handling error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a unique request ID
   */
  private getRequestId(): number {
    return ++this.requestId;
  }
}
