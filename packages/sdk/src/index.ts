/**
 * @swc/sdk - Main Export
 */

// Schema
export * from './schemas/encoder';

// Streams
export * from './streams/client';
export * from './streams/subscription-manager';

// Re-export types from shared
export type {
  SDSSchema,
  SDSEvent,
  ContractMetadataEvent,
  TokenActivityEvent,
} from '@swc/shared';

export { SCHEMA_DEFINITIONS } from '@swc/shared';
