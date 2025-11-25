/**
 * @swc/sdk - Somnia Data Streams Schema Encoder
 * Handles schema encoding/decoding for SDS
 */

import { Logger } from '@swc/shared';

const logger = new Logger('SchemaEncoder');

export interface SchemaField {
  name: string;
  type: string;
  size?: number;
}

export class SchemaEncoder {
  private fields: SchemaField[] = [];

  constructor(private schema: string) {
    this.parseSchema(schema);
  }

  /**
   * Parse schema string into fields
   * Example: "uint64 timestamp, int32 latitude, bytes32 entityId"
   */
  private parseSchema(schema: string): void {
    const parts = schema.split(',').map((s) => s.trim());

    for (const part of parts) {
      const tokens = part.split(/\s+/);
      if (tokens.length !== 2) {
        throw new Error(`Invalid schema field: ${part}`);
      }

      const [type, name] = tokens;
      this.fields.push(this.parseField(type, name));
    }

    logger.debug(`Parsed schema with ${this.fields.length} fields:`, this.fields);
  }

  private parseField(type: string, name: string): SchemaField {
    const field: SchemaField = { name, type };

    // Extract size from type (e.g., uint256, bytes32)
    const sizeMatch = type.match(/\d+/);
    if (sizeMatch) {
      field.size = parseInt(sizeMatch[0], 10);
    }

    return field;
  }

  /**
   * Encode data according to schema
   */
  encode(data: Record<string, any>): string {
    const values: string[] = [];

    for (const field of this.fields) {
      const value = data[field.name];
      if (value === undefined) {
        throw new Error(`Missing field: ${field.name}`);
      }

      values.push(this.encodeValue(value, field));
    }

    return '0x' + values.join('');
  }

  private encodeValue(value: any, field: SchemaField): string {
    const baseType = field.type.replace(/\d+/, '');

    switch (baseType) {
      case 'uint':
      case 'int': {
        const size = field.size || 256;
        const hex = BigInt(value).toString(16);
        return hex.padStart((size / 8) * 2, '0');
      }

      case 'address': {
        return value.slice(2).padStart(40, '0');
      }

      case 'bool': {
        return value ? '01' : '00';
      }

      case 'bytes': {
        if (field.size) {
          // Fixed size bytes
          const hex = value.startsWith('0x') ? value.slice(2) : value;
          return hex.padEnd(field.size * 2, '0');
        } else {
          // Dynamic bytes (length-prefixed)
          const hex = value.startsWith('0x') ? value.slice(2) : value;
          const length = (hex.length / 2).toString(16).padStart(64, '0');
          return length + hex;
        }
      }

      case 'string': {
        const utf8 = Buffer.from(value, 'utf-8').toString('hex');
        const length = (utf8.length / 2).toString(16).padStart(64, '0');
        return length + utf8;
      }

      default:
        throw new Error(`Unsupported type: ${field.type}`);
    }
  }

  /**
   * Decode data according to schema
   */
  decode(data: string): Record<string, any> {
    const hex = data.startsWith('0x') ? data.slice(2) : data;
    const result: Record<string, any> = {};
    let offset = 0;

    for (const field of this.fields) {
      const { value, consumed } = this.decodeValue(hex, offset, field);
      result[field.name] = value;
      offset += consumed;
    }

    return result;
  }

  private decodeValue(
    hex: string,
    offset: number,
    field: SchemaField
  ): { value: any; consumed: number } {
    const baseType = field.type.replace(/\d+/, '');

    switch (baseType) {
      case 'uint':
      case 'int': {
        const size = field.size || 256;
        const bytes = (size / 8) * 2;
        const chunk = hex.slice(offset, offset + bytes);
        const value = BigInt('0x' + chunk);
        return { value: value.toString(), consumed: bytes };
      }

      case 'address': {
        const chunk = hex.slice(offset, offset + 40);
        return { value: '0x' + chunk, consumed: 40 };
      }

      case 'bool': {
        const chunk = hex.slice(offset, offset + 2);
        return { value: chunk !== '00', consumed: 2 };
      }

      case 'bytes': {
        if (field.size) {
          const bytes = field.size * 2;
          const chunk = hex.slice(offset, offset + bytes);
          return { value: '0x' + chunk, consumed: bytes };
        } else {
          const lengthHex = hex.slice(offset, offset + 64);
          const length = parseInt(lengthHex, 16) * 2;
          const chunk = hex.slice(offset + 64, offset + 64 + length);
          return { value: '0x' + chunk, consumed: 64 + length };
        }
      }

      case 'string': {
        const lengthHex = hex.slice(offset, offset + 64);
        const length = parseInt(lengthHex, 16) * 2;
        const chunk = hex.slice(offset + 64, offset + 64 + length);
        const value = Buffer.from(chunk, 'hex').toString('utf-8');
        return { value, consumed: 64 + length };
      }

      default:
        throw new Error(`Unsupported type: ${field.type}`);
    }
  }

  /**
   * Get schema definition
   */
  getSchema(): string {
    return this.schema;
  }

  /**
   * Get parsed fields
   */
  getFields(): SchemaField[] {
    return [...this.fields];
  }
}

/**
 * Compute schema ID (keccak256 hash of schema string)
 */
export function computeSchemaId(schema: string): string {
  // In production, use a proper keccak256 implementation
  // For now, use a simple hash
  let hash = 0;
  for (let i = 0; i < schema.length; i++) {
    hash = (hash << 5) - hash + schema.charCodeAt(i);
    hash = hash & hash;
  }
  
  const hashHex = Math.abs(hash).toString(16).padStart(64, '0');
  return '0x' + hashHex;
}
