import React, { useEffect, useState } from 'react';

export const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'UI.GET_HISTORY',
        payload: { limit: 50, offset: 0 }
      });
      if (response?.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
      
      {history.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-gray-600 mb-2">No transactions yet</p>
          <p className="text-sm text-gray-500">
            Your transaction history will appear here once you start using the wallet
          </p>
        </div>
      ) : (
        history.map((tx, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCategoryIcon(tx.category)}</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {tx.category || 'Unknown'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTime(tx.timestamp)}
              </span>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">From:</span>
                <span className="font-mono">{truncateAddress(tx.from)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">To:</span>
                <span className="font-mono">{truncateAddress(tx.to)}</span>
              </div>
              {tx.value && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium">Value:</span>
                  <span>{formatValue(tx.value)} ETH</span>
                </div>
              )}
            </div>

            {tx.hash && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <a
                  href={`https://explorer-testnet.somnia.network/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-primary hover:text-brand-secondary flex items-center gap-1"
                >
                  View on Explorer
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

function getCategoryIcon(category?: string): string {
  const icons: Record<string, string> = {
    swap: '🔄',
    transfer: '💸',
    approval: '✅',
    mint: '🏭',
    burn: '🔥',
    'liquidity-add': '➕',
    'liquidity-remove': '➖',
    stake: '🔒',
    unstake: '🔓',
    claim: '🎁',
    'nft-transfer': '🖼️',
    'nft-mint': '🎨',
    bridge: '🌉',
    airdrop: '🪂',
  };
  return icons[category || ''] || '📄';
}

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatValue(value: string): string {
  try {
    const eth = BigInt(value) / BigInt(1e18);
    return eth.toString();
  } catch {
    return '0';
  }
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
