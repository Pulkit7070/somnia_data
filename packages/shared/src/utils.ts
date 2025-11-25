/**
 * @swc/shared - Utility Functions
 */

import { Result, Message, MessageResponse } from './types';

// ============================================================================
// ADDRESS UTILITIES
// ============================================================================

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function shortenAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function compareAddresses(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

// ============================================================================
// NUMBER & AMOUNT UTILITIES
// ============================================================================

export function formatAmount(
  amount: string | number,
  decimals: number = 18,
  precision: number = 4
): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmed = fractionStr.slice(0, precision).replace(/0+$/, '');

  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function parseAmount(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function formatGwei(wei: string | number): string {
  const gwei = Number(wei) / 1e9;
  return gwei.toFixed(2);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// RESULT UTILITIES
// ============================================================================

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Result<T, never> {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is Result<never, E> {
  return result.ok === false;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }

  throw lastError!;
}

export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

// ============================================================================
// MESSAGE BUS UTILITIES
// ============================================================================

export function createMessage<T>(
  type: string,
  payload: T,
  sender: 'ui' | 'background' = 'ui'
): Message<T> {
  return {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
    sender,
  };
}

export function createSuccessResponse<T>(
  id: string,
  data: T
): MessageResponse<T> {
  return {
    id,
    success: true,
    data,
    timestamp: Date.now(),
  };
}

export function createErrorResponse(
  id: string,
  error: string
): MessageResponse<never> {
  return {
    id,
    success: false,
    error,
    timestamp: Date.now(),
  };
}

// ============================================================================
// ID & HASH UTILITIES
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateTransaction(tx: any): boolean {
  if (!tx || typeof tx !== 'object') return false;
  if (!isValidAddress(tx.from)) return false;
  if (!isValidAddress(tx.to)) return false;
  return true;
}

export function validateThreshold(value: string, decimals: number = 18): boolean {
  try {
    const parsed = parseAmount(value, decimals);
    return parsed >= BigInt(0);
  } catch {
    return false;
  }
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export class Cache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();

  constructor(private ttl: number = 300000) {} // 5 minutes default

  set(key: K, value: V, ttl?: number): void {
    const expiry = Date.now() + (ttl ?? this.ttl);
    this.cache.set(key, { value, expiry });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export class SecureStorage {
  constructor(private prefix: string = 'swc_') {}

  async set<T>(key: string, value: T): Promise<void> {
    const data = JSON.stringify(value);
    const encoded = btoa(data); // Simple encoding (not encryption)
    localStorage.setItem(this.prefix + key, encoded);
  }

  async get<T>(key: string): Promise<T | null> {
    const encoded = localStorage.getItem(this.prefix + key);
    if (!encoded) return null;

    try {
      const data = atob(encoded);
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(this.prefix)
    );
    keys.forEach((k) => localStorage.removeItem(k));
  }
}

// ============================================================================
// LOGGER
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  constructor(
    private context: string,
    private level: LogLevel = LogLevel.INFO
  ) {}

  debug(...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.context}]`, ...args);
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.context}]`, ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.context}]`, ...args);
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.context}]`, ...args);
    }
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await sleep(waitTime);
      return this.acquire();
    }

    this.requests.push(now);
  }
}
