/**
 * @swc/categorizer - Transaction Categorizer
 * Classifies transactions into categories (swap, transfer, mint, etc.)
 */

import {
  Transaction,
  TransactionCategory,
  TransactionMetadata,
  METHOD_SIGNATURES,
} from '@swc/shared';

export interface CategorizationResult {
  category: TransactionCategory;
  confidence: number;
  metadata: Partial<TransactionMetadata>;
}

export class TransactionCategorizer {
  /**
   * Categorize a transaction
   */
  async categorize(tx: Transaction): Promise<CategorizationResult> {
    if (!tx.data || tx.data === '0x' || tx.data.length < 10) {
      // Simple transfer
      return {
        category: TransactionCategory.TRANSFER,
        confidence: 1.0,
        metadata: {
          from: tx.from,
          to: tx.to || '',
          value: tx.value,
        },
      };
    }

    const methodSig = tx.data.slice(0, 10).toLowerCase();
    
    // ERC20 Operations
    if (methodSig === METHOD_SIGNATURES.APPROVE.toLowerCase()) {
      return this.categorizeApproval(tx);
    }
    
    if (
      methodSig === METHOD_SIGNATURES.TRANSFER.toLowerCase() ||
      methodSig === METHOD_SIGNATURES.TRANSFER_FROM.toLowerCase()
    ) {
      return this.categorizeTransfer(tx);
    }

    // DEX Swaps
    if (this.isSwapMethod(methodSig)) {
      return this.categorizeSwap(tx);
    }

    // Liquidity Operations
    if (this.isLiquidityMethod(methodSig)) {
      return this.categorizeLiquidity(tx);
    }

    // Staking
    if (this.isStakingMethod(methodSig)) {
      return this.categorizeStaking(tx);
    }

    // Minting
    if (methodSig === METHOD_SIGNATURES.MINT.toLowerCase()) {
      return this.categorizeMint(tx);
    }

    // Burning
    if (methodSig === METHOD_SIGNATURES.BURN.toLowerCase()) {
      return this.categorizeBurn(tx);
    }

    // NFT Operations
    if (this.isNFTMethod(methodSig)) {
      return this.categorizeNFT(tx);
    }

    // Unknown
    return {
      category: TransactionCategory.UNKNOWN,
      confidence: 0.5,
      metadata: { from: tx.from, to: tx.to || '' },
    };
  }

  private categorizeApproval(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.APPROVAL,
      confidence: 1.0,
      metadata: {
        from: tx.from,
        to: tx.to || '',
        protocol: 'ERC20',
      },
    };
  }

  private categorizeTransfer(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.TRANSFER,
      confidence: 1.0,
      metadata: {
        from: tx.from,
        to: tx.to || '',
      },
    };
  }

  private categorizeSwap(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.SWAP,
      confidence: 0.95,
      metadata: {
        from: tx.from,
        to: tx.to || '',
        protocol: this.detectProtocol(tx.to || ''),
      },
    };
  }

  private categorizeLiquidity(tx: Transaction): CategorizationResult {
    const methodSig = tx.data!.slice(0, 10).toLowerCase();
    const isAdd =
      methodSig === METHOD_SIGNATURES.ADD_LIQUIDITY.toLowerCase() ||
      methodSig === METHOD_SIGNATURES.ADD_LIQUIDITY_ETH.toLowerCase();

    return {
      category: isAdd ? TransactionCategory.LP_ADD : TransactionCategory.LP_REMOVE,
      confidence: 0.9,
      metadata: {
        from: tx.from,
        to: tx.to || '',
        protocol: this.detectProtocol(tx.to || ''),
      },
    };
  }

  private categorizeStaking(tx: Transaction): CategorizationResult {
    const methodSig = tx.data!.slice(0, 10).toLowerCase();
    const isStake = methodSig === METHOD_SIGNATURES.STAKE.toLowerCase();

    return {
      category: isStake ? TransactionCategory.STAKE : TransactionCategory.UNSTAKE,
      confidence: 0.85,
      metadata: { from: tx.from, to: tx.to || '' },
    };
  }

  private categorizeMint(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.MINT,
      confidence: 0.9,
      metadata: { from: tx.from, to: tx.to || '' },
    };
  }

  private categorizeBurn(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.BURN,
      confidence: 0.9,
      metadata: { from: tx.from, to: tx.to || '' },
    };
  }

  private categorizeNFT(tx: Transaction): CategorizationResult {
    return {
      category: TransactionCategory.NFT_PURCHASE,
      confidence: 0.85,
      metadata: { from: tx.from, to: tx.to || '' },
    };
  }

  private isSwapMethod(sig: string): boolean {
    const swapSigs = [
      METHOD_SIGNATURES.SWAP_EXACT_TOKENS_FOR_TOKENS,
      METHOD_SIGNATURES.SWAP_TOKENS_FOR_EXACT_TOKENS,
      METHOD_SIGNATURES.SWAP_EXACT_ETH_FOR_TOKENS,
      METHOD_SIGNATURES.SWAP_TOKENS_FOR_EXACT_ETH,
      METHOD_SIGNATURES.SWAP_EXACT_TOKENS_FOR_ETH,
      METHOD_SIGNATURES.SWAP_ETH_FOR_EXACT_TOKENS,
      METHOD_SIGNATURES.EXACT_INPUT,
      METHOD_SIGNATURES.EXACT_OUTPUT,
      METHOD_SIGNATURES.EXACT_INPUT_SINGLE,
      METHOD_SIGNATURES.EXACT_OUTPUT_SINGLE,
    ].map((s) => s.toLowerCase());

    return swapSigs.includes(sig);
  }

  private isLiquidityMethod(sig: string): boolean {
    const lpSigs = [
      METHOD_SIGNATURES.ADD_LIQUIDITY,
      METHOD_SIGNATURES.ADD_LIQUIDITY_ETH,
      METHOD_SIGNATURES.REMOVE_LIQUIDITY,
      METHOD_SIGNATURES.REMOVE_LIQUIDITY_ETH,
    ].map((s) => s.toLowerCase());

    return lpSigs.includes(sig);
  }

  private isStakingMethod(sig: string): boolean {
    const stakingSigs = [
      METHOD_SIGNATURES.STAKE,
      METHOD_SIGNATURES.UNSTAKE,
      METHOD_SIGNATURES.WITHDRAW,
      METHOD_SIGNATURES.CLAIM,
      METHOD_SIGNATURES.CLAIM_REWARDS,
    ].map((s) => s.toLowerCase());

    return stakingSigs.includes(sig);
  }

  private isNFTMethod(sig: string): boolean {
    const nftSigs = [
      METHOD_SIGNATURES.SAFE_TRANSFER_FROM,
      METHOD_SIGNATURES.SAFE_TRANSFER_FROM_WITH_DATA,
      METHOD_SIGNATURES.SET_APPROVAL_FOR_ALL,
    ].map((s) => s.toLowerCase());

    return nftSigs.includes(sig);
  }

  private detectProtocol(address: string): string {
    const addr = address.toLowerCase();
    const protocols: Record<string, string> = {
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2',
      '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3',
      '0x1111111254fb6c44bac0bed2854e76f90643097d': '1inch',
      '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap',
    };
    return protocols[addr] || 'Unknown';
  }
}

export const categorizer = new TransactionCategorizer();
export default categorizer;
