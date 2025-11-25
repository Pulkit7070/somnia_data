'use client';

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';

interface HistoryProps {
  address: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  category?: string;
  status: 'success' | 'failed' | 'pending';
}

export default function History({ address }: HistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    loadTransactions();
  }, [address]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Load from localStorage for now
      const saved = localStorage.getItem('transactionHistory');
      if (saved) {
        setTransactions(JSON.parse(saved));
      }

      // In production, fetch from blockchain/indexer
      // const txs = await fetchTransactions(address);
      // setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category?: string) => {
    const styles: Record<string, string> = {
      swap: 'bg-blue-primary/10 text-blue-primary',
      transfer: 'bg-status-success/10 text-status-success',
      approval: 'bg-status-warning/10 text-status-warning',
      mint: 'bg-status-success/10 text-status-success',
      burn: 'bg-status-error/10 text-status-error',
    };
    const style = styles[category || ''] || 'bg-dark-hover text-text-secondary';
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style}`}>
        {category || 'unknown'}
      </span>
    );
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Transaction History</h2>
        <p className="text-sm text-text-secondary mt-1">
          View and analyze your past transactions with AI-powered categorization
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Transactions Yet</h3>
          <p className="text-text-secondary">
            Your transaction history will appear here once you start using the connected wallet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.hash} className="card hover:bg-dark-hover transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getCategoryBadge(tx.category)}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    tx.status === 'success' ? 'bg-status-success/10 text-status-success' :
                    tx.status === 'failed' ? 'bg-status-error/10 text-status-error' :
                    'bg-status-warning/10 text-status-warning'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">{formatTime(tx.timestamp)}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary w-16">From:</span>
                  <code className="text-text-primary font-mono text-xs">{truncateAddress(tx.from)}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary w-16">To:</span>
                  <code className="text-text-primary font-mono text-xs">{truncateAddress(tx.to)}</code>
                </div>
                {tx.value && tx.value !== '0' && (
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary w-16">Value:</span>
                    <span className="text-text-primary">{parseFloat(tx.value).toFixed(4)} ETH</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-dark-border">
                <a
                  href={`https://explorer-testnet.somnia.network/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-primary hover:text-blue-hover flex items-center gap-1"
                >
                  View on Explorer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
